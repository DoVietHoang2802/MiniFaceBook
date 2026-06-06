package com.minifacebook.module.chat.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Event báo trạng thái "đang gõ" gửi tới đối phương qua WebSocket (Sprint 4.4 - Typing Indicator).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TypingEvent {

  private String conversationId;

  /** ID của người đang gõ (để client xác định và bỏ qua nếu là chính mình). */
  private String userId;

  /** Tên hiển thị của người đang gõ. */
  private String userName;

  /** true = đang gõ, false = đã dừng gõ. */
  private boolean typing;
}
