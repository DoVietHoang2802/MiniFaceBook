package com.minifacebook.module.post.infrastructure.persistence.repository;

import com.minifacebook.module.post.domain.entity.Comment;
import com.minifacebook.module.post.domain.repository.CommentRepository;
import com.minifacebook.module.post.infrastructure.mapper.CommentMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
public class CommentRepositoryImpl implements CommentRepository {

    private final MongoCommentRepository mongoCommentRepository;
    private final CommentMapper commentMapper;

    @Override
    public Comment save(Comment comment) {
        return commentMapper.toDomain(mongoCommentRepository.save(commentMapper.toDocument(comment)));
    }

    @Override
    public Page<Comment> findByPostIdOrderByCreatedAtDesc(String postId, Pageable pageable) {
        return mongoCommentRepository.findByPostIdOrderByCreatedAtDesc(postId, pageable)
                .map(commentMapper::toDomain);
    }

    @Override
    public Optional<Comment> findById(String commentId) {
        return mongoCommentRepository.findById(commentId).map(commentMapper::toDomain);
    }
}
