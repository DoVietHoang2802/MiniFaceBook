package com.minifacebook.module.notification.domain.entity;

/**
 * Loại thông báo trong notification center (Phase 5.1).
 *
 * <p>Lưu ý: NEW_MESSAGE KHÔNG nằm ở đây — tin nhắn mới hiển thị qua chấm đỏ unread trên nút Chats
 * (giống Facebook/Zalo), không vào notification center.
 */
public enum NotificationType {
  LIKE,
  COMMENT,
  FRIEND_REQUEST,
  FRIEND_ACCEPTED
}
