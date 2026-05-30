package com.minifacebook.module.post.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO đại diện cho một người đã thả cảm xúc vào bài viết. Dùng để hiển thị danh sách "ai đã thả gì"
 * giống Facebook (modal reactions).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReactionUserResponse {
  private String userId;
  private String name;
  private String avatar;

  /** Loại cảm xúc: LIKE, LOVE, HAHA, WOW, SAD, ANGRY. */
  private String type;
}
