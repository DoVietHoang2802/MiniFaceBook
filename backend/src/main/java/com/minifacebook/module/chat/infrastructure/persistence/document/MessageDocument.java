package com.minifacebook.module.chat.infrastructure.persistence.document;

import com.minifacebook.module.chat.domain.entity.MessageType;
import java.time.Instant;
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
}
