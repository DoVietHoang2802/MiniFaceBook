package com.minifacebook.module.chat.application.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.ai")
@Getter
@Setter
public class AiProperties {
  private boolean enabled;
  private String baseUrl = "https://api.deepseek.com";
  private String apiKey = "";
  private String model = "deepseek-v4-flash";
  private int dailyLimit = 10;
  private int messageLimit = 50;
  private int cooldownSeconds = 60;
  private int timeoutSeconds = 20;
}
