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

  private String password;

  private String avatar;

  private String bio;

  private Set<Role> roles;
}
