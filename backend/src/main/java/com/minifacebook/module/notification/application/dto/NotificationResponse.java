package com.minifacebook.module.notification.application.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.minifacebook.module.notification.domain.entity.NotificationType;
import java.time.Instant;
import lombok.Builder;
import lombok.Getter;

/**
 * DTO trả về cho client một thông báo (Phase 5.1).
 *
 * <p>Đã enrich sẵn thông tin người gây ra hành động (actorName/actorAvatar) để FE render trực tiếp
 * "Ai đã làm gì" mà không phải gọi thêm API (chống N+1 phía client).
 */
@Getter
@Builder
public class NotificationResponse {

  private String id;

  private String actorId;

  private String actorName;

  private String actorAvatar;

  private NotificationType type;

  /** ID thực thể liên quan (postId/commentId/friendshipId) để FE điều hướng khi click. */
  private String entityId;

  private String content;

  @JsonProperty("isRead")
  private boolean isRead;

  private Instant createdAt;
}
