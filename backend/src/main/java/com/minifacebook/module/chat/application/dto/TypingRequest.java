package com.minifacebook.module.chat.application.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request gửi qua WebSocket STOMP khi user bắt đầu/dừng gõ tin nhắn (Sprint 4.4 - Typing Indicator).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TypingRequest {

  @NotBlank
  private String conversationId;

  /** true = đang gõ, false = đã dừng gõ. */
  private boolean typing;
}
