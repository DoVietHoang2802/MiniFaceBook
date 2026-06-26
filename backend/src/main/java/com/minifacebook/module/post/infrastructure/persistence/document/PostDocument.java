package com.minifacebook.module.post.infrastructure.persistence.document;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "posts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostDocument {
    @Id
    private String id;
    
    private String authorId;
    private String content;
    
    @Builder.Default
    private List<String> imageUrls = new ArrayList<>();
    
    @Builder.Default
    private java.util.Map<com.minifacebook.module.post.domain.entity.ReactionType, Integer> reactionsCount = new java.util.HashMap<>();
    
    private int commentCount;
    
    private boolean deleted;
    private Instant deletedAt;
    
    @CreatedDate
    private Instant createdAt;
    
    @LastModifiedDate
    private Instant updatedAt;
}
