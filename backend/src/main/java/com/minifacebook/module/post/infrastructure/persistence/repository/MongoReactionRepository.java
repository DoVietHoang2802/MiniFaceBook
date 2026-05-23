package com.minifacebook.module.post.infrastructure.persistence.repository;

import com.minifacebook.module.post.infrastructure.persistence.document.ReactionDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MongoReactionRepository extends MongoRepository<ReactionDocument, String> {
    Optional<ReactionDocument> findByPostIdAndUserId(String postId, String userId);
}
