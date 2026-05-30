package com.minifacebook.module.auth.infrastructure.persistence.repository;

import com.minifacebook.module.auth.infrastructure.persistence.document.UserDocument;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

/** Spring Data MongoDB Repository cho UserDocument. */
@Repository
public interface MongoUserRepository extends MongoRepository<UserDocument, String> {

  Optional<UserDocument> findByEmail(String email);

  boolean existsByEmail(String email);

  Optional<UserDocument> findByVerificationToken(String verificationToken);

  /**
   * Tìm user theo tên, dùng Regex case-insensitive (option 'i') khớp một phần. Chỉ lấy các tài
   * khoản đã xác thực (verified=true) để không lộ tài khoản chưa kích hoạt.
   */
  @Query("{ 'name': { $regex: ?0, $options: 'i' }, 'verified': true }")
  Page<UserDocument> searchByName(String keyword, Pageable pageable);
}
