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
    private List<String> reactIds = new ArrayList<>();
    
    private Instant createdAt;
    private Instant updatedAt;
}
