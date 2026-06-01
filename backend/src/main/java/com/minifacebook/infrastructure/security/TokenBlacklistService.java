package com.minifacebook.infrastructure.security;

import com.minifacebook.shared.security.TokenBlacklistPort;
import java.time.Duration;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Service;

/**
 * Implement TokenBlacklistPort bằng Redis TTL.
 *
 * <p>Khi user logout, Access Token bị thu hồi ngay lập tức bằng cách lưu jwtID vào Redis với TTL
 * bằng thời gian còn lại của token. Sau khi token hết hạn, Redis tự xóa key — không cần cleanup.
 *
 * <p>Nhanh hơn MongoDB ~50-100x (0.1ms vs 5-10ms) vì Redis là in-memory.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TokenBlacklistService implements TokenBlacklistPort {

  private static final String BLACKLIST_KEY_PREFIX = "blacklist:";

  private final StringRedisTemplate redisTemplate;
  private final JwtDecoder jwtDecoder;

  @Override
  public void blacklist(String accessToken) {
    if (accessToken == null || accessToken.isBlank()) {
      return;
    }

    try {
      Jwt jwt = jwtDecoder.decode(accessToken);
      String jwtId = jwt.getId(); // jwtID (UUID) — tiết kiệm RAM hơn lưu full token
      Instant expiresAt = jwt.getExpiresAt();

      if (expiresAt != null) {
        long ttlSeconds = Duration.between(Instant.now(), expiresAt).getSeconds();
        if (ttlSeconds > 0) {
          redisTemplate
              .opsForValue()
              .set(BLACKLIST_KEY_PREFIX + jwtId, "revoked", Duration.ofSeconds(ttlSeconds));
          log.info("Access Token blacklisted (jwtId: {}, TTL: {}s)", jwtId, ttlSeconds);
        }
      }
    } catch (JwtException e) {
      // Token đã hết hạn hoặc invalid → không cần blacklist
      log.debug("Token already expired or invalid, skip blacklisting: {}", e.getMessage());
    }
  }

  @Override
  public boolean isBlacklisted(String accessToken) {
    if (accessToken == null || accessToken.isBlank()) {
      return false;
    }

    try {
      Jwt jwt = jwtDecoder.decode(accessToken);
      String jwtId = jwt.getId();
      return Boolean.TRUE.equals(redisTemplate.hasKey(BLACKLIST_KEY_PREFIX + jwtId));
    } catch (JwtException e) {
      // Token invalid → coi như đã bị thu hồi
      return true;
    }
  }
}
