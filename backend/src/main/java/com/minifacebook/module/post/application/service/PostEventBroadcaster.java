package com.minifacebook.module.post.application.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.minifacebook.module.post.application.dto.PostCountEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Sinks;

import java.io.IOException;
import java.util.Optional;

/**
 * Broadcast post count updates via SSE với Reactive Redis Pub/Sub.
 *
 * <p>Dùng {@link Sinks.Many} trong process để buffer events và {@link ReactiveRedisTemplate}
 * để publish/subscribe cross-server. Khi có nhiều server, mỗi server:
 * <ul>
 *   <li>Subcribe vào Redis channel {@code post:events} để nhận events từ server khác</li>
 *   <li>Khi local broadcast() → publish lên Redis channel</li>
 *   <li>Client kết nối SSE tới endpoint → subscribe vào sink local</li>
 * </ul>
 *
 * <p>Dùng {@code Sinks.many().multicast().onBackpressureBuffer()} để mỗi event được gửi tới
 * tất cả subscribers (không mất khi có nhiều user cùng xem 1 bài). Backpressure buffer
 * giúp chống slow client.
 */
@Service
@Slf4j
@Profile("!test") // test profile dùng mock
public class PostEventBroadcaster {

  private final ReactiveRedisTemplate<String, String> reactiveRedisTemplate;
  private final ObjectMapper objectMapper;

  /** Channel Redis dùng chung cho tất cả servers. */
  private static final String CHANNEL = "post:events";

  /** Sinks.local() để phát events trong-process tới SSE subscribers. */
  private final Sinks.Many<PostCountEvent> sink =
      Sinks.many().multicast().onBackpressureBuffer();

  public PostEventBroadcaster(ReactiveRedisTemplate<String, String> reactiveRedisTemplate, ObjectMapper objectMapper) {
    this.reactiveRedisTemplate = reactiveRedisTemplate;
    this.objectMapper = objectMapper;
    // Subscribe Redis channel để nhận events từ các server khác
    reactiveRedisTemplate.listenToChannel(CHANNEL)
        .map(message -> message.getMessage())
        .doOnNext(json -> {
          try {
            PostCountEvent event = objectMapper.readValue(json, PostCountEvent.class);
            log.debug("Received post event from Redis: postId={}", event.getPostId());
            sink.tryEmitNext(event);
          } catch (IOException e) {
            log.error("Failed to parse post event from Redis: {}", json, e);
          }
        })
        .doOnError(err -> log.error("Error listening to Redis post events", err))
        .subscribe();
  }

  /** Broadcast event tới tất cả servers qua Redis + local subscribers. */
  public void broadcast(PostCountEvent event) {
    log.debug("Broadcasting post event: postId={}", event.getPostId());
    // Emit locally trước (nhanh)
    sink.tryEmitNext(event);
    // Publish qua Redis để server khác nhận được (convert sang JSON)
    try {
      String json = objectMapper.writeValueAsString(event);
      reactiveRedisTemplate.convertAndSend(CHANNEL, json)
          .doOnSuccess(cnt -> log.trace("Published to Redis channel={} msgCount={}", CHANNEL, cnt))
          .doOnError(err -> log.error("Failed to publish post event to Redis", err))
          .subscribe();
    } catch (IOException e) {
      log.error("Failed to serialize PostCountEvent to JSON", e);
    }
  }

  /** Trả về Flux cho SSE endpoint: tất cả events từ sink (local + cross-server). */
  public Flux<PostCountEvent> getFluxForUser(Optional<java.util.List<String>> postIds) {
    Flux<PostCountEvent> flux = sink.asFlux();
    if (postIds.isPresent() && !postIds.get().isEmpty()) {
      java.util.Set<String> idSet = new java.util.HashSet<>(postIds.get());
      return flux.filter(event -> idSet.contains(event.getPostId()));
    }
    return flux;
  }
}
