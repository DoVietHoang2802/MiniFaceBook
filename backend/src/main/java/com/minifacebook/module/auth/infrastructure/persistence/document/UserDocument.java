package com.minifacebook.module.auth.infrastructure.persistence.document;

import com.minifacebook.module.auth.domain.model.Role;
import com.minifacebook.shared.domain.BaseEntity;
import java.util.Set;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Lớp đại diện cho MongoDB Document của bảng Users. Kế thừa các thuộc tính kiểm toán tự động từ
 * BaseEntity. Không sử dụng @Builder để MapStruct sử dụng các setter thông thường, tương thích hoàn
 * hảo với lớp cha BaseEntity.
 */
@Document(collection = "users")
@Getter
@Setter
@NoArgsConstructor
public class UserDocument extends BaseEntity {

  @Indexed(unique = true)
  private String email;

  /** Họ và tên hiển thị. Có index để tăng tốc tìm kiếm người dùng (Sprint 3.3). */
  @Indexed
  private String name;

  private String password;

  private String avatar;

  private String cover;

  private String bio;

  private String city;

  private String hometown;

  private String work;

  private String relationship;

  private Set<Role> roles;

  private boolean verified;

  private String verificationToken;
}
