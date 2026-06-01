package com.minifacebook.infrastructure.config;

import com.minifacebook.infrastructure.security.WebSocketAuthInterceptor;
import com.minifacebook.infrastructure.security.WebSocketChannelInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * Cấu hình WebSocket với STOMP Protocol.
 *
 * <p>Kiến trúc:
 *
 * <ul>
 *   <li>Client kết nối tới endpoint {@code /ws} (có SockJS fallback).
 *   <li>Client subscribe topic {@code /topic/...} (broadcast) hoặc queue {@code /user/queue/...}
 *       (1-1).
 *   <li>Client gửi message tới {@code /app/...} → Spring route tới {@code @MessageMapping} method.
 * </ul>
 *
 * <p>Ghi chú Redis Pub/Sub: Hiện dùng Simple In-Memory Broker (đủ cho 1 server). Khi cần scale
 * lên 2+ server, thay {@code enableSimpleBroker} bằng {@code enableStompBrokerRelay} trỏ tới
 * Redis — không cần sửa code nghiệp vụ.
 */
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

  private final WebSocketAuthInterceptor webSocketAuthInterceptor;
  private final WebSocketChannelInterceptor webSocketChannelInterceptor;

  @Override
  public void configureMessageBroker(MessageBrokerRegistry registry) {
    // Prefix cho các message từ client gửi lên server (đi qua @MessageMapping)
    registry.setApplicationDestinationPrefixes("/app");

    // In-memory broker cho topic (broadcast) và user queue (1-1)
    // NOTE: Khi scale 2+ server → thay bằng Redis Pub/Sub broker relay
    registry.enableSimpleBroker("/topic", "/queue");

    // Prefix cho user-specific destination (gửi tới 1 user cụ thể)
    registry.setUserDestinationPrefix("/user");
  }

  @Override
  public void registerStompEndpoints(StompEndpointRegistry registry) {
    registry
        .addEndpoint("/ws")
        .setAllowedOriginPatterns("http://localhost:5173", "http://localhost:5174")
        .addInterceptors(webSocketAuthInterceptor) // Đọc JWT từ Cookie khi handshake
        .withSockJS(); // SockJS fallback cho browser không hỗ trợ WebSocket native
  }

  @Override
  public void configureClientInboundChannel(ChannelRegistration registration) {
    // Validate JWT trên STOMP CONNECT frame
    registration.interceptors(webSocketChannelInterceptor);
  }
}
