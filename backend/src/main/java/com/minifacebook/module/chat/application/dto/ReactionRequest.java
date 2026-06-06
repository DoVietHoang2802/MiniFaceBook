package com.minifacebook.module.chat.application.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request gửi qua WebSocket STOMP khi user thả/gỡ cảm xúc cho 1 tin nhắn (Sprint 4.4 - Message Reactions).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReactionRequest {

  @NotBlank
  private String messageId;

  /** Emoji cảm xúc (❤️ 👍 😂 😮 😢 😡). */
  @NotBlank
  private String emoji;
}
