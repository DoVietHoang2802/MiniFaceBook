package com.minifacebook.module.auth.domain.service;

import com.minifacebook.module.auth.domain.model.Role;
import java.util.Set;

/**
 * Domain Service Interface định nghĩa nhiệm vụ sinh mã xác thực (Token). Đảm bảo tính đóng gói và
 * đảo ngược phụ thuộc (DIP) của Clean Architecture.
 */
public interface TokenService {

  String generateAccessToken(String email);

  String generateAccessToken(String email, Set<Role> roles);

  String generateRefreshToken(String email);

  String generateRefreshToken(String email, Set<Role> roles);
}
