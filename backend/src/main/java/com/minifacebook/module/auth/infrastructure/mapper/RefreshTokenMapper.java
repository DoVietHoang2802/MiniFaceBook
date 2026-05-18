package com.minifacebook.module.auth.infrastructure.mapper;

import com.minifacebook.module.auth.domain.model.RefreshToken;
import com.minifacebook.module.auth.infrastructure.persistence.document.RefreshTokenDocument;
import com.minifacebook.shared.mapper.GlobalMapperConfig;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * Mapper chuyển đổi giữa thực thể Domain RefreshToken và MongoDB RefreshTokenDocument.
 */
@Mapper(config = GlobalMapperConfig.class)
public interface RefreshTokenMapper {

  @Mapping(target = "createdBy", ignore = true)
  @Mapping(target = "updatedBy", ignore = true)
  RefreshTokenDocument toDocument(RefreshToken token);

  RefreshToken toDomain(RefreshTokenDocument document);

  default LocalDateTime map(Instant instant) {
    return instant == null ? null : LocalDateTime.ofInstant(instant, ZoneOffset.UTC);
  }

  default Instant map(LocalDateTime localDateTime) {
    return localDateTime == null ? null : localDateTime.toInstant(ZoneOffset.UTC);
  }
}
