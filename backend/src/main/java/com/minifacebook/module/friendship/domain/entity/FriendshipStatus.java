package com.minifacebook.module.friendship.domain.entity;

/**
 * Trạng thái của một mối quan hệ kết bạn.
 *
 * <ul>
 *   <li>PENDING: Lời mời đã gửi, đang chờ phản hồi.
 *   <li>ACCEPTED: Hai người đã là bạn bè.
 *   <li>REJECTED: Lời mời đã bị từ chối.
 *   <li>BLOCKED: Một người đã chặn người kia.
 * </ul>
 */
public enum FriendshipStatus {
  PENDING,
  ACCEPTED,
  REJECTED,
  BLOCKED
}
