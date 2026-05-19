package com.minifacebook.module.post.application.dto;

import lombok.Builder;
import lombok.Data;
import java.time.Instant;
import java.util.List;

@Data
@Builder
public class PostResponse {
    private String id;
    private String authorId;
    private String authorName;
    private String authorAvatar;
    private String content;
    private List<String> imageUrls;
    private int reactCount;
    private boolean isReactedByMe;
    private Instant createdAt;
}
