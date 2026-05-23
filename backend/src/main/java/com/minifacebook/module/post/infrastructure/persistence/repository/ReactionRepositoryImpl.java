package com.minifacebook.module.post.infrastructure.persistence.repository;

import com.minifacebook.module.post.domain.entity.Reaction;
import com.minifacebook.module.post.domain.repository.ReactionRepository;
import com.minifacebook.module.post.infrastructure.mapper.ReactionMapper;
import com.minifacebook.module.post.infrastructure.persistence.document.ReactionDocument;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
public class ReactionRepositoryImpl implements ReactionRepository {

    private final MongoReactionRepository mongoReactionRepository;
    private final ReactionMapper reactionMapper;

    @Override
    public Reaction save(Reaction reaction) {
        ReactionDocument doc = reactionMapper.toDocument(reaction);
        ReactionDocument saved = mongoReactionRepository.save(doc);
        return reactionMapper.toDomain(saved);
    }

    @Override
    public Optional<Reaction> findByPostIdAndUserId(String postId, String userId) {
        return mongoReactionRepository.findByPostIdAndUserId(postId, userId)
                .map(reactionMapper::toDomain);
    }

    @Override
    public void delete(Reaction reaction) {
        if (reaction.getId() != null) {
            mongoReactionRepository.deleteById(reaction.getId());
        }
    }
}
