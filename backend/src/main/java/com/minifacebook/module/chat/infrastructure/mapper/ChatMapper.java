package com.minifacebook.module.chat.infrastructure.mapper;

import com.minifacebook.module.chat.domain.entity.Conversation;
import com.minifacebook.module.chat.domain.entity.Message;
import com.minifacebook.module.chat.infrastructure.persistence.document.ConversationDocument;
import com.minifacebook.module.chat.infrastructure.persistence.document.MessageDocument;
import com.minifacebook.shared.mapper.GlobalMapperConfig;
import org.mapstruct.Mapper;

/**
 * MapStruct mapper chuyển đổi giữa Domain Entity và MongoDB Document cho Chat Module.
 */
@Mapper(config = GlobalMapperConfig.class)
public interface ChatMapper {

  Conversation toDomain(ConversationDocument document);

  ConversationDocument toDocument(Conversation domain);

  Message toDomain(MessageDocument document);

  MessageDocument toDocument(Message domain);
}
