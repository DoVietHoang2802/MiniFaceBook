package com.minifacebook.infrastructure.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.minifacebook.shared.dto.ApiResponse;
import com.minifacebook.shared.exception.ErrorCode;
import com.minifacebook.shared.security.TokenBlacklistPort;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Filter kiểm tra Access Token có trong Redis Blacklist không trước khi xử lý request.
 *
 * <p>Chạy sau RateLimitingFilter, trước Spring Security OAuth2 JWT filter. Nếu token đã bị
 * blacklist (user đã logout), trả về 401 ngay lập tức mà không cần query MongoDB.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class TokenBlacklistFilter extends OncePerRequestFilter {

  private final TokenBlacklistPort tokenBlacklistService;
  private final ObjectMapper objectMapper;

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {

    String token = extractToken(request);

    if (token != null && tokenBlacklistService.isBlacklisted(token)) {
      log.warn("Rejected blacklisted token for request: {}", request.getRequestURI());
      sendUnauthorizedResponse(response);
      return;
    }

    filterChain.doFilter(request, response);
  }

  private String extractToken(HttpServletRequest request) {
    // Ưu tiên đọc từ Cookie (cơ chế chính của dự án)
    if (request.getCookies() != null) {
      for (var cookie : request.getCookies()) {
        if ("accessToken".equals(cookie.getName())) {
          return cookie.getValue();
        }
      }
    }
    // Fallback: Authorization header (dùng cho Swagger test)
    String authorization = request.getHeader("Authorization");
    if (authorization != null && authorization.startsWith("Bearer ")) {
      return authorization.substring(7);
    }
    return null;
  }

  private void sendUnauthorizedResponse(HttpServletResponse response) throws IOException {
    ErrorCode errorCode = ErrorCode.UNAUTHENTICATED;
    response.setStatus(errorCode.getStatusCode().value());
    response.setContentType(MediaType.APPLICATION_JSON_VALUE);

    ApiResponse<?> apiResponse =
        ApiResponse.builder()
            .status(errorCode.getCode())
            .message(errorCode.getMessage())
            .build();

    response.getWriter().write(objectMapper.writeValueAsString(apiResponse));
    response.flushBuffer();
  }
}
