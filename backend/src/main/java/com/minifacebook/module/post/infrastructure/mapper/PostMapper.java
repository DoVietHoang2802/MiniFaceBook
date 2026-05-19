package com.minifacebook.module.post.infrastructure.mapper;

import com.minifacebook.module.post.domain.entity.Post;
import com.minifacebook.module.post.infrastructure.persistence.document.PostDocument;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface PostMapper {
    Post toDomain(PostDocument document);
    PostDocument toDocument(Post domain);
}
