package com.minifacebook.module.post.infrastructure.persistence.repository;

import com.minifacebook.module.post.domain.entity.Comment;
import com.minifacebook.module.post.domain.repository.CommentRepository;
import com.minifacebook.module.post.infrastructure.mapper.CommentMapper;
import com.minifacebook.module.post.infrastructure.persistence.document.CommentDocument;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CommentRepositoryImpl implements CommentRepository {

    private final MongoCommentRepository mongoCommentRepository;
    private final CommentMapper commentMapper;

    @Override
    public Comment save(Comment comment) {
        CommentDocument doc = commentMapper.toDocument(comment);
        CommentDocument saved = mongoCommentRepository.save(doc);
        return commentMapper.toDomain(saved);
    }

    @Override
    public Page<Comment> findByPostIdOrderByCreatedAtDesc(String postId, Pageable pageable) {
        return mongoCommentRepository.findByPostIdOrderByCreatedAtDesc(postId, pageable)
                .map(commentMapper::toDomain);
    }

    @Override
    public void delete(Comment comment) {
        if (comment.getId() != null) {
            mongoCommentRepository.deleteById(comment.getId());
        }
    }
}
