package com.minifacebook.module.post.application.dto;

import lombok.Builder;
import lombok.Data;
import java.time.Instant;

@Data
@Builder
public class CommentResponse {
    private String id;
    private String postId;
    private String authorId;
    private String authorName;
    private String authorAvatar;
    private String content;
    private String imageUrl;
    private Instant createdAt;
}
