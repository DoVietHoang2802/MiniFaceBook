package com.minifacebook.module.chat.application.dto;

import com.minifacebook.module.chat.domain.entity.MessageType;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO trả về thông tin chi tiết một tin nhắn (Sprint 4.2).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageResponse {
  private String id;
  private String conversationId;
  private ParticipantResponse sender;
  private String content;
  private MessageType type;
  private String mediaUrl;
  private Instant deliveredAt;
  private Instant seenAt;
  private Instant createdAt;
}
