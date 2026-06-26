package com.minifacebook.module.post.domain.repository;

import com.minifacebook.module.post.domain.entity.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;

public interface CommentRepository {
    Comment save(Comment comment);
    Page<Comment> findByPostIdOrderByCreatedAtDesc(String postId, Pageable pageable);
    Optional<Comment> findById(String commentId);
    java.util.List<Comment> findByPostId(String postId);
    void saveAll(java.util.List<Comment> comments);
}
