package com.minifacebook.module.friendship.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO cho mỗi gợi ý kết bạn (Sprint 3.4). Dựa trên thuật toán Mutual Friends - người có nhiều bạn
 * chung với user hiện tại sẽ được ưu tiên gợi ý.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FriendSuggestionResponse {
  private String userId;
  private String name;
  private String email;
  private String avatar;
  private String bio;

  /** Số lượng bạn chung với user hiện tại. */
  private int mutualFriendsCount;
}
