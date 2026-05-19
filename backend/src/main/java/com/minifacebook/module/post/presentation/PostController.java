package com.minifacebook.module.post.presentation;

import com.minifacebook.module.post.application.dto.CreatePostRequest;
import com.minifacebook.module.post.application.dto.PostResponse;
import com.minifacebook.module.post.application.service.PostService;
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
@Tag(name = "Post", description = "Endpoints for managing posts and newsfeed")
public class PostController {

    private final PostService postService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Create a new post", description = "Upload images and create a text post")
    public ApiResponse<PostResponse> createPost(
            @AuthenticationPrincipal Jwt jwt,
            @ModelAttribute @Valid CreatePostRequest request) {
        String email = jwt.getSubject();
        PostResponse response = postService.createPost(email, request);
        return ApiResponse.success("Post created successfully", response);
    }

    @GetMapping("/newsfeed")
    @Operation(summary = "Get news feed", description = "Get paginated posts ordered by creation time")
    public ApiResponse<Page<PostResponse>> getNewsFeed(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        String email = jwt.getSubject();
        Pageable pageable = PageRequest.of(page, size);
        Page<PostResponse> response = postService.getNewsFeed(email, pageable);
        return ApiResponse.success("News feed fetched successfully", response);
    }
}
