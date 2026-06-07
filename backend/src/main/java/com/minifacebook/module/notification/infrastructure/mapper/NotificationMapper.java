package com.minifacebook.module.notification.infrastructure.mapper;

import com.minifacebook.module.notification.domain.entity.Notification;
import com.minifacebook.module.notification.infrastructure.persistence.document.NotificationDocument;
import com.minifacebook.shared.mapper.GlobalMapperConfig;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * MapStruct mapper chuyển đổi giữa Domain Entity và MongoDB Document cho Notification Module
 * (Phase 5.1).
 *
 * <p>Phải khai báo tường minh {@code isRead} vì field boolean tên dạng {@code isXxx} kết hợp
 * {@code @Builder} của Lombok gây lệch tên property (getter → "read", builder → "isRead") khiến
 * MapStruct bỏ qua nếu không chỉ định.
 */
@Mapper(config = GlobalMapperConfig.class)
public interface NotificationMapper {

  @Mapping(target = "isRead", source = "read")
  Notification toDomain(NotificationDocument document);

  @Mapping(target = "isRead", source = "read")
  NotificationDocument toDocument(Notification domain);
}
