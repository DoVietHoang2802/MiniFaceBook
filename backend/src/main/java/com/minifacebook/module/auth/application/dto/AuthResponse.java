package com.minifacebook.module.auth.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO phản hồi kết quả xác thực người dùng thành công. Đặt tại tầng Application đóng vai trò làm
 * giao ước dữ liệu nghiệp vụ.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
  private String accessToken;
  private UserResponse user;
}
