package com.minifacebook.module.post.infrastructure.mapper;

import com.minifacebook.module.post.domain.entity.Post;
import com.minifacebook.module.post.domain.entity.ReactionType;
import com.minifacebook.module.post.infrastructure.persistence.document.PostDocument;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-05-22T17:29:03+0700",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 21.0.11 (Eclipse Adoptium)"
)
@Component
public class PostMapperImpl implements PostMapper {

    @Override
    public Post toDomain(PostDocument document) {
        if ( document == null ) {
            return null;
        }

        Post.PostBuilder post = Post.builder();

        post.id( document.getId() );
        post.authorId( document.getAuthorId() );
        post.content( document.getContent() );
        List<String> list = document.getImageUrls();
        if ( list != null ) {
            post.imageUrls( new ArrayList<String>( list ) );
        }
        Map<ReactionType, Integer> map = document.getReactionsCount();
        if ( map != null ) {
            post.reactionsCount( new LinkedHashMap<ReactionType, Integer>( map ) );
        }
        post.commentCount( document.getCommentCount() );
        post.createdAt( document.getCreatedAt() );
        post.updatedAt( document.getUpdatedAt() );

        return post.build();
    }

    @Override
    public PostDocument toDocument(Post domain) {
        if ( domain == null ) {
            return null;
        }

        PostDocument.PostDocumentBuilder postDocument = PostDocument.builder();

        postDocument.id( domain.getId() );
        postDocument.authorId( domain.getAuthorId() );
        postDocument.content( domain.getContent() );
        List<String> list = domain.getImageUrls();
        if ( list != null ) {
            postDocument.imageUrls( new ArrayList<String>( list ) );
        }
        Map<ReactionType, Integer> map = domain.getReactionsCount();
        if ( map != null ) {
            postDocument.reactionsCount( new LinkedHashMap<ReactionType, Integer>( map ) );
        }
        postDocument.commentCount( domain.getCommentCount() );
        postDocument.createdAt( domain.getCreatedAt() );
        postDocument.updatedAt( domain.getUpdatedAt() );

        return postDocument.build();
    }
}
