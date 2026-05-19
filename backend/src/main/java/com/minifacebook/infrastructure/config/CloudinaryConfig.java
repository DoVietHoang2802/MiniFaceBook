package com.minifacebook.infrastructure.config;

import com.cloudinary.Cloudinary;
import java.util.HashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Cấu hình khởi tạo Bean Cloudinary kết nối dịch vụ lưu trữ đám mây.
 */
@Configuration
public class CloudinaryConfig {

  @Value("${app.cloudinary.cloud-name}")
  private String cloudName;

  @Value("${app.cloudinary.api-key}")
  private String apiKey;

  @Value("${app.cloudinary.api-secret}")
  private String apiSecret;

  @Bean
  public Cloudinary cloudinary() {
    Map<String, String> config = new HashMap<>();
    config.put("cloud_name", cloudName);
    config.put("api_key", apiKey);
    config.put("api_secret", apiSecret);
    return new Cloudinary(config);
  }
}
