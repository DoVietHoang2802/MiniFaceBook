package com.minifacebook.module.post.application.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.minifacebook.module.post.application.dto.CommentResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Sinks;

import java.io.IOException;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

/**
 * Broadcast new comments via SSE với Reactive Redis Pub/Sub.
 *
 * <p>Mỗi user chỉ nhận comments cho các post đang subscribe (filter by postIds).
 * Server nhận events từ Redis channel và emit tới local sink; endpoint SSE subscribe sink đó.
 */
@Service
@Slf4j
@Profile("!test")
public class CommentEventBroadcaster {

    private final ReactiveRedisTemplate<String, String> reactiveRedisTemplate;
    private final ObjectMapper objectMapper;

    private static final String CHANNEL = "comment:events";

    private final Sinks.Many<CommentResponse> sink =
        Sinks.many().multicast().onBackpressureBuffer();

    public CommentEventBroadcaster(ReactiveRedisTemplate<String, String> reactiveRedisTemplate,
                                   ObjectMapper objectMapper) {
        this.reactiveRedisTemplate = reactiveRedisTemplate;
        this.objectMapper = objectMapper;
        // Subscribe Redis channel để nhận events từ các server khác
        reactiveRedisTemplate.listenToChannel(CHANNEL)
            .map(message -> message.getMessage())
            .doOnNext(json -> {
                try {
                    CommentResponse event = objectMapper.readValue(json, CommentResponse.class);
                    log.debug("Received comment event from Redis: commentId={} postId={}",
                        event.getId(), event.getPostId());
                    sink.tryEmitNext(event);
                } catch (IOException e) {
                    log.error("Failed to parse comment event from Redis: {}", json, e);
                }
            })
            .doOnError(err -> log.error("Error listening to Redis comment events", err))
            .subscribe();
    }

    /** Broadcast comment tới tất cả servers qua Redis + local subscribers. */
    public void broadcast(CommentResponse comment) {
        log.debug("Broadcasting comment: commentId={} postId={}", comment.getId(), comment.getPostId());
        // Emit locally trước (nhanh)
        sink.tryEmitNext(comment);
        // Publish qua Redis để server khác nhận được (convert sang JSON)
        try {
            String json = objectMapper.writeValueAsString(comment);
            reactiveRedisTemplate.convertAndSend(CHANNEL, json)
                .doOnSuccess(cnt -> log.trace("Published comment to Redis channel={} msgCount={}", CHANNEL, cnt))
                .doOnError(err -> log.error("Failed to publish comment to Redis", err))
                .subscribe();
        } catch (IOException e) {
            log.error("Failed to serialize CommentResponse to JSON", e);
        }
    }

    /** Flux cho SSE endpoint: filter comments theo postIds. */
    public Flux<CommentResponse> getFluxForUser(Optional<List<String>> postIds) {
        Flux<CommentResponse> flux = sink.asFlux();
        if (postIds.isPresent() && !postIds.get().isEmpty()) {
            Set<String> idSet = new HashSet<>(postIds.get());
            return flux.filter(event -> idSet.contains(event.getPostId()));
        }
        return flux;
    }
}
