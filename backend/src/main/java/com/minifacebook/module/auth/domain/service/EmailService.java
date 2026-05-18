package com.minifacebook.module.auth.domain.service;

/**
 * Interface nghiệp vụ gửi Email phục vụ xác thực người dùng.
 * Đặt tại Domain layer độc lập hoàn toàn với thư viện gửi thư.
 */
public interface EmailService {

  /**
   * Gửi email kèm mã xác thực tài khoản.
   */
  void sendVerificationEmail(String toEmail, String verificationToken);
}
