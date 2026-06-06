package com.minifacebook.module.chat.infrastructure.persistence.repository;

import com.minifacebook.module.chat.infrastructure.persistence.document.MessageDocument;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

/**
 * Spring Data MongoDB repository cho MessageDocument.
 */
@Repository
public interface MongoMessageRepository extends MongoRepository<MessageDocument, String> {

  /**
   * Lấy danh sách tin nhắn của cuộc trò chuyện có phân trang.
   */
  Page<MessageDocument> findByConversationId(String conversationId, Pageable pageable);

  /**
   * Đếm số tin nhắn chưa đọc của cuộc hội thoại (trừ tin nhắn do chính user gửi).
   */
  int countByConversationIdAndSenderIdNotAndSeenAtIsNull(String conversationId, String senderId);
}
