package com.minifacebook.module.notification.application.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.minifacebook.module.notification.application.dto.NotificationResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Sinks;

import java.io.IOException;

/**
 * Broadcast notifications via SSE với Reactive Redis Pub/Sub.
 *
 * <p>Mỗi user chỉ nhận notification của mình (filter by recipientId). Server nhận
 * events từ Redis channel và emit tới local sink; endpoint SSE subscribe sink đó.
 */
@Service
@Slf4j
@Profile("!test")
public class NotificationEventBroadcaster {

  private final ReactiveRedisTemplate<String, String> reactiveRedisTemplate;
  private final ObjectMapper objectMapper;

  private static final String CHANNEL = "notification:events";

  private final Sinks.Many<NotificationResponse> sink =
      Sinks.many().multicast().onBackpressureBuffer();

  public NotificationEventBroadcaster(ReactiveRedisTemplate<String, String> reactiveRedisTemplate, ObjectMapper objectMapper) {
    this.reactiveRedisTemplate = reactiveRedisTemplate;
    this.objectMapper = objectMapper;
    // Subscribe Redis channel
    reactiveRedisTemplate.listenToChannel(CHANNEL)
        .map(message -> message.getMessage())
        .doOnNext(json -> {
          try {
            NotificationResponse event = objectMapper.readValue(json, NotificationResponse.class);
            log.debug("Received notification event from Redis: notifId={}", event.getId());
            sink.tryEmitNext(event);
          } catch (IOException e) {
            log.error("Failed to parse notification event from Redis: {}", json, e);
          }
        })
        .doOnError(err -> log.error("Error listening to Redis notification events", err))
        .subscribe();
  }

  /** Broadcast notification tới tất cả servers + local SSE subscribers. */
  public void broadcast(NotificationResponse event) {
    log.debug("Broadcasting notification: notifId={} to recipient={}", event.getId(), event.getActorId());
    sink.tryEmitNext(event);
    try {
      String json = objectMapper.writeValueAsString(event);
      reactiveRedisTemplate.convertAndSend(CHANNEL, json)
          .doOnSuccess(cnt -> log.trace("Published notification to Redis channel={}", CHANNEL))
          .doOnError(err -> log.error("Failed to publish notification to Redis", err))
          .subscribe();
    } catch (IOException e) {
      log.error("Failed to serialize NotificationResponse to JSON", e);
    }
  }

  /** Flux cho SSE endpoint: filter notifications theo userId (recipientId). */
  public Flux<NotificationResponse> getFluxForUser(String userId) {
    return sink.asFlux()
        .filter(notif -> userId.equals(notif.getRecipientId()));
  }
}
