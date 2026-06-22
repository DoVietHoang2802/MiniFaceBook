package com.minifacebook.module.post.presentation;

import com.minifacebook.module.post.application.service.PostEventBroadcaster;
import com.minifacebook.module.post.application.dto.PostCountEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.Optional;

/**
 * SSE endpoint cho post count updates.
 *
 * <p>
 * Client subscribe với URL: GET /api/events/post?postIds=id1,id2,id3
 * Nếu không truyền postIds → nhận tất cả events (fallback).
 *
 * <p>
 * Content-Type: text/event-stream
 * Format: data: {"postId":"...", "reactCount":10, "commentCount":5,
 * "reactionsCount":{...}}
 */
@RestController
@RequiredArgsConstructor
public class SseEventController {

  private final PostEventBroadcaster postEventBroadcaster;

  @GetMapping(value = "/events/post", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
  public ResponseEntity<Flux<PostCountEvent>> getPostEvents(
      @RequestParam(required = false, name = "postIds") List<String> postIds,
      @AuthenticationPrincipal org.springframework.security.oauth2.jwt.Jwt jwt) {

    // Auth nằm trong Spring Security config (mặc định: cần JWT)
    Flux<PostCountEvent> flux = postEventBroadcaster.getFluxForUser(Optional.ofNullable(postIds));

    return ResponseEntity.ok()
        .header("X-Accel-Buffering", "no") // Nginx: disable buffering
        .header("Cache-Control", "no-cache")
        .header("Connection", "keep-alive")
        .body(flux);
  }
}
