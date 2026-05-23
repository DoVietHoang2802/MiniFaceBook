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
    private int commentCount; // Mới thêm
    private java.util.Map<String, Integer> reactionsCount; // Mới thêm, dạng string để UI dễ parse
    private String myReactionType; // Thay thế isReactedByMe để chứa loại reaction (LIKE, LOVE) nếu có
    private Instant createdAt;
}
