package com.minifacebook.module.chat.application.dto;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Event đại diện cho sự thay đổi trạng thái của tin nhắn (SENT, DELIVERED, SEEN) gửi qua WebSocket (Sprint 4.2).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageStatusEvent {
  private String conversationId;
  private String messageId;
  private String status; // DELIVERED, SEEN
  private Instant timestamp; // deliveredAt hoặc seenAt
  private String userId; // Người trigger thay đổi (seenBy hoặc recipientId)
}
