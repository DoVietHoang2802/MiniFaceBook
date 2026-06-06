package com.minifacebook.module.chat.domain.entity;

import java.time.Instant;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Thực thể cuộc hội thoại 1-1 (Domain Entity). POJO thuần túy, độc lập hoàn toàn với database.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Conversation {
  private String id;
  private List<String> participantIds; // Luôn có đúng 2 thành viên
  private LastMessageSummary lastMessageSummary;
  private Instant lastMessageAt;
  private Instant createdAt;

  // Transient field phục vụ hiển thị số tin nhắn chưa đọc, không lưu xuống DB
  private Integer unreadCount;
}
