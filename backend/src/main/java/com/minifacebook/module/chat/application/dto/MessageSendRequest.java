package com.minifacebook.module.chat.application.dto;

import com.minifacebook.module.chat.domain.entity.MessageType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO nhận dữ liệu gửi tin nhắn từ client qua REST hoặc WebSocket (Sprint 4.3).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageSendRequest {

  @NotBlank(message = "ID cuộc trò chuyện không được để trống")
  private String conversationId;

  private String content;

  @NotNull(message = "Kiểu tin nhắn không được để trống")
  private MessageType type;

  private String mediaUrl;

  /** ID tin nhắn được trả lời (null nếu không phải reply) - Sprint 4.4. */
  private String replyToMessageId;
}
