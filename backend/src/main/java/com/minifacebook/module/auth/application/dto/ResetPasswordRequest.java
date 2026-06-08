package com.minifacebook.module.auth.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** DTO dai dien cho yeu cau dat lai mat khau moi su dung resetToken. */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResetPasswordRequest {

  @NotBlank(message = "RESET_TOKEN_REQUIRED")
  private String resetToken;

  @NotBlank(message = "PASSWORD_REQUIRED")
  @Size(min = 6, message = "PASSWORD_TOO_SHORT")
  private String newPassword;
}
