package com.minifacebook.module.friendship.application.dto;

/**
 * Trạng thái quan hệ giữa user hiện tại và một user khác (góc nhìn từ phía user hiện tại). Dùng
 * trong kết quả tìm kiếm để Frontend hiển thị đúng nút hành động.
 *
 * <ul>
 *   <li>NONE: Chưa có quan hệ → nút "Kết bạn".
 *   <li>PENDING_SENT: Mình đã gửi lời mời, đang chờ → nút "Thu hồi".
 *   <li>PENDING_RECEIVED: Người kia gửi lời mời cho mình → nút "Chấp nhận/Từ chối".
 *   <li>FRIEND: Đã là bạn bè → nhãn "Bạn bè".
 *   <li>BLOCKED: Mình đã chặn người kia → nút "Bỏ chặn".
 * </ul>
 */
public enum RelationshipStatus {
  NONE,
  PENDING_SENT,
  PENDING_RECEIVED,
  FRIEND,
  BLOCKED
}
