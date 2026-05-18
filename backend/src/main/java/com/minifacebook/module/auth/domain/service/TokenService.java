package com.minifacebook.module.auth.domain.service;

/**
 * Domain Service Interface định nghĩa nhiệm vụ sinh mã xác thực (Token). Đảm bảo tính đóng gói và
 * đảo ngược phụ thuộc (DIP) của Clean Architecture.
 */
public interface TokenService {

  String generateAccessToken(String email);

  String generateRefreshToken(String email);
}
