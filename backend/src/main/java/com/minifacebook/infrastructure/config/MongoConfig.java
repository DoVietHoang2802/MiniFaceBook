package com.minifacebook.infrastructure.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.data.mongodb.MongoTransactionManager;

/**
 * Cấu hình hạ tầng MongoDB.
 *
 * <p>Khai báo {@link MongoTransactionManager} để kích hoạt cơ chế giao dịch (Transaction) cho các
 * service được đánh dấu {@code @Transactional}. Lưu ý: MongoDB chỉ hỗ trợ transaction khi chạy ở
 * chế độ <b>Replica Set</b> (xem cấu hình {@code --replSet rs0} trong docker-compose.yml).
 */
@Configuration
public class MongoConfig {

  @Bean
  public MongoTransactionManager mongoTransactionManager(MongoDatabaseFactory dbFactory) {
    return new MongoTransactionManager(dbFactory);
  }
}
