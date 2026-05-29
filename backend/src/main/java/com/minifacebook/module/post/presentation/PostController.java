package com.minifacebook.module.post.presentation;

import com.minifacebook.module.post.application.dto.CreatePostRequest;
import com.minifacebook.module.post.application.dto.PostResponse;
import com.minifacebook.module.post.application.dto.ReactionRequest;
import com.minifacebook.module.post.application.dto.CommentRequest;
import com.minifacebook.module.post.application.dto.CommentResponse;
import com.minifacebook.module.post.application.service.PostService;
import com.minifacebook.module.post.application.service.ReactionService;
import com.minifacebook.module.post.application.service.CommentService;
import com.minifacebook.shared.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/posts")
@RequiredArgsConstructor
@Tag(name = "Bài viết", description = "Các API quản lý bài viết và bảng tin")
public class PostController {

    private final PostService postService;
    private final ReactionService reactionService;
    private final CommentService commentService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Đăng bài viết mới", description = "Tải ảnh lên và tạo một bài viết dạng văn bản")
    public ApiResponse<PostResponse> createPost(
            @AuthenticationPrincipal Jwt jwt,
            @ModelAttribute @Valid CreatePostRequest request) {
        String email = jwt.getSubject();
        PostResponse response = postService.createPost(email, request);
        return ApiResponse.success("Post created successfully", response);
    }

    @GetMapping("/newsfeed")
    @Operation(summary = "Lấy bảng tin", description = "Lấy danh sách bài viết phân trang, sắp xếp theo thời gian đăng")
    public ApiResponse<Page<PostResponse>> getNewsFeed(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        String email = jwt.getSubject();
        Pageable pageable = PageRequest.of(page, size);
        Page<PostResponse> response = postService.getNewsFeed(email, pageable);
        return ApiResponse.success("News feed fetched successfully", response);
    }

    @PostMapping("/{postId}/react")
    @Operation(summary = "Bày tỏ cảm xúc với bài viết", description = "Bật/tắt cảm xúc trên bài viết. Gửi lại cùng loại cảm xúc sẽ gỡ bỏ cảm xúc đó.")
    public ApiResponse<Void> reactToPost(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String postId,
            @RequestBody @Valid ReactionRequest request) {
        String email = jwt.getSubject();
        reactionService.reactToPost(email, postId, request);
        return ApiResponse.success("Reaction updated successfully", null);
    }

    @PostMapping(value = "/{postId}/comments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Thêm bình luận", description = "Thêm một bình luận dạng văn bản/hình ảnh vào bài viết")
    public ApiResponse<CommentResponse> addComment(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String postId,
            @ModelAttribute @Valid CommentRequest request) {
        String email = jwt.getSubject();
        CommentResponse response = commentService.addComment(email, postId, request);
        return ApiResponse.success("Comment added successfully", response);
    }

    @GetMapping("/{postId}/comments")
    @Operation(summary = "Lấy danh sách bình luận", description = "Lấy danh sách bình luận phân trang của một bài viết")
    public ApiResponse<Page<CommentResponse>> getComments(
            @PathVariable String postId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<CommentResponse> response = commentService.getCommentsByPost(postId, pageable);
        return ApiResponse.success("Comments fetched successfully", response);
    }
}
