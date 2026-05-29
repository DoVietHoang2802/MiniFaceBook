package com.minifacebook.module.friendship.infrastructure.mapper;

import com.minifacebook.module.friendship.domain.entity.Friendship;
import com.minifacebook.module.friendship.infrastructure.persistence.document.FriendshipDocument;
import com.minifacebook.shared.mapper.GlobalMapperConfig;
import org.mapstruct.Mapper;

/** MapStruct mapper chuyển đổi giữa Domain Entity và MongoDB Document cho Friendship. */
@Mapper(config = GlobalMapperConfig.class)
public interface FriendshipMapper {
  Friendship toDomain(FriendshipDocument document);

  FriendshipDocument toDocument(Friendship domain);
}
