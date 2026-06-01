package com.minifacebook.module.chat.presentation;

import com.minifacebook.module.auth.domain.repository.UserRepository;
import com.minifacebook.module.chat.application.service.PresenceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

/**
 * Lắng nghe sự kiện WebSocket connect/disconnect để cập nhật trạng thái Presence.
 *
 * <p>Khi user kết nối → setOnline → broadcast trạng thái tới bạn bè. Khi user ngắt kết nối →
 * setOffline → broadcast trạng thái tới bạn bè.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketEventListener {

  private final PresenceService presenceService;
  private final UserRepository userRepository;
  private final SimpMessagingTemplate messagingTemplate;

  @EventListener
  public void handleSessionConnected(SessionConnectedEvent event) {
    var principal = event.getUser();
    if (principal == null) {
      return;
    }

    String email = principal.getName();
    userRepository
        .findByEmail(email)
        .ifPresent(
            user -> {
              presenceService.setOnline(user.getId());
              log.info("User connected via WebSocket: {} ({})", email, user.getId());

              // Broadcast trạng thái online tới topic chung
              messagingTemplate.convertAndSend(
                  "/topic/presence",
                  new PresencePayload(user.getId(), "ONLINE"));
            });
  }

  @EventListener
  public void handleSessionDisconnect(SessionDisconnectEvent event) {
    var principal = event.getUser();
    if (principal == null) {
      return;
    }

    String email = principal.getName();
    userRepository
        .findByEmail(email)
        .ifPresent(
            user -> {
              presenceService.setOffline(user.getId());
              log.info("User disconnected from WebSocket: {} ({})", email, user.getId());

              // Broadcast trạng thái offline tới topic chung
              messagingTemplate.convertAndSend(
                  "/topic/presence",
                  new PresencePayload(user.getId(), "OFFLINE"));
            });
  }

  /** DTO nhỏ cho presence event — không cần file riêng vì chỉ dùng ở đây. */
  public record PresencePayload(String userId, String status) {}
}
