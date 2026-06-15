package com.minifacebook.module.post.infrastructure.persistence.repository;

import com.minifacebook.module.post.infrastructure.persistence.document.CommentReactionDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MongoCommentReactionRepository extends MongoRepository<CommentReactionDocument, String> {
    Optional<CommentReactionDocument> findByCommentIdAndUserId(String commentId, String userId);
    List<CommentReactionDocument> findByCommentIdIn(List<String> commentIds);
    List<CommentReactionDocument> findByCommentId(String commentId);
}
