package com.minifacebook.module.post.infrastructure.persistence.repository;

import com.minifacebook.module.post.infrastructure.persistence.document.PostDocument;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

public interface MongoPostRepository extends MongoRepository<PostDocument, String> {
    @Query(value = "{'deleted': { $ne: true }}", sort = "{'createdAt': -1}")
    Page<PostDocument> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
