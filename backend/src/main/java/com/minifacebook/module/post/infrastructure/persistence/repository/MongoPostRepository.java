package com.minifacebook.module.post.infrastructure.persistence.repository;

import com.minifacebook.module.post.infrastructure.persistence.document.PostDocument;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface MongoPostRepository extends MongoRepository<PostDocument, String> {
    Page<PostDocument> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
