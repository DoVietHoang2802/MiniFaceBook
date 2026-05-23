package com.minifacebook.module.post.infrastructure.mapper;

import com.minifacebook.module.post.domain.entity.Reaction;
import com.minifacebook.module.post.infrastructure.persistence.document.ReactionDocument;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-05-22T17:29:03+0700",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 21.0.11 (Eclipse Adoptium)"
)
@Component
public class ReactionMapperImpl implements ReactionMapper {

    @Override
    public Reaction toDomain(ReactionDocument document) {
        if ( document == null ) {
            return null;
        }

        Reaction.ReactionBuilder reaction = Reaction.builder();

        reaction.id( document.getId() );
        reaction.postId( document.getPostId() );
        reaction.userId( document.getUserId() );
        reaction.type( document.getType() );
        reaction.createdAt( document.getCreatedAt() );

        return reaction.build();
    }

    @Override
    public ReactionDocument toDocument(Reaction domain) {
        if ( domain == null ) {
            return null;
        }

        ReactionDocument.ReactionDocumentBuilder reactionDocument = ReactionDocument.builder();

        reactionDocument.id( domain.getId() );
        reactionDocument.postId( domain.getPostId() );
        reactionDocument.userId( domain.getUserId() );
        reactionDocument.type( domain.getType() );
        reactionDocument.createdAt( domain.getCreatedAt() );

        return reactionDocument.build();
    }
}
