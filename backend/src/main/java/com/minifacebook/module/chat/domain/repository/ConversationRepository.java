package com.minifacebook.module.chat.domain.repository;

import com.minifacebook.module.chat.domain.entity.Conversation;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Cổng lưu trữ (Port) cho thực thể Conversation.
 */
public interface ConversationRepository {

  Conversation save(Conversation conversation);

  Optional<Conversation> findById(String id);

  /**
   * Tìm cuộc trò chuyện chính xác theo cặp participantIds (đã sắp xếp).
   */
  Optional<Conversation> findByParticipantIds(List<String> participantIds);

  /**
   * Lấy danh sách cuộc trò chuyện của một user có phân trang (sắp xếp theo tin nhắn mới nhất).
   */
  Page<Conversation> findByParticipantId(String participantId, Pageable pageable);

  void delete(Conversation conversation);
}
