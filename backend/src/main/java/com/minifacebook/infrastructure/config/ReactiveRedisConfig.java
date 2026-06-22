package com.minifacebook.infrastructure.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.ReactiveRedisConnectionFactory;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.RedisSerializer;

/**
 * Redis Reactive configuration cho SSE Pub/Sub.
 *
 * <p>Dùng StringSerializer cho value → lưu JSON string. Khi subscribe, message là String,
 * parse bằng ObjectMapper. Đơn giản và tránh vấn đề type erasure với GenericJackson2JsonRedisSerializer.
 */
@Configuration
public class ReactiveRedisConfig {

  @Bean
  public ReactiveRedisTemplate<String, String> reactiveRedisTemplate(
      ReactiveRedisConnectionFactory connectionFactory, ObjectMapper objectMapper) {

    RedisSerializer<String> keySerializer = RedisSerializer.string();
    RedisSerializer<String> valueSerializer = RedisSerializer.string();

    RedisSerializationContext<String, String> context =
        RedisSerializationContext.<String, String>newSerializationContext(keySerializer)
            .value(valueSerializer)
            .build();

    // Explicitly specify generic types to avoid inference error
    return new ReactiveRedisTemplate<String, String>(connectionFactory, context);
  }
}
