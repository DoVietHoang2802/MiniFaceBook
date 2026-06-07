package com.minifacebook.module.post.application.service;

import com.minifacebook.module.auth.domain.model.User;
import com.minifacebook.module.auth.domain.repository.UserRepository;
import com.minifacebook.module.post.application.dto.CommentRequest;
import com.minifacebook.module.post.application.dto.CommentResponse;
import com.minifacebook.module.post.domain.entity.Comment;
import com.minifacebook.module.post.domain.entity.Post;
import com.minifacebook.module.post.domain.repository.CommentRepository;
import com.minifacebook.module.post.domain.repository.PostRepository;
import com.minifacebook.shared.domain.service.MediaService;
import com.minifacebook.shared.event.NotificationEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final MediaService mediaService;
    private final ApplicationEventPublisher eventPublisher;

    public CommentResponse addComment(String email, String postId, CommentRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        String imageUrl = null;
        if (request.getImage() != null && !request.getImage().isEmpty()) {
            imageUrl = mediaService.uploadAvatar(request.getImage()); // TODO: Đổi tên method uploadMedia
        }

        Comment comment = Comment.builder()
                .postId(postId)
                .authorId(user.getId())
                .content(request.getContent())
                .imageUrl(imageUrl)
                .build();

        Comment savedComment = commentRepository.save(comment);

        // Tăng biến đếm comment của Post
        post.setCommentCount(post.getCommentCount() + 1);
        postRepository.save(post);

        // Thông báo cho chủ bài viết (self-guard tự bỏ qua nếu tự bình luận bài mình).
        eventPublisher.publishEvent(
                NotificationEvent.builder()
                        .recipientId(post.getAuthorId())
                        .actorId(user.getId())
                        .type("COMMENT")
                        .entityId(postId)
                        .content("đã bình luận về bài viết của bạn")
                        .build());

        return mapToResponse(savedComment, user);
    }

    public Page<CommentResponse> getCommentsByPost(String postId, Pageable pageable) {
        // Không cần kiểm tra user, public newsfeed
        Page<Comment> comments = commentRepository.findByPostIdOrderByCreatedAtDesc(postId, pageable);
        return comments.map(comment -> {
            User author = userRepository.findById(comment.getAuthorId()).orElse(null);
            return mapToResponse(comment, author);
        });
    }

    private CommentResponse mapToResponse(Comment comment, User author) {
        return CommentResponse.builder()
                .id(comment.getId())
                .postId(comment.getPostId())
                .authorId(comment.getAuthorId())
                .authorName(author != null ? author.getEmail() : "Unknown User")
                .authorAvatar(author != null ? author.getAvatar() : null)
                .content(comment.getContent())
                .imageUrl(comment.getImageUrl())
                .createdAt(comment.getCreatedAt())
                .build();
    }
}
