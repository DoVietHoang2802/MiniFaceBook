package com.minifacebook.shared.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

/**
 * Event thông báo dùng chung (Phase 5.1) — đặt ở tầng shared để các module nghiệp vụ
 * (Post, Friendship, ...) publish mà KHÔNG phụ thuộc trực tiếp vào module Notification.
 *
 * <p>Module nguồn chỉ {@code applicationEventPublisher.publishEvent(...)}; module Notification
 * lắng nghe qua {@code @EventListener @Async} → giữ Clean Architecture (không coupling chéo).
 *
 * <p>Trường {@code type} dùng String (không phải enum của module Notification) để shared không
 * phụ thuộc ngược vào module.
 */
@Getter
@Builder
@AllArgsConstructor
public class NotificationEvent {

  /** Người NHẬN thông báo. */
  private final String recipientId;

  /** Người GÂY RA hành động (vd: người like, người gửi lời mời). */
  private final String actorId;

  /** Loại thông báo: "LIKE", "COMMENT", "FRIEND_REQUEST", "FRIEND_ACCEPTED". */
  private final String type;

  /** ID thực thể liên quan (postId / commentId / friendshipId) để điều hướng khi click. Nullable. */
  private final String entityId;

  /** Nội dung mô tả ngắn (vd: "đã gửi cho bạn lời mời kết bạn"). Nullable. */
  private final String content;
}
