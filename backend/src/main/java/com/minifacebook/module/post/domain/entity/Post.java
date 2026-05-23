package com.minifacebook.module.post.domain.entity;

import lombok.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Post {
    private String id;
    private String authorId;
    private String content;
    
    @Builder.Default
    private List<String> imageUrls = new ArrayList<>();
    
    @Builder.Default
    private java.util.Map<ReactionType, Integer> reactionsCount = new java.util.HashMap<>();
    
    private int commentCount;
    
    private Instant createdAt;
    private Instant updatedAt;
}
