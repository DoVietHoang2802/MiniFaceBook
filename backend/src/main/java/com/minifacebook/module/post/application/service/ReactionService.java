package com.minifacebook.module.post.application.service;

import com.minifacebook.module.auth.domain.model.User;
import com.minifacebook.module.auth.domain.repository.UserRepository;
import com.minifacebook.module.post.application.dto.ReactionRequest;
import com.minifacebook.module.post.domain.entity.Post;
import com.minifacebook.module.post.domain.entity.Reaction;
import com.minifacebook.module.post.domain.entity.ReactionType;
import com.minifacebook.module.post.domain.repository.PostRepository;
import com.minifacebook.module.post.domain.repository.ReactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ReactionService {

    private final ReactionRepository reactionRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    public void reactToPost(String email, String postId, ReactionRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
                
        Optional<Reaction> existingReactionOpt = reactionRepository.findByPostIdAndUserId(postId, user.getId());
        
        Map<ReactionType, Integer> reactionsCount = post.getReactionsCount();
        
        if (existingReactionOpt.isPresent()) {
            Reaction existingReaction = existingReactionOpt.get();
            
            // Nếu người dùng click vào nút thả cảm xúc đang có -> Hủy thả cảm xúc (Toggle off)
            if (existingReaction.getType() == request.getType()) {
                reactionRepository.delete(existingReaction);
                decrementReactionCount(reactionsCount, existingReaction.getType());
            } else {
                // Nếu người dùng đổi sang loại cảm xúc khác (ví dụ từ LIKE sang LOVE)
                decrementReactionCount(reactionsCount, existingReaction.getType());
                existingReaction.setType(request.getType());
                reactionRepository.save(existingReaction);
                incrementReactionCount(reactionsCount, request.getType());
            }
        } else {
            // Thả cảm xúc mới
            Reaction newReaction = Reaction.builder()
                    .postId(postId)
                    .userId(user.getId())
                    .type(request.getType())
                    .build();
            reactionRepository.save(newReaction);
            incrementReactionCount(reactionsCount, request.getType());
        }
        
        // Lưu lại bộ đếm mới vào Post
        postRepository.save(post);
    }
    
    private void incrementReactionCount(Map<ReactionType, Integer> map, ReactionType type) {
        map.put(type, map.getOrDefault(type, 0) + 1);
    }
    
    private void decrementReactionCount(Map<ReactionType, Integer> map, ReactionType type) {
        int count = map.getOrDefault(type, 0);
        if (count > 1) {
            map.put(type, count - 1);
        } else {
            map.remove(type);
        }
    }
}
