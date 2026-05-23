package com.minifacebook.module.post.infrastructure.mapper;

import com.minifacebook.module.post.domain.entity.Comment;
import com.minifacebook.module.post.infrastructure.persistence.document.CommentDocument;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-05-22T17:29:02+0700",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 21.0.11 (Eclipse Adoptium)"
)
@Component
public class CommentMapperImpl implements CommentMapper {

    @Override
    public Comment toDomain(CommentDocument document) {
        if ( document == null ) {
            return null;
        }

        Comment.CommentBuilder comment = Comment.builder();

        comment.id( document.getId() );
        comment.postId( document.getPostId() );
        comment.authorId( document.getAuthorId() );
        comment.content( document.getContent() );
        comment.imageUrl( document.getImageUrl() );
        comment.createdAt( document.getCreatedAt() );
        comment.updatedAt( document.getUpdatedAt() );

        return comment.build();
    }

    @Override
    public CommentDocument toDocument(Comment domain) {
        if ( domain == null ) {
            return null;
        }

        CommentDocument.CommentDocumentBuilder commentDocument = CommentDocument.builder();

        commentDocument.id( domain.getId() );
        commentDocument.postId( domain.getPostId() );
        commentDocument.authorId( domain.getAuthorId() );
        commentDocument.content( domain.getContent() );
        commentDocument.imageUrl( domain.getImageUrl() );
        commentDocument.createdAt( domain.getCreatedAt() );
        commentDocument.updatedAt( domain.getUpdatedAt() );

        return commentDocument.build();
    }
}
