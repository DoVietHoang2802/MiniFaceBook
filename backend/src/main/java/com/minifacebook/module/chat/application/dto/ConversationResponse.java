package com.minifacebook.module.chat.application.dto;

import com.minifacebook.module.chat.domain.entity.LastMessageSummary;
import java.time.Instant;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO trả về thông tin cuộc trò chuyện (Sprint 4.2).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationResponse {
  private String id;
  private List<ParticipantResponse> participants;
  private LastMessageSummary lastMessage; // Map từ lastMessageSummary
  private Integer unreadCount;
  private Instant lastMessageAt;
  private Instant createdAt;
}
