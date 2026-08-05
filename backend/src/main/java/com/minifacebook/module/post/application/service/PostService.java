package com.minifacebook.module.post.application.service;

import com.minifacebook.module.auth.domain.model.User;
import com.minifacebook.module.auth.domain.repository.UserRepository;
import com.minifacebook.shared.exception.AppException;
import com.minifacebook.shared.exception.ErrorCode;
import com.minifacebook.module.post.application.dto.CreatePostRequest;
import com.minifacebook.module.post.application.dto.PostResponse;
import com.minifacebook.module.post.application.dto.PostSuggestionResponse;
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
import java.text.Normalizer;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class PostService {

    private static final int MAX_POST_IMAGES = 10;
    private static final long MAX_POST_IMAGE_BYTES = 10L * 1024 * 1024;
    private static final long MAX_POST_IMAGES_TOTAL_BYTES = 30L * 1024 * 1024;

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final ReactionRepository reactionRepository;
    private final CommentRepository commentRepository;
    private final MediaService mediaService;

    public PostResponse createPost(String email, CreatePostRequest request) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        
        List<MultipartFile> images = request.getImages();
        validatePostImages(images);
        List<String> imageUrls = new ArrayList<>();
        if (images != null && !images.isEmpty()) {
            for (MultipartFile file : images) {
                String url = mediaService.uploadPostImage(file);
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
        User currentUser = userRepository.findByEmail(email)
            .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        Page<Post> posts = postRepository.findAllOrderByCreatedAtDesc(pageable);
        return posts.map(post -> mapToResponse(post, currentUser.getId()));
    }

    /** Returns one visible post for notification and shared-post deep links. */
    public PostResponse getPost(String email, String postId) {
        User currentUser = userRepository.findByEmail(email)
            .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        Post post = postRepository.findById(postId)
            .filter(candidate -> !candidate.isDeleted())
            .orElseThrow(() -> new AppException(ErrorCode.POST_NOT_FOUND));
        return mapToResponse(post, currentUser.getId());
    }

    /** Searches public, non-deleted post text through MongoDB's text index. */
    public Page<PostResponse> searchPosts(String email, String rawQuery, Pageable pageable) {
        User currentUser = userRepository.findByEmail(email)
            .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        String query = normalizeSearchQuery(rawQuery);
        return postRepository.searchByContent(query, pageable)
            .map(post -> mapToResponse(post, currentUser.getId()));
    }

    /** Returns a bounded public projection so shared suggestions contain no viewer-specific state. */
    public List<PostSuggestionResponse> getSearchSuggestions(String email, String rawQuery) {
        userRepository.findByEmail(email)
            .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        String query = normalizeSearchQuery(rawQuery);
        return postRepository.searchByContent(query, org.springframework.data.domain.PageRequest.of(0, 5))
            .stream()
            .map(this::mapToSuggestion)
            .toList();
    }

    public void deletePost(String email, String postId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        Post post = postRepository.findById(postId)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new AppException(ErrorCode.POST_NOT_FOUND));

        if (!post.getAuthorId().equals(user.getId())) {
            throw new AppException(ErrorCode.POST_UNAUTHORIZED);
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
                .authorName(author != null && author.getName() != null && !author.getName().isBlank()
                    ? author.getName() : "Người dùng")
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

    private PostSuggestionResponse mapToSuggestion(Post post) {
        User author = userRepository.findById(post.getAuthorId()).orElse(null);
        String content = post.getContent() == null ? "" : post.getContent().trim();
        String excerpt = content.length() <= 180 ? content : content.substring(0, 177) + "...";
        return PostSuggestionResponse.builder()
            .id(post.getId())
            .authorId(post.getAuthorId())
            .authorName(author != null && author.getName() != null && !author.getName().isBlank()
                ? author.getName() : "Người dùng")
            .authorAvatar(author != null ? author.getAvatar() : null)
            .excerpt(excerpt)
            .createdAt(post.getCreatedAt())
            .build();
    }

    private String normalizeSearchQuery(String rawQuery) {
        String normalized = rawQuery == null ? "" : Normalizer.normalize(rawQuery, Normalizer.Form.NFC)
            .trim()
            .replaceAll("\\p{Pd}", " ")
            .replaceAll("\\s+", " ");
        int length = normalized.codePointCount(0, normalized.length());
        if (length < 2 || length > 100) {
            throw new AppException(ErrorCode.INVALID_SEARCH_QUERY);
        }
        return normalized;
    }

    private void validatePostImages(List<MultipartFile> images) {
        if (images == null || images.isEmpty()) {
            return;
        }
        if (images.size() > MAX_POST_IMAGES) {
            throw new AppException(ErrorCode.MAX_POST_IMAGES_EXCEEDED);
        }

        long totalBytes = 0;
        for (MultipartFile image : images) {
            if (image == null || image.isEmpty()) {
                throw new AppException(ErrorCode.FILE_REQUIRED);
            }
            if (image.getSize() > MAX_POST_IMAGE_BYTES) {
                throw new AppException(ErrorCode.MAX_POST_IMAGE_SIZE_EXCEEDED);
            }
            totalBytes += image.getSize();
            if (totalBytes > MAX_POST_IMAGES_TOTAL_BYTES) {
                throw new AppException(ErrorCode.MAX_POST_IMAGES_TOTAL_SIZE_EXCEEDED);
            }
        }
    }
}
