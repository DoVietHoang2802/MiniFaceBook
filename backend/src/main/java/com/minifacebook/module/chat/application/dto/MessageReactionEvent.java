package com.minifacebook.module.chat.application.dto;

import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Event báo cập nhật reaction của 1 tin nhắn, gửi tới các participant qua WebSocket (Sprint 4.4).
 *
 * <p>Gửi nguyên bản đồ reactions đầy đủ để client chỉ việc thay thế (idempotent),
 * không cần tính toán delta phía client.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageReactionEvent {

  private String conversationId;
  private String messageId;

  /** Toàn bộ reactions hiện tại: key = userId, value = emoji. */
  private Map<String, String> reactions;
}
