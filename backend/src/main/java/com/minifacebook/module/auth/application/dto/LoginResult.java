package com.minifacebook.module.auth.application.dto;

import lombok.Builder;
import lombok.Getter;

/** Lớp trung gian lưu trữ kết quả xử lý đăng nhập tại tầng Application. */
@Getter
@Builder
public class LoginResult {
  private String accessToken;
  private String refreshToken;
  private UserResponse user;
}
