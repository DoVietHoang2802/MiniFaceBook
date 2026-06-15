package com.minifacebook.module.post.domain.repository;

import com.minifacebook.module.post.domain.entity.CommentReaction;

import java.util.List;
import java.util.Optional;

public interface CommentReactionRepository {
    CommentReaction save(CommentReaction reaction);
    Optional<CommentReaction> findByCommentIdAndUserId(String commentId, String userId);
    List<CommentReaction> findByCommentIdIn(List<String> commentIds);
    List<CommentReaction> findByCommentId(String commentId);
    void delete(CommentReaction reaction);
}
