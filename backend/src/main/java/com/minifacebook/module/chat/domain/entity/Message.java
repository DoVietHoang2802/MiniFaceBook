package com.minifacebook.module.chat.domain.entity;

import java.time.Instant;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Thực thể tin nhắn (Domain Entity). POJO thuần túy, độc lập hoàn toàn với database.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Message {
  private String id;
  private String conversationId;
  private String senderId;
  private String content;
  private MessageType type;
  private String mediaUrl;
  private Instant deliveredAt; // null nếu chưa nhận được
  private Instant seenAt;      // null nếu chưa đọc
  private Instant createdAt;

  /**
   * Reactions của tin nhắn: key = userId, value = emoji (Sprint 4.4 - Message Reactions).
   * Dùng Map embedded vì chat 1-1 tối đa 2 người react → tối ưu, load cùng message.
   */
  private Map<String, String> reactions;
}
