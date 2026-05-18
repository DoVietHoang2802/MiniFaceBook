package com.minifacebook.module.auth.domain.repository;

import com.minifacebook.module.auth.domain.model.RefreshToken;
import java.util.Optional;

/**
 * Giao thức lưu trữ và thao tác dữ liệu RefreshToken.
 * Đặt tại Domain layer độc lập hoàn toàn với Spring Data hay MongoDB.
 */
public interface RefreshTokenRepository {

  /**
   * Lưu hoặc cập nhật RefreshToken.
   */
  RefreshToken save(RefreshToken refreshToken);

  /**
   * Tìm kiếm RefreshToken bằng chuỗi token.
   */
  Optional<RefreshToken> findByToken(String token);

  /**
   * Xóa bỏ tất cả token hoạt động của người dùng (khi logout hoặc thu hồi).
   */
  void deleteByEmail(String email);
}
