package com.minifacebook.module.chat.infrastructure.persistence.repository;

import com.minifacebook.module.chat.domain.entity.Message;
import com.minifacebook.module.chat.domain.repository.MessageRepository;
import com.minifacebook.module.chat.infrastructure.mapper.ChatMapper;
import com.minifacebook.module.chat.infrastructure.persistence.document.MessageDocument;
import java.time.Instant;
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
 * Adapter hiện thực hóa MessageRepository (Port) bằng MongoDB.
 */
@Component
@RequiredArgsConstructor
public class MessageRepositoryImpl implements MessageRepository {

  private final MongoMessageRepository mongoRepository;
  private final MongoTemplate mongoTemplate;
  private final ChatMapper mapper;

  @Override
  public Message save(Message message) {
    MessageDocument doc = mapper.toDocument(message);
    MessageDocument saved = mongoRepository.save(doc);
    return mapper.toDomain(saved);
  }

  @Override
  public Optional<Message> findById(String id) {
    return mongoRepository.findById(id).map(mapper::toDomain);
  }

  @Override
  public Page<Message> findByConversationId(String conversationId, Pageable pageable) {
    return mongoRepository.findByConversationId(conversationId, pageable)
        .map(mapper::toDomain);
  }

  @Override
  public int countUnreadMessages(String conversationId, String userId) {
    return mongoRepository.countByConversationIdAndSenderIdNotAndSeenAtIsNull(conversationId, userId);
  }

  @Override
  public void markAsSeen(String conversationId, String userIdNot, Instant seenAt) {
    Query query = new Query(
        Criteria.where("conversationId").is(conversationId)
            .and("senderId").ne(userIdNot)
            .and("seenAt").isNull()
    );
    Update update = new Update().set("seenAt", seenAt);
    mongoTemplate.updateMulti(query, update, MessageDocument.class);
  }
}
