package com.minifacebook.module.post.infrastructure.mapper;

import com.minifacebook.module.post.domain.entity.CommentReaction;
import com.minifacebook.module.post.infrastructure.persistence.document.CommentReactionDocument;
import com.minifacebook.shared.mapper.GlobalMapperConfig;
import org.mapstruct.Mapper;

@Mapper(config = GlobalMapperConfig.class)
public interface CommentReactionMapper {
    CommentReaction toDomain(CommentReactionDocument document);
    CommentReactionDocument toDocument(CommentReaction domain);
}
