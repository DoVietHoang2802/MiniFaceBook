package com.minifacebook.module.friendship.domain.entity;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Thực thể Friendship cốt lõi (Domain Entity). POJO thuần túy, độc lập hoàn toàn với MongoDB và
 * Spring Framework theo chuẩn Clean Architecture.
 *
 * <p>{@code requesterId} là người gửi lời mời, {@code addresseeId} là người nhận lời mời.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Friendship {
  private String id;
  private String requesterId;
  private String addresseeId;
  private FriendshipStatus status;
  private Instant createdAt;
  private Instant updatedAt;
}
