package com.minifacebook.module.friendship.application.dto;

import com.minifacebook.module.friendship.domain.entity.FriendshipStatus;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** DTO trả về thông tin một mối quan hệ kết bạn kèm thông tin tóm tắt của đối phương. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FriendshipResponse {
  private String friendshipId;
  private FriendshipStatus status;

  /** Thông tin user đối phương (không phải user đang đăng nhập). */
  private String userId;

  private String email;
  private String avatar;
  private String bio;

  private Instant createdAt;
}
