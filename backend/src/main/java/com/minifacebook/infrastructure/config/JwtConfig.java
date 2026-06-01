package com.minifacebook.infrastructure.config;

import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;

/**
 * Cấu hình JWT Decoder (tách khỏi SecurityConfig).
 *
 * <p>Tách riêng để tránh circular dependency: TokenBlacklistFilter → TokenBlacklistService →
 * JwtDecoder. Nếu để JwtDecoder trong SecurityConfig (mà SecurityConfig đã inject
 * TokenBlacklistFilter) sẽ tạo vòng lặp khi Spring khởi tạo bean.
 */
@Configuration
public class JwtConfig {

  @Value("${app.jwt.secret}")
  private String signerKey;

  @Bean
  public JwtDecoder jwtDecoder() {
    SecretKeySpec secretKeySpec = new SecretKeySpec(signerKey.getBytes(), "HS256");
    return NimbusJwtDecoder.withSecretKey(secretKeySpec).macAlgorithm(MacAlgorithm.HS256).build();
  }
}
