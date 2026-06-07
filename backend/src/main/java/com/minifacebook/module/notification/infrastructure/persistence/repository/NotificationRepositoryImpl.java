package com.minifacebook.module.notification.infrastructure.persistence.repository;

import com.minifacebook.module.notification.domain.entity.Notification;
import com.minifacebook.module.notification.domain.repository.NotificationRepository;
import com.minifacebook.module.notification.infrastructure.mapper.NotificationMapper;
import com.minifacebook.module.notification.infrastructure.persistence.document.NotificationDocument;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

/**
 * Adapter hiện thực hóa NotificationRepository (Port) bằng MongoDB (Phase 5.1).
 */
@Component
@RequiredArgsConstructor
public class NotificationRepositoryImpl implements NotificationRepository {

  private final MongoNotificationRepository mongoRepository;
  private final MongoTemplate mongoTemplate;
  private final NotificationMapper mapper;

  @Override
  public Notification save(Notification notification) {
    NotificationDocument doc = mapper.toDocument(notification);
    NotificationDocument saved = mongoRepository.save(doc);
    return mapper.toDomain(saved);
  }

  @Override
  public Optional<Notification> findById(String id) {
    return mongoRepository.findById(id).map(mapper::toDomain);
  }

  @Override
  public Page<Notification> findByRecipientId(String recipientId, Pageable pageable) {
    return mongoRepository.findByRecipientId(recipientId, pageable).map(mapper::toDomain);
  }

  @Override
  public long countUnread(String recipientId) {
    return mongoRepository.countByRecipientIdAndIsReadFalse(recipientId);
  }

  @Override
  public long markAllAsRead(String recipientId) {
    // updateMulti để đánh dấu tất cả trong 1 lệnh DB (tránh load-rồi-save từng bản ghi).
    Query query =
        new Query(Criteria.where("recipientId").is(recipientId).and("isRead").is(false));
    Update update = new Update().set("isRead", true);
    return mongoTemplate.updateMulti(query, update, NotificationDocument.class).getModifiedCount();
  }
}
