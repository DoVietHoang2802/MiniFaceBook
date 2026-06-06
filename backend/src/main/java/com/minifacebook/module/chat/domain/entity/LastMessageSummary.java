package com.minifacebook.module.chat.domain.entity;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Value Object chứa tóm tắt tin nhắn cuối cùng (Sprint 4.2).
 * Giúp tối ưu hóa payload khi hiển thị danh sách cuộc hội thoại.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LastMessageSummary {
  private String senderId;
  private String contentPreview; // Tối đa 100 ký tự
  private MessageType type;
  private Instant sentAt;
}
