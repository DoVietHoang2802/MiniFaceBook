package com.minifacebook.module.chat.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Value Object lưu snapshot (denormalized) của tin nhắn được trả lời (Sprint 4.4 - Reply to Message).
 *
 * <p>Lưu snapshot thay vì chỉ lưu id để hiển thị quote ngay khi load danh sách tin nhắn,
 * tránh N+1 query (cùng nguyên tắc với {@link LastMessageSummary}).
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReplyPreview {
  private String messageId;
  private String senderId;
  private String senderName;
  private String contentPreview; // tối đa 80 ký tự, hoặc placeholder cho ảnh/file
}
