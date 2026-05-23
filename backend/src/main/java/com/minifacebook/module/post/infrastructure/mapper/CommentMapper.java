package com.minifacebook.module.post.infrastructure.mapper;

import com.minifacebook.module.post.domain.entity.Comment;
import com.minifacebook.module.post.infrastructure.persistence.document.CommentDocument;
import com.minifacebook.shared.mapper.GlobalMapperConfig;
import org.mapstruct.Mapper;

@Mapper(config = GlobalMapperConfig.class)
public interface CommentMapper {
    Comment toDomain(CommentDocument document);
    CommentDocument toDocument(Comment domain);
}
