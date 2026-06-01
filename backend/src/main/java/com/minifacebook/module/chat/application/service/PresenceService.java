package com.minifacebook.module.chat.application.service;

import java.time.Duration;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

/**
 * Service quản lý trạng thái Online/Offline của người dùng bằng Redis TTL.
 *
 * <p>Cơ chế:
 *
 * <ul>
 *   <li>User kết nối WebSocket → {@code SET presence:{userId} "ONLINE" EX 35}
 *   <li>Client gửi heartbeat mỗi 25 giây → {@code EXPIRE presence:{userId} 35} (reset TTL)
 *   <li>User ngắt kết nối hoặc không heartbeat → TTL hết → key tự xóa → OFFLINE
 * </ul>
 *
 * <p>Không cần cron job, không cần cleanup thủ công. Redis tự xử lý.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PresenceService {

  private static final String PRESENCE_KEY_PREFIX = "presence:";
  private static final Duration PRESENCE_TTL = Duration.ofSeconds(35);

  private final StringRedisTemplate redisTemplate;

  /** Đánh dấu user online (gọi khi WebSocket connect). */
  public void setOnline(String userId) {
    String key = PRESENCE_KEY_PREFIX + userId;
    redisTemplate.opsForValue().set(key, "ONLINE", PRESENCE_TTL);
    log.debug("User {} is now ONLINE", userId);
  }

  /** Đánh dấu user offline ngay lập tức (gọi khi WebSocket disconnect). */
  public void setOffline(String userId) {
    String key = PRESENCE_KEY_PREFIX + userId;
    redisTemplate.delete(key);
    log.debug("User {} is now OFFLINE", userId);
  }

  /**
   * Reset TTL (gọi khi nhận heartbeat từ client, mỗi 25 giây).
   *
   * <p>Nếu user chưa được set online (lần heartbeat đầu tiên hoặc TTL đã hết), tự động set lại để
   * không cần phụ thuộc bắt buộc vào WebSocket connect event.
   */
  public void heartbeat(String userId) {
    String key = PRESENCE_KEY_PREFIX + userId;
    Boolean exists = redisTemplate.hasKey(key);
    if (Boolean.TRUE.equals(exists)) {
      redisTemplate.expire(key, PRESENCE_TTL);
      log.trace("Heartbeat refreshed TTL for user {}", userId);
    } else {
      // Lần heartbeat đầu hoặc TTL đã hết → set online lại
      redisTemplate.opsForValue().set(key, "ONLINE", PRESENCE_TTL);
      log.debug("Heartbeat re-set ONLINE for user {} (was missing)", userId);
    }
  }

  /** Kiểm tra user có đang online không. */
  public boolean isOnline(String userId) {
    return Boolean.TRUE.equals(redisTemplate.hasKey(PRESENCE_KEY_PREFIX + userId));
  }

  /** Lấy danh sách userId đang online từ một tập userId cho trước (batch check). */
  public Set<String> getOnlineUsers(List<String> userIds) {
    return userIds.stream()
        .filter(this::isOnline)
        .collect(Collectors.toSet());
  }
}
