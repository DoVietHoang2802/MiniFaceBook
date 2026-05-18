package com.minifacebook.module.auth.infrastructure.persistence.document;

import com.minifacebook.shared.domain.BaseEntity;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Lớp đại diện cho MongoDB Document của bảng refresh_tokens.
 * Kế thừa các thuộc tính kiểm toán tự động từ BaseEntity.
 */
@Document(collection = "refresh_tokens")
@Getter
@Setter
@NoArgsConstructor
public class RefreshTokenDocument extends BaseEntity {

  @Indexed(unique = true)
  private String token;

  @Indexed
  private String email;

  private LocalDateTime expiryDate;

  private boolean revoked;
}
