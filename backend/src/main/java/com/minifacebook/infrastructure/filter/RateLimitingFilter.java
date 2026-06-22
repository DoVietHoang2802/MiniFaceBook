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
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@Slf4j
public class RateLimitingFilter extends OncePerRequestFilter {

  // Lưu trữ các "xô" (bucket) cho từng IP
  private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

  // Định nghĩa băng thông: 100 requests mỗi phút (Khoảng 1.5 request/giây)
  private Bucket createNewBucket() {
    return Bucket.builder()
        .addLimit(Bandwidth.builder().capacity(100).refillGreedy(100, Duration.ofMinutes(1)).build())
        .build();
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
