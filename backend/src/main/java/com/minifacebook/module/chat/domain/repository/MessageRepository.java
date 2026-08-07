package com.minifacebook.module.chat.domain.repository;

import com.minifacebook.module.chat.domain.entity.Message;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Cổng lưu trữ (Port) cho thực thể Message.
 */
public interface MessageRepository {

  Message save(Message message);

  Optional<Message> findById(String id);

  /**
   * Lấy danh sách tin nhắn của một cuộc hội thoại có phân trang (thường sắp xếp theo thời gian tăng dần).
   */
  Page<Message> findByConversationId(String conversationId, Pageable pageable);

  /**
   * Đếm số tin nhắn chưa đọc của cuộc hội thoại (trừ tin nhắn do chính user gửi).
   */
  int countUnreadMessages(String conversationId, String userId);

  /**
   * Lấy tối đa các tin nhắn TEXT chưa xem gần nhất từ người còn lại trong cuộc hội thoại.
   */
  List<Message> findRecentUnreadTextMessages(String conversationId, String userId, int limit);

  /**
   * Cập nhật seenAt cho toàn bộ tin nhắn chưa đọc của cuộc trò chuyện do người khác gửi.
   */
  void markAsSeen(String conversationId, String userIdNot, Instant seenAt);
}
