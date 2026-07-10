package com.minifacebook.module.auth.application.dto;

import com.minifacebook.module.auth.domain.model.Role;
import java.time.Instant;
import java.util.Set;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO đại diện cho thông tin người dùng trả về phía Client. Đặt tại tầng Application đóng vai trò
 * làm giao ước dữ liệu nghiệp vụ.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
  private String id;
  private String name;
  private String email;
  private String avatar;
  private String bio;
  private String city;
  private String hometown;
  private String work;
  private String relationship;
  private Set<Role> roles;
  private Instant createdAt;
  private Instant updatedAt;
}
