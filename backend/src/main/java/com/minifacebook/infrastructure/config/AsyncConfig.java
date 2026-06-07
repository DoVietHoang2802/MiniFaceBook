package com.minifacebook.infrastructure.config;

import java.util.concurrent.Executor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

/**
 * Bật xử lý bất đồng bộ ({@code @Async}) cho toàn ứng dụng (Phase 5.1).
 *
 * <p>Dùng cho {@code NotificationEventListener} để tạo thông báo ở luồng nền, không chặn request
 * nghiệp vụ gốc (like/comment/kết bạn trả về ngay).
 *
 * <p>Cấu hình pool nhỏ gọn phù hợp quy mô demo; tên luồng "notif-async-" để dễ debug trong log.
 */
@Configuration
@EnableAsync
public class AsyncConfig {

  @Bean(name = "taskExecutor")
  public Executor taskExecutor() {
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    executor.setCorePoolSize(2);
    executor.setMaxPoolSize(5);
    executor.setQueueCapacity(100);
    executor.setThreadNamePrefix("notif-async-");
    executor.initialize();
    return executor;
  }
}
