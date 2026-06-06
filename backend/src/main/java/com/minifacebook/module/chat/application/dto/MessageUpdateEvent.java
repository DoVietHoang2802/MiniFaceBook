package com.minifacebook.module.chat.application.dto;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Event báo cập nhật nội dung tin nhắn (sửa hoặc thu hồi) gửi tới participant qua WebSocket (Sprint 4.5).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageUpdateEvent {

  private String conversationId;
  private String messageId;

  /** Nội dung mới sau khi sửa (null nếu là thu hồi). */
  private String content;

  /** Thời điểm chỉnh sửa (null nếu là thu hồi). */
  private Instant editedAt;

  /** true = tin nhắn đã bị thu hồi cho mọi người. */
  private boolean deleted;
}
