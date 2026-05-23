package com.minifacebook.module.post.infrastructure.mapper;

import com.minifacebook.module.post.domain.entity.Reaction;
import com.minifacebook.module.post.infrastructure.persistence.document.ReactionDocument;
import com.minifacebook.shared.mapper.GlobalMapperConfig;
import org.mapstruct.Mapper;

@Mapper(config = GlobalMapperConfig.class)
public interface ReactionMapper {
    Reaction toDomain(ReactionDocument document);
    ReactionDocument toDocument(Reaction domain);
}
