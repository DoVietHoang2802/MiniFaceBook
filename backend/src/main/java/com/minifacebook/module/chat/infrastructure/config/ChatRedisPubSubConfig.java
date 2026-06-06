package com.minifacebook.module.chat.infrastructure.config;

import com.minifacebook.module.chat.infrastructure.pubsub.ChatRedisSubscriber;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.listener.PatternTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;

/**
 * Cấu hình đăng ký nhận sự kiện chat từ Redis Pub/Sub (Sprint 4.3).
 */
@Configuration
@RequiredArgsConstructor
public class ChatRedisPubSubConfig {

  private final ChatRedisSubscriber chatRedisSubscriber;

  @Bean
  public RedisMessageListenerContainer redisMessageListenerContainer(RedisConnectionFactory connectionFactory) {
    RedisMessageListenerContainer container = new RedisMessageListenerContainer();
    container.setConnectionFactory(connectionFactory);
    // Đăng ký subscribe tất cả các channel có pattern "chat.room.*"
    container.addMessageListener(chatRedisSubscriber, new PatternTopic("chat.room.*"));
    return container;
  }
}
