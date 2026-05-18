package com.minifacebook.module.auth.application.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO đại diện cho yêu cầu đăng nhập của người dùng. Đặt tại tầng Application đóng vai trò làm giao
 * ước dữ liệu nghiệp vụ.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {

  @NotBlank(message = "EMAIL_REQUIRED")
  @Email(message = "EMAIL_INVALID")
  private String email;

  @NotBlank(message = "PASSWORD_REQUIRED")
  private String password;
}
