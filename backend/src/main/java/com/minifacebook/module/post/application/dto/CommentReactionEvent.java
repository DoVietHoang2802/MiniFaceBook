package com.minifacebook.module.post.application.dto;

import java.util.Map;
import lombok.Builder;
import lombok.Getter;

/**
 * Sự kiện cập nhật reaction counts cho một bình luận (Comment Reactions - realtime).
 *
 * <p>Payload nhẹ: chỉ gồm reaction counts và reaction hiện tại của user đang xem.
 */
@Getter
@Builder
public class CommentReactionEvent {

  private String commentId;

  /** Bản đồ loại cảm xúc → số lượng (key là tên enum: "LIKE", "LOVE"...). */
  private Map<String, Integer> reactionCounts;

  /** Reaction hiện tại của user đang xem (có thể null nếu chưa reaction). */
  private String userReaction;
}
