package com.minifacebook.module.auth.infrastructure.mapper;

import com.minifacebook.module.auth.domain.model.User;
import com.minifacebook.module.auth.infrastructure.persistence.document.UserDocument;
import com.minifacebook.shared.mapper.GlobalMapperConfig;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * Mapper chuyển đổi giữa thực thể Domain User và MongoDB UserDocument. Đảm bảo tính đóng gói dữ
 * liệu của tầng Domain.
 */
@Mapper(config = GlobalMapperConfig.class)
public interface UserDocumentMapper {

  @Mapping(target = "createdBy", ignore = true)
  @Mapping(target = "updatedBy", ignore = true)
  UserDocument toDocument(User user);

  User toDomain(UserDocument document);

  default LocalDateTime map(Instant instant) {
    return instant == null ? null : LocalDateTime.ofInstant(instant, ZoneOffset.UTC);
  }

  default Instant map(LocalDateTime localDateTime) {
    return localDateTime == null ? null : localDateTime.toInstant(ZoneOffset.UTC);
  }
}
