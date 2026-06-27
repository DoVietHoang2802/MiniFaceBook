package com.minifacebook.module.post.application.service;

import com.minifacebook.module.auth.domain.model.User;
import com.minifacebook.module.auth.domain.repository.UserRepository;
import com.minifacebook.module.post.application.dto.CommentRequest;
import com.minifacebook.module.post.application.dto.CommentResponse;
import com.minifacebook.module.post.application.dto.ReactionRequest;
import com.minifacebook.module.post.application.dto.ReactionUserResponse;
import com.minifacebook.module.post.domain.entity.Comment;
import com.minifacebook.module.post.domain.entity.CommentReaction;
import com.minifacebook.module.post.domain.entity.Post;
import com.minifacebook.module.post.domain.repository.CommentReactionRepository;
import com.minifacebook.module.post.domain.repository.CommentRepository;
import com.minifacebook.module.post.domain.repository.PostRepository;
import com.minifacebook.shared.domain.service.MediaService;
import com.minifacebook.shared.event.NotificationEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class CommentService {

    private final CommentRepository commentRepository;
    private final CommentReactionRepository commentReactionRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final MediaService mediaService;
    private final ApplicationEventPublisher eventPublisher;
    private final PostRealtimeBroadcaster postRealtimeBroadcaster;
    private final CommentRealtimeBroadcaster commentRealtimeBroadcaster;
    private final CommentEventBroadcaster commentEventBroadcaster;

    public CommentResponse addComment(String email, String postId, CommentRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Post post = postRepository.findById(postId)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new RuntimeException("Post not found"));

        String imageUrl = null;
        if (request.getImage() != null && !request.getImage().isEmpty()) {
            imageUrl = mediaService.uploadAvatar(request.getImage());
        }

        Comment comment = Comment.builder()
                .postId(postId)
                .authorId(user.getId())
                .content(request.getContent())
                .imageUrl(imageUrl)
                .build();

        Comment savedComment = commentRepository.save(comment);

        post.setCommentCount(post.getCommentCount() + 1);
        postRepository.save(post);
        postRealtimeBroadcaster.broadcastCounts(post);

        eventPublisher.publishEvent(
                NotificationEvent.builder()
                        .recipientId(post.getAuthorId())
                        .actorId(user.getId())
                        .type("COMMENT")
                        .entityId(postId)
                        .content("đã bình luận về bài viết của bạn")
                        .build());

        // Build response và broadcast comment event qua SSE
        CommentResponse response = mapToResponse(savedComment, user, Map.of(), null);
        commentEventBroadcaster.broadcast(response);

        return response;
    }

    public void reactToComment(String email, String commentId, ReactionRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        Optional<CommentReaction> existingReactionOpt = commentReactionRepository.findByCommentIdAndUserId(commentId, user.getId());

        String userReactionAfterToggle = null;

        if (existingReactionOpt.isPresent()) {
            CommentReaction existingReaction = existingReactionOpt.get();
            if (existingReaction.getType() == request.getType()) {
                // Toggle off - xóa reaction
                commentReactionRepository.delete(existingReaction);
                userReactionAfterToggle = null;
            } else {
                // Change to different reaction type
                existingReaction.setType(request.getType());
                commentReactionRepository.save(existingReaction);
                userReactionAfterToggle = request.getType().name();
            }
        } else {
            // New reaction
            commentReactionRepository.save(CommentReaction.builder()
                    .commentId(commentId)
                    .userId(user.getId())
                    .type(request.getType())
                    .build());
            userReactionAfterToggle = request.getType().name();
        }

        // Tính toán reaction counts mới từ database
        List<CommentReaction> reactions = commentReactionRepository.findByCommentId(commentId);
        Map<String, Integer> counts = reactions.stream()
                .collect(Collectors.groupingBy(
                        r -> r.getType().name(),
                        Collectors.summingInt(r -> 1)
                ));

        // Broadcast realtime update tới tất cả clients đang xem comment này
        commentRealtimeBroadcaster.broadcastReactionUpdate(commentId, counts, userReactionAfterToggle);

        // Gửi notification chỉ khi là reaction mới (không phải toggle off hay change)
        // (Giữ logic cũ: chỉ notify khi add reaction lần đầu)
        if (userReactionAfterToggle != null && existingReactionOpt.isEmpty()) {
            eventPublisher.publishEvent(
                    NotificationEvent.builder()
                            .recipientId(comment.getAuthorId())
                            .actorId(user.getId())
                            .type("COMMENT_REACTION")
                            .entityId(commentId)
                            .content("đã bày tỏ cảm xúc về bình luận của bạn")
                            .build());
        }
    }

    public List<ReactionUserResponse> getCommentReactions(String commentId) {
        List<CommentReaction> reactions = commentReactionRepository.findByCommentId(commentId);
        if (reactions.isEmpty()) {
            return List.of();
        }

        List<String> userIds = reactions.stream().map(CommentReaction::getUserId).distinct().toList();
        Map<String, User> userMap = userRepository.findAllByIds(userIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        return reactions.stream()
                .map(reaction -> {
                    User user = userMap.get(reaction.getUserId());
                    if (user == null) {
                        return null;
                    }
                    return ReactionUserResponse.builder()
                            .userId(user.getId())
                            .name(user.getName())
                            .avatar(user.getAvatar())
                            .type(reaction.getType().name())
                            .build();
                })
                .filter(Objects::nonNull)
                .toList();
    }

    public Page<CommentResponse> getCommentsByPost(String postId, Pageable pageable) {
        return getCommentsByPostInternal(null, postId, pageable);
    }

    public Page<CommentResponse> getCommentsByPost(String email, String postId, Pageable pageable) {
        return getCommentsByPostInternal(email, postId, pageable);
    }

    private Page<CommentResponse> getCommentsByPostInternal(String email, String postId, Pageable pageable) {
        User currentUser = null;
        if (email != null && !email.isBlank()) {
            currentUser = userRepository.findByEmail(email).orElse(null);
        }

        Page<Comment> comments = commentRepository.findByPostIdOrderByCreatedAtDesc(postId, pageable);
        List<Comment> commentList = comments.getContent();
        List<String> commentIds = commentList.stream().map(Comment::getId).toList();
        List<CommentReaction> reactions = commentIds.isEmpty()
                ? List.of()
                : commentReactionRepository.findByCommentIdIn(commentIds);

        Map<String, Map<String, Integer>> reactionCountsByCommentId = reactions.stream()
                .collect(Collectors.groupingBy(
                        CommentReaction::getCommentId,
                        Collectors.collectingAndThen(Collectors.toList(), this::toReactionCounts)
                ));

        String currentUserId = currentUser != null ? currentUser.getId() : null;
        Map<String, String> myReactionByCommentId = currentUserId == null
                ? Map.of()
                : reactions.stream()
                .filter(reaction -> currentUserId.equals(reaction.getUserId()))
                .collect(Collectors.toMap(CommentReaction::getCommentId, reaction -> reaction.getType().name(), (left, right) -> right));

        List<String> authorIds = commentList.stream().map(Comment::getAuthorId).distinct().toList();
        Map<String, User> authorMap = userRepository.findAllByIds(authorIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        return comments.map(comment -> mapToResponse(
                comment,
                authorMap.get(comment.getAuthorId()),
                reactionCountsByCommentId.getOrDefault(comment.getId(), Map.of()),
                myReactionByCommentId.get(comment.getId())
        ));
    }

    private Map<String, Integer> toReactionCounts(List<CommentReaction> reactions) {
        return reactions.stream()
                .collect(Collectors.groupingBy(reaction -> reaction.getType().name(), Collectors.summingInt(reaction -> 1)));
    }

    public void deleteComment(String email, String commentId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Comment comment = commentRepository.findById(commentId)
                .filter(c -> !c.isDeleted())
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        Post post = postRepository.findById(comment.getPostId())
                .orElseThrow(() -> new RuntimeException("Post not found"));

        boolean isCommentOwner = Objects.equals(comment.getAuthorId(), user.getId());
        boolean isPostOwner = Objects.equals(post.getAuthorId(), user.getId());

        if (!isCommentOwner && !isPostOwner) {
            throw new RuntimeException("You do not have permission to delete this comment");
        }

        comment.setDeleted(true);
        comment.setDeletedAt(java.time.Instant.now());
        commentRepository.save(comment);

        if (!post.isDeleted()) {
            post.setCommentCount(Math.max(0, post.getCommentCount() - 1));
            postRepository.save(post);
            postRealtimeBroadcaster.broadcastCounts(post);
        }

        // Broadcast comment deletion event via SSE
        CommentResponse deletionEvent = CommentResponse.builder()
                .id(comment.getId())
                .postId(comment.getPostId())
                .deleted(true)
                .build();
        commentEventBroadcaster.broadcast(deletionEvent);
    }

    private CommentResponse mapToResponse(Comment comment, User author, Map<String, Integer> reactionCounts, String myReaction) {
        return CommentResponse.builder()
                .id(comment.getId())
                .postId(comment.getPostId())
                .authorId(comment.getAuthorId())
                .authorName(author != null ? author.getEmail() : "Unknown User")
                .authorAvatar(author != null ? author.getAvatar() : null)
                .content(comment.getContent())
                .imageUrl(comment.getImageUrl())
                .createdAt(comment.getCreatedAt())
                .reactionCounts(reactionCounts)
                .myReaction(myReaction)
                .deleted(comment.isDeleted())
                .build();
    }
}
