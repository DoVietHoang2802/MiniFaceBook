package com.minifacebook.infrastructure.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.minifacebook.shared.dto.ApiResponse;
import com.minifacebook.shared.exception.ErrorCode;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@Slf4j
public class RateLimitingFilter extends OncePerRequestFilter {

  // Lưu trữ các "xô" (bucket) cho từng IP
  private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();
  private final long capacity;

  public RateLimitingFilter(@Value("${app.rate-limit.capacity:100}") long capacity) {
    this.capacity = capacity;
  }

  // Production mặc định 100/phút; CI có thể nâng quota cho E2E qua biến môi trường.
  private Bucket createNewBucket() {
    return Bucket.builder()
        .addLimit(
            Bandwidth.builder()
                .capacity(capacity)
                .refillGreedy(capacity, Duration.ofMinutes(1))
                .build())
        .build();
  }

  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) {
    String path = request.getRequestURI();
    // Health probe không tính rate limit (Docker / K8s / CI poll liên tục)
    return path != null && path.contains("/actuator/health");
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {

    // Lấy IP của người dùng
    String ip = request.getRemoteAddr();
    Bucket bucket = buckets.computeIfAbsent(ip, k -> createNewBucket());

    // Kiểm tra xem còn lượt request không
    if (bucket.tryConsume(1)) {
      filterChain.doFilter(request, response);
    } else {
      // Hết lượt, trả về lỗi 429
      sendErrorResponse(response);
    }
  }

  private void sendErrorResponse(HttpServletResponse response) throws IOException {
    ErrorCode errorCode = ErrorCode.TOO_MANY_REQUESTS;

    response.setStatus(errorCode.getStatusCode().value());
    response.setContentType("application/json");

    ApiResponse<?> apiResponse = ApiResponse.builder().status(errorCode.getCode()).message(errorCode.getMessage())
        .build();

    ObjectMapper objectMapper = new ObjectMapper();
    response.getWriter().write(objectMapper.writeValueAsString(apiResponse));
    response.flushBuffer();
  }
}
