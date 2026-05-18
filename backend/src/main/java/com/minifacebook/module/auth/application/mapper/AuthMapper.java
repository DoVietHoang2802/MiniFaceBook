package com.minifacebook.module.auth.application.mapper;

import com.minifacebook.module.auth.application.dto.RegisterRequest;
import com.minifacebook.module.auth.application.dto.UserResponse;
import com.minifacebook.module.auth.domain.model.User;
import com.minifacebook.shared.mapper.GlobalMapperConfig;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * Mapper MapStruct cho các thao tác Xác thực. Đặt tại tầng Application để thực hiện chuyển đổi
 * contract (DTOs) <-> Domain Entity.
 */
@Mapper(config = GlobalMapperConfig.class)
public interface AuthMapper {

  UserResponse toUserResponse(User user);

  @Mapping(target = "id", ignore = true)
  @Mapping(target = "roles", ignore = true)
  @Mapping(target = "createdAt", ignore = true)
  @Mapping(target = "updatedAt", ignore = true)
  User toUser(RegisterRequest request);
}
