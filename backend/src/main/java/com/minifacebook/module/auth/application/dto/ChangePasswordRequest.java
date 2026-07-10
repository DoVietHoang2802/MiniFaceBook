package com.minifacebook.module.auth.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** DTO đại diện cho yêu cầu thay đổi mật khẩu của người dùng đã đăng nhập. */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChangePasswordRequest {

  @NotBlank(message = "OLD_PASSWORD_REQUIRED")
  private String oldPassword;

  @NotBlank(message = "NEW_PASSWORD_REQUIRED")
  @Size(min = 6, message = "PASSWORD_TOO_SHORT")
  private String newPassword;
}
