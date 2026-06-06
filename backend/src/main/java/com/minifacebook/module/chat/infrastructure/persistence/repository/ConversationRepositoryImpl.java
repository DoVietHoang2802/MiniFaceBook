package com.minifacebook.module.chat.infrastructure.persistence.repository;

import com.minifacebook.module.chat.domain.entity.Conversation;
import com.minifacebook.module.chat.domain.repository.ConversationRepository;
import com.minifacebook.module.chat.infrastructure.mapper.ChatMapper;
import com.minifacebook.module.chat.infrastructure.persistence.document.ConversationDocument;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

/**
 * Adapter hiện thực hóa ConversationRepository (Port) bằng MongoDB.
 */
@Component
@RequiredArgsConstructor
public class ConversationRepositoryImpl implements ConversationRepository {

  private final MongoConversationRepository mongoRepository;
  private final ChatMapper mapper;

  @Override
  public Conversation save(Conversation conversation) {
    ConversationDocument doc = mapper.toDocument(conversation);
    ConversationDocument saved = mongoRepository.save(doc);
    return mapper.toDomain(saved);
  }

  @Override
  public Optional<Conversation> findById(String id) {
    return mongoRepository.findById(id).map(mapper::toDomain);
  }

  @Override
  public Optional<Conversation> findByParticipantIds(List<String> participantIds) {
    return mongoRepository.findByParticipantIds(participantIds).map(mapper::toDomain);
  }

  @Override
  public Page<Conversation> findByParticipantId(String participantId, Pageable pageable) {
    return mongoRepository.findByParticipantIdsContaining(participantId, pageable)
        .map(mapper::toDomain);
  }

  @Override
  public void delete(Conversation conversation) {
    if (conversation.getId() != null) {
      mongoRepository.deleteById(conversation.getId());
    }
  }
}
