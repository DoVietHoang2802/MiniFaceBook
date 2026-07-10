package com.minifacebook.module.auth.application.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO đại diện cho yêu cầu cập nhật thông tin cá nhân của người dùng.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {

  private String avatar;

  @Size(max = 255, message = "Bio must be at most 255 characters")
  private String bio;

  private String city;

  private String hometown;

  private String work;

  private String relationship;
}
