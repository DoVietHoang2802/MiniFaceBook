package com.minifacebook.module.notification.domain.entity;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Thực thể Thông báo (Domain Entity - POJO thuần, Phase 5.1).
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {
  private String id;

  /** Người nhận thông báo. */
  private String recipientId;

  /** Người gây ra hành động (người like, người gửi lời mời...). */
  private String actorId;

  private NotificationType type;

  /** ID thực thể liên quan (postId/commentId/friendshipId) để điều hướng khi click. */
  private String entityId;

  /** Nội dung mô tả ngắn. */
  private String content;

  private boolean isRead;

  private Instant createdAt;
}
