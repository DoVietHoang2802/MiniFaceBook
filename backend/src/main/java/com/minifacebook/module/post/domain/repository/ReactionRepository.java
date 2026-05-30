package com.minifacebook.module.post.domain.repository;

import com.minifacebook.module.post.domain.entity.Reaction;
import java.util.List;
import java.util.Optional;

public interface ReactionRepository {
    Reaction save(Reaction reaction);
    Optional<Reaction> findByPostIdAndUserId(String postId, String userId);
    /** Lấy tất cả reaction của một bài viết (phục vụ hiển thị "ai đã thả cảm xúc"). */
    List<Reaction> findByPostId(String postId);
    void delete(Reaction reaction);
}
