package com.minifacebook.module.notification.infrastructure.persistence.document;

import com.minifacebook.module.notification.domain.entity.NotificationType;
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
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * MongoDB Document đại diện cho collection "notifications" (Phase 5.1).
 *
 * <p>Index ghép {recipientId:1, createdAt:-1} phục vụ truy vấn chính: lấy thông báo của 1 người
 * dùng sắp xếp mới nhất trước (notification center).
 */
@Document(collection = "notifications")
@CompoundIndexes({
  @CompoundIndex(name = "recipient_created_idx", def = "{'recipientId': 1, 'createdAt': -1}")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationDocument {
  @Id
  private String id;

  private String recipientId;

  private String actorId;

  private NotificationType type;

  private String entityId;

  private String content;

  private boolean isRead;

  @CreatedDate
  private Instant createdAt;
}
