package com.minifacebook.infrastructure.security;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@Getter
@Setter
@ConfigurationProperties(prefix = "app.oauth.google")
public class GoogleOAuthProperties {
  private boolean enabled;
  private String clientId;
  private String clientSecret;
  private String frontendUrl;
  private boolean secureCookies;
}
