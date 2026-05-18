package com.minifacebook.module.auth.domain.model;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Thực thể RefreshToken cốt lõi (Domain Entity) phục vụ cho cơ chế Refresh Token Rotation.
 * Đóng gói độc lập hoàn toàn với framework và cơ sở dữ liệu.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefreshToken {
  private String id;
  private String token;
  private String email;
  private Instant expiryDate;
  private boolean revoked;
}
