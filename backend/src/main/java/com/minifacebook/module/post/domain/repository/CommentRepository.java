package com.minifacebook.module.post.domain.repository;

import com.minifacebook.module.post.domain.entity.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface CommentRepository {
    Comment save(Comment comment);
    Page<Comment> findByPostIdOrderByCreatedAtDesc(String postId, Pageable pageable);
    void delete(Comment comment);
}
