package com.minifacebook.module.notification.infrastructure.persistence.repository;

import com.minifacebook.module.notification.infrastructure.persistence.document.NotificationDocument;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

/**
 * Spring Data MongoDB repository cho NotificationDocument (Phase 5.1).
 */
@Repository
public interface MongoNotificationRepository
    extends MongoRepository<NotificationDocument, String> {

  /** Lấy thông báo của người nhận, phân trang (sort do Pageable quyết định). */
  Page<NotificationDocument> findByRecipientId(String recipientId, Pageable pageable);

  /** Đếm số thông báo chưa đọc của người nhận. */
  long countByRecipientIdAndIsReadFalse(String recipientId);
}
