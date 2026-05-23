package com.minifacebook.module.post.domain.repository;

import com.minifacebook.module.post.domain.entity.Reaction;
import java.util.Optional;

public interface ReactionRepository {
    Reaction save(Reaction reaction);
    Optional<Reaction> findByPostIdAndUserId(String postId, String userId);
    void delete(Reaction reaction);
}
