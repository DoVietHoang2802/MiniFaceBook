package com.minifacebook.module.post.application.service;

import com.minifacebook.module.auth.domain.model.User;
import com.minifacebook.module.auth.domain.repository.UserRepository;
import com.minifacebook.module.post.application.dto.CreatePostRequest;
import com.minifacebook.module.post.application.dto.PostResponse;
import com.minifacebook.module.post.domain.entity.Post;
import com.minifacebook.module.post.domain.entity.Reaction;
import com.minifacebook.module.post.domain.repository.PostRepository;
import com.minifacebook.module.post.domain.repository.ReactionRepository;
import com.minifacebook.module.post.domain.repository.CommentRepository;
import com.minifacebook.shared.domain.service.MediaService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final ReactionRepository reactionRepository;
    private final CommentRepository commentRepository;
    private final MediaService mediaService;

    public PostResponse createPost(String email, CreatePostRequest request) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<String> imageUrls = new ArrayList<>();
        if (request.getImages() != null && !request.getImages().isEmpty()) {
            for (MultipartFile file : request.getImages()) {
                String url = mediaService.uploadAvatar(file);
                imageUrls.add(url);
            }
        }
        
        Post post = Post.builder()
                .authorId(user.getId())
                .content(request.getContent())
                .imageUrls(imageUrls)
                .build();
        
        Post savedPost = postRepository.save(post);
        return mapToResponse(savedPost, user.getId());
    }

    public Page<PostResponse> getNewsFeed(String email, Pageable pageable) {
        User currentUser = userRepository.findByEmail(email).orElseThrow();
        Page<Post> posts = postRepository.findAllOrderByCreatedAtDesc(pageable);
        return posts.map(post -> mapToResponse(post, currentUser.getId()));
    }

    public void deletePost(String email, String postId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Post post = postRepository.findById(postId)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new RuntimeException("Post not found"));

        if (!post.getAuthorId().equals(user.getId())) {
            throw new RuntimeException("You do not have permission to delete this post");
        }

        // Soft delete post
        post.setDeleted(true);
        post.setDeletedAt(java.time.Instant.now());
        postRepository.save(post);

        // Cascade soft delete all comments
        List<com.minifacebook.module.post.domain.entity.Comment> comments = commentRepository.findByPostId(postId);
        if (comments != null && !comments.isEmpty()) {
            java.time.Instant now = java.time.Instant.now();
            comments.forEach(comment -> {
                comment.setDeleted(true);
                comment.setDeletedAt(now);
            });
            commentRepository.saveAll(comments);
        }
    }

    private PostResponse mapToResponse(Post post, String currentUserId) {
        User author = userRepository.findById(post.getAuthorId()).orElse(null);
        
        int totalReacts = post.getReactionsCount().values().stream().mapToInt(Integer::intValue).sum();
        java.util.Map<String, Integer> stringReactionMap = new java.util.HashMap<>();
        post.getReactionsCount().forEach((k, v) -> stringReactionMap.put(k.name(), v));
        
        String myReactionType = null;
        if (currentUserId != null) {
            java.util.Optional<Reaction> myReaction = reactionRepository.findByPostIdAndUserId(post.getId(), currentUserId);
            if (myReaction.isPresent()) {
                myReactionType = myReaction.get().getType().name();
            }
        }
        
        return PostResponse.builder()
                .id(post.getId())
                .authorId(post.getAuthorId())
                .authorName(author != null ? author.getEmail() : "Unknown User")
                .authorAvatar(author != null ? author.getAvatar() : null)
                .content(post.getContent())
                .imageUrls(post.getImageUrls())
                .reactCount(totalReacts)
                .commentCount(post.getCommentCount())
                .reactionsCount(stringReactionMap)
                .myReactionType(myReactionType)
                .createdAt(post.getCreatedAt())
                .build();
    }
}
