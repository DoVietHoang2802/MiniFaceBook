package com.minifacebook.module.auth.infrastructure.persistence.repository;

import com.minifacebook.module.auth.infrastructure.persistence.document.RefreshTokenDocument;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

/**
 * Spring Data MongoDB Repository xử lý các thao tác truy vấn dữ liệu thô cho refresh_tokens.
 */
@Repository
public interface MongoRefreshTokenRepository extends MongoRepository<RefreshTokenDocument, String> {

  /**
   * Tìm document bằng chuỗi token.
   */
  Optional<RefreshTokenDocument> findByToken(String token);

  /**
   * Xóa toàn bộ token của người dùng.
   */
  void deleteByEmail(String email);
}
