package com.minifacebook.infrastructure.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;

/**
 * Cấu hình hạ tầng Redis.
 *
 * <p>Khai báo {@link StringRedisTemplate} dùng chung cho toàn bộ ứng dụng. Sử dụng
 * StringRedisTemplate (thay vì RedisTemplate generic) vì tất cả key/value trong dự án đều là
 * String (JWT token, userId, presence status).
 */
@Configuration
public class RedisConfig {

  @Bean
  public StringRedisTemplate stringRedisTemplate(RedisConnectionFactory connectionFactory) {
    return new StringRedisTemplate(connectionFactory);
  }
}
