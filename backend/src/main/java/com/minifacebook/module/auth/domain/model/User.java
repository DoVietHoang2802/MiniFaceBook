package com.minifacebook.module.auth.domain.model;

import java.time.Instant;
import java.util.Set;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Thực thể User cốt lõi (Domain Entity) của hệ thống. Đảm bảo tính độc lập hoàn toàn với cơ sở dữ
 * liệu và framework.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {
  private String id;
  private String email;
  private String password;
  private String avatar;
  private String bio;
  private Set<Role> roles;
  private boolean verified;
  private String verificationToken;
  private Instant createdAt;
  private Instant updatedAt;
}
