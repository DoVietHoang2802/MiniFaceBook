package com.minifacebook.module.post.application.service;

import com.minifacebook.module.auth.domain.model.User;
import com.minifacebook.module.auth.domain.repository.UserRepository;
import com.minifacebook.module.post.application.dto.ReactionRequest;
import com.minifacebook.module.post.application.dto.ReactionUserResponse;
import com.minifacebook.module.post.domain.entity.Post;
import com.minifacebook.module.post.domain.entity.Reaction;
import com.minifacebook.module.post.domain.entity.ReactionType;
import com.minifacebook.module.post.domain.repository.PostRepository;
import com.minifacebook.module.post.domain.repository.ReactionRepository;
import com.minifacebook.shared.event.NotificationEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class ReactionService {

    private final ReactionRepository reactionRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final PostRealtimeBroadcaster postRealtimeBroadcaster;

    public void reactToPost(String email, String postId, ReactionRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Post post = postRepository.findById(postId)
                .filter(p -> !p.isDeleted())
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

            // Thông báo cho chủ bài viết (self-guard tự bỏ qua nếu tự thả cảm xúc bài mình).
            eventPublisher.publishEvent(
                    NotificationEvent.builder()
                            .recipientId(post.getAuthorId())
                            .actorId(user.getId())
                            .type("LIKE")
                            .entityId(postId)
                            .content("đã bày tỏ cảm xúc về bài viết của bạn")
                            .build());
        }
        
        // Lưu lại bộ đếm mới vào Post
        postRepository.save(post);

        // Broadcast số đếm mới realtime tới mọi người đang xem bài (mọi thay đổi: thêm/gỡ/đổi).
        postRealtimeBroadcaster.broadcastCounts(post);
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

    /**
     * Lấy danh sách những người đã thả cảm xúc vào bài viết (kèm loại cảm xúc và thông tin user).
     * Batch-load user info trong 1 truy vấn để tránh N+1 query.
     */
    public List<ReactionUserResponse> getPostReactions(String postId) {
        List<Reaction> reactions = reactionRepository.findByPostId(postId);
        if (reactions.isEmpty()) {
            return List.of();
        }

        List<String> userIds = reactions.stream().map(Reaction::getUserId).distinct().toList();
        Map<String, User> userMap =
                userRepository.findAllByIds(userIds).stream()
                        .collect(Collectors.toMap(User::getId, Function.identity()));

        return reactions.stream()
                .map(r -> {
                    User u = userMap.get(r.getUserId());
                    if (u == null) {
                        return null; // user đã bị xóa
                    }
                    return ReactionUserResponse.builder()
                            .userId(u.getId())
                            .name(u.getName())
                            .avatar(u.getAvatar())
                            .type(r.getType().name())
                            .build();
                })
                .filter(java.util.Objects::nonNull)
                .toList();
    }
}
