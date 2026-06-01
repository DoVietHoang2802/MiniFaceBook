package com.minifacebook.infrastructure.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Interceptor xác thực JWT trên STOMP CONNECT frame.
 *
 * <p>Flow: Client kết nối WebSocket → {@link WebSocketAuthInterceptor} đọc Cookie → lưu token vào
 * session attributes → STOMP CONNECT frame đến đây → validate token → set Authentication vào
 * WebSocket session.
 *
 * <p>Dùng {@link JwtDecoder} từ Spring Security (đã được khai báo trong SecurityConfig) để tránh
 * vi phạm ranh giới module trong Clean Architecture.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketChannelInterceptor implements ChannelInterceptor {

  private final JwtDecoder jwtDecoder;

  @Override
  public Message<?> preSend(Message<?> message, MessageChannel channel) {
    StompHeaderAccessor accessor =
        MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

    if (accessor == null) {
      return message;
    }

    // Chỉ validate khi client gửi CONNECT frame
    if (StompCommand.CONNECT.equals(accessor.getCommand())) {
      String token = (String) accessor.getSessionAttributes().get("accessToken");

      if (token == null || token.isBlank()) {
        log.warn("WebSocket CONNECT rejected: no accessToken in session attributes");
        throw new IllegalArgumentException("Unauthorized: missing access token");
      }

      try {
        var jwt = jwtDecoder.decode(token);
        String email = jwt.getSubject();

        // Set Principal vào WebSocket session để dùng event.getUser() sau này
        var auth = new UsernamePasswordAuthenticationToken(
            email,
            null,
            List.of(new SimpleGrantedAuthority("ROLE_USER")));

        accessor.setUser(auth);
        log.debug("WebSocket CONNECT authenticated for user: {}", email);

      } catch (JwtException e) {
        log.warn("WebSocket CONNECT rejected: invalid token - {}", e.getMessage());
        throw new IllegalArgumentException("Unauthorized: invalid access token");
      }
    }

    return message;
  }
}
