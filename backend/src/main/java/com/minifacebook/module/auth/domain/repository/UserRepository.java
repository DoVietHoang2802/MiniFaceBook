package com.minifacebook.module.auth.domain.repository;

import com.minifacebook.module.auth.domain.model.User;
import java.util.List;
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

  /**
   * Lấy danh sách nhiều User theo danh sách id chỉ trong MỘT truy vấn (batch load). Dùng để tránh
   * vấn đề N+1 query khi cần load thông tin nhiều user cùng lúc (vd: danh sách bạn bè).
   */
  List<User> findAllByIds(List<String> ids);

  /**
   * Tìm kiếm người dùng theo tên (không phân biệt hoa thường, khớp một phần). Có phân trang. Phục
   * vụ tính năng Search & Discovery (Sprint 3.3).
   */
  org.springframework.data.domain.Page<User> searchByName(
      String keyword, org.springframework.data.domain.Pageable pageable);
}
