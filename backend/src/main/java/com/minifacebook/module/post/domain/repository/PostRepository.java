package com.minifacebook.module.post.domain.repository;

import com.minifacebook.module.post.domain.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;

public interface PostRepository {
    Post save(Post post);
    Optional<Post> findById(String id);
    Page<Post> findAllOrderByCreatedAtDesc(Pageable pageable);
    void deleteById(String id);
}
