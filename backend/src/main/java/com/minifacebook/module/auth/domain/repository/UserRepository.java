package com.minifacebook.module.auth.domain.repository;

import com.minifacebook.module.auth.domain.model.User;
import java.util.Optional;

/**
 * Interface định nghĩa cổng lưu trữ của thực thể User. Tuân thủ quy chuẩn không phụ thuộc công nghệ
 * lưu trữ tại tầng Domain.
 */
public interface UserRepository {

  Optional<User> findByEmail(String email);

  boolean existsByEmail(String email);

  User save(User user);

  Optional<User> findById(String id);

  Optional<User> findByVerificationToken(String token);
}
