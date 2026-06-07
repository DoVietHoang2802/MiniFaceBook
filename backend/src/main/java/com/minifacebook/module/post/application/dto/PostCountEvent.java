package com.minifacebook.module.post.application.dto;

import java.util.Map;
import lombok.Builder;
import lombok.Getter;

/**
 * Sự kiện cập nhật số đếm tương tác của một bài viết (Phase 5 - Realtime Feed Counts).
 *
 * <p>Payload cố tình nhẹ: chỉ gồm số đếm tổng + bản đồ reaction (để FE vẽ lại cụm emoji), KHÔNG
 * kèm nội dung comment/bài viết → tiết kiệm băng thông khi broadcast tới mọi người đang xem bài.
 */
@Getter
@Builder
public class PostCountEvent {

  private String postId;

  /** Tổng số lượt thả cảm xúc (sum của reactionsCount). */
  private int reactCount;

  private int commentCount;

  /** Bản đồ loại cảm xúc → số lượng (key là tên enum: "LIKE", "LOVE"...). */
  private Map<String, Integer> reactionsCount;
}
