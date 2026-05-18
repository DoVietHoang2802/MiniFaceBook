package com.minifacebook.module.auth.infrastructure.security;

import com.minifacebook.module.auth.domain.service.TokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Adapter triển khai interface TokenService tại hạ tầng của Auth Module. Giúp liên kết logic nghiệp
 * vụ xác thực với cơ chế phát sinh Token.
 */
@Component
@RequiredArgsConstructor
public class TokenServiceAdapter implements TokenService {

  private final AuthenticationService authenticationService;

  @Override
  public String generateAccessToken(String email) {
    return authenticationService.generateToken(email, false);
  }

  @Override
  public String generateRefreshToken(String email) {
    return authenticationService.generateToken(email, true);
  }
}
