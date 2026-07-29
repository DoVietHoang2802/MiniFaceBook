package com.minifacebook.module.auth.infrastructure.security;

import com.minifacebook.module.auth.domain.model.Role;
import com.minifacebook.module.auth.domain.service.TokenService;
import java.util.Set;
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
  public String generateAccessToken(String email, Set<Role> roles) {
    return authenticationService.generateToken(email, roles, false);
  }

  @Override
  public String generateRefreshToken(String email) {
    return authenticationService.generateToken(email, true);
  }

  @Override
  public String generateRefreshToken(String email, Set<Role> roles) {
    return authenticationService.generateToken(email, roles, true);
  }
}
