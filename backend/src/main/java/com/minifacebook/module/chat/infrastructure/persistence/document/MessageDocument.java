package com.minifacebook.module.chat.infrastructure.persistence.document;

import com.minifacebook.module.chat.domain.entity.MessageType;
import com.minifacebook.module.chat.domain.entity.ReplyPreview;
import java.time.Instant;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * MongoDB Document đại diện cho collection "messages".
 */
@Document(collection = "messages")
@CompoundIndexes({
  @CompoundIndex(name = "conv_created_idx", def = "{'conversationId': 1, 'createdAt': -1}")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageDocument {
  @Id
  private String id;

  @Indexed
  private String conversationId;

  @Indexed
  private String senderId;

  private String content;

  private MessageType type;

  private String mediaUrl;

  private Instant deliveredAt;

  private Instant seenAt;

  @CreatedDate
  private Instant createdAt;

  /** Reactions embedded: key = userId, value = emoji (Sprint 4.4). */
  private Map<String, String> reactions;

  /** Snapshot tin nhắn được trả lời (Sprint 4.4 - Reply). */
  private ReplyPreview replyTo;

  /** Thời điểm chỉnh sửa (Sprint 4.5). */
  private Instant editedAt;

  /** Đã thu hồi cho mọi người (Sprint 4.5). */
  private boolean deleted;

  /** userId đã xóa cho riêng mình (Sprint 4.5). */
  private java.util.Set<String> deletedFor;
}
