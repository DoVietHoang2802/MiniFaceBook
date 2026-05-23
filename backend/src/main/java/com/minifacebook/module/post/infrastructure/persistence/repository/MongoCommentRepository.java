package com.minifacebook.module.post.infrastructure.persistence.repository;

import com.minifacebook.module.post.infrastructure.persistence.document.CommentDocument;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MongoCommentRepository extends MongoRepository<CommentDocument, String> {
    Page<CommentDocument> findByPostIdOrderByCreatedAtDesc(String postId, Pageable pageable);
}
