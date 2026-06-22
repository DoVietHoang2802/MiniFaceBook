package com.minifacebook.module.notification.presentation;

import com.minifacebook.module.notification.application.service.NotificationEventBroadcaster;
import com.minifacebook.module.notification.application.dto.NotificationResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

/**
 * SSE endpoint cho notifications.
 *
 * <p>
 * Client subscribe: GET /api/events/notifications
 * Chỉ nhận notifications thuộc về user hiện tại (filtered by recipientId).
 *
 * <p>
 * Content-Type: text/event-stream
 */
@RestController
@RequiredArgsConstructor
public class SseNotificationController {

    private final NotificationEventBroadcaster notificationEventBroadcaster;

    @GetMapping(value = "/events/notifications", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public ResponseEntity<Flux<NotificationResponse>> getNotificationEvents(
        @AuthenticationPrincipal Jwt jwt) {

        // Lấy userId từ JWT subject claim
        String userId = jwt.getSubject();

        Flux<NotificationResponse> flux = notificationEventBroadcaster.getFluxForUser(userId);

        return ResponseEntity.ok()
            .header("X-Accel-Buffering", "no")
            .header("Cache-Control", "no-cache")
            .header("Connection", "keep-alive")
            .body(flux);
    }
}
