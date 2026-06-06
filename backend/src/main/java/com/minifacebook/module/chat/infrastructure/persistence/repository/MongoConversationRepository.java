package com.minifacebook.module.chat.infrastructure.persistence.repository;

import com.minifacebook.module.chat.infrastructure.persistence.document.ConversationDocument;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

/**
 * Spring Data MongoDB repository cho ConversationDocument.
 */
@Repository
public interface MongoConversationRepository extends MongoRepository<ConversationDocument, String> {

  /**
   * Tìm cuộc trò chuyện chính xác theo cặp participantIds (đã sắp xếp).
   */
  Optional<ConversationDocument> findByParticipantIds(List<String> participantIds);

  /**
   * Lấy danh sách cuộc trò chuyện của một user có phân trang.
   */
  Page<ConversationDocument> findByParticipantIdsContaining(String participantId, Pageable pageable);
}
