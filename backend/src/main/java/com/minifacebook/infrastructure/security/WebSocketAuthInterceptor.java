package com.minifacebook.infrastructure.security;

import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

/**
 * Interceptor xác thực JWT khi client thực hiện WebSocket handshake.
 *
 * <p>Vì JWT nằm trong HttpOnly Cookie (JS không đọc được), không thể truyền qua query param. Thay
 * vào đó, interceptor này đọc Cookie {@code accessToken} từ HTTP request lúc handshake và lưu vào
 * WebSocket session attributes để {@link WebSocketChannelInterceptor} dùng sau.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketAuthInterceptor implements HandshakeInterceptor {

  @Override
  public boolean beforeHandshake(
      ServerHttpRequest request,
      ServerHttpResponse response,
      WebSocketHandler wsHandler,
      Map<String, Object> attributes) {

    if (request instanceof ServletServerHttpRequest servletRequest) {
      var cookies = servletRequest.getServletRequest().getCookies();
      if (cookies != null) {
        for (var cookie : cookies) {
          if ("accessToken".equals(cookie.getName())) {
            attributes.put("accessToken", cookie.getValue());
            log.debug("WebSocket handshake: accessToken found in cookie");
            return true;
          }
        }
      }
    }

    log.warn("WebSocket handshake rejected: no accessToken cookie found");
    return false; // Từ chối kết nối nếu không có token
  }

  @Override
  public void afterHandshake(
      ServerHttpRequest request,
      ServerHttpResponse response,
      WebSocketHandler wsHandler,
      Exception exception) {
    // Không cần xử lý sau handshake
  }
}
