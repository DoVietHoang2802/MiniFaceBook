package com.minifacebook.module.post.infrastructure.persistence.repository;

import com.minifacebook.module.post.infrastructure.persistence.document.CommentDocument;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface MongoCommentRepository extends MongoRepository<CommentDocument, String> {
    @Query(value = "{'postId': ?0, 'deleted': { $ne: true }}", sort = "{'createdAt': -1}")
    Page<CommentDocument> findByPostIdOrderByCreatedAtDesc(String postId, Pageable pageable);
    
    java.util.List<CommentDocument> findByPostId(String postId);
}
