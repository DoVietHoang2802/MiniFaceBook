package com.minifacebook.module.chat.infrastructure.persistence.document;

import com.minifacebook.module.chat.domain.entity.LastMessageSummary;
import java.time.Instant;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * MongoDB Document đại diện cho collection "conversations".
 */
@Document(collection = "conversations")
@CompoundIndexes({
  @CompoundIndex(name = "participants_unique_idx", def = "{'participantIds': 1}", unique = true),
  @CompoundIndex(name = "last_message_at_idx", def = "{'lastMessageAt': -1}")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConversationDocument {
  @Id
  private String id;

  private List<String> participantIds; // Lưu mảng 2 phần tử đã được sort

  private LastMessageSummary lastMessageSummary; // Embed tóm tắt tin nhắn cuối

  private Instant lastMessageAt;

  @CreatedDate
  private Instant createdAt;
}
