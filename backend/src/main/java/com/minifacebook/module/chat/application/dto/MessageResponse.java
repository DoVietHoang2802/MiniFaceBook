package com.minifacebook.module.chat.application.dto;

import com.minifacebook.module.chat.domain.entity.MessageType;
import com.minifacebook.module.chat.domain.entity.ReplyPreview;
import java.time.Instant;
import java.util.Map;
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

  /** Reactions của tin nhắn: key = userId, value = emoji (Sprint 4.4). */
  private Map<String, String> reactions;

  /** Snapshot tin nhắn được trả lời (Sprint 4.4 - Reply). */
  private ReplyPreview replyTo;

  /** Thời điểm chỉnh sửa (null nếu chưa sửa) - Sprint 4.5. */
  private Instant editedAt;

  /** true = đã thu hồi (xóa cho mọi người) - Sprint 4.5. */
  private boolean deleted;
}
