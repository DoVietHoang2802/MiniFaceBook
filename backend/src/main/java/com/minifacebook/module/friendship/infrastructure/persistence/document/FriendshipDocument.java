package com.minifacebook.module.friendship.infrastructure.persistence.document;

import com.minifacebook.module.friendship.domain.entity.FriendshipStatus;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * MongoDB Document đại diện cho collection "friendships".
 *
 * <p>Compound Index unique trên cặp (requesterId, addresseeId) đảm bảo không thể tạo trùng lời mời
 * theo cùng một chiều.
 */
@Document(collection = "friendships")
@CompoundIndex(
    name = "requester_addressee_idx",
    def = "{'requesterId': 1, 'addresseeId': 1}",
    unique = true)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FriendshipDocument {
  @Id private String id;

  private String requesterId;
  private String addresseeId;
  private FriendshipStatus status;

  @CreatedDate private Instant createdAt;

  @LastModifiedDate private Instant updatedAt;
}
