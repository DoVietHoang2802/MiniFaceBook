package com.minifacebook.module.post.infrastructure.persistence.repository;

import com.minifacebook.module.post.domain.entity.CommentReaction;
import com.minifacebook.module.post.domain.repository.CommentReactionRepository;
import com.minifacebook.module.post.infrastructure.mapper.CommentReactionMapper;
import com.minifacebook.module.post.infrastructure.persistence.document.CommentReactionDocument;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class CommentReactionRepositoryImpl implements CommentReactionRepository {

    private final MongoCommentReactionRepository mongoCommentReactionRepository;
    private final CommentReactionMapper commentReactionMapper;

    @Override
    public CommentReaction save(CommentReaction reaction) {
        CommentReactionDocument saved = mongoCommentReactionRepository.save(commentReactionMapper.toDocument(reaction));
        return commentReactionMapper.toDomain(saved);
    }

    @Override
    public Optional<CommentReaction> findByCommentIdAndUserId(String commentId, String userId) {
        return mongoCommentReactionRepository.findByCommentIdAndUserId(commentId, userId)
                .map(commentReactionMapper::toDomain);
    }

    @Override
    public List<CommentReaction> findByCommentIdIn(List<String> commentIds) {
        return mongoCommentReactionRepository.findByCommentIdIn(commentIds).stream()
                .map(commentReactionMapper::toDomain)
                .toList();
    }

    @Override
    public List<CommentReaction> findByCommentId(String commentId) {
        return mongoCommentReactionRepository.findByCommentId(commentId).stream()
                .map(commentReactionMapper::toDomain)
                .toList();
    }

    @Override
    public void delete(CommentReaction reaction) {
        if (reaction.getId() != null) {
            mongoCommentReactionRepository.deleteById(reaction.getId());
        }
    }
}
