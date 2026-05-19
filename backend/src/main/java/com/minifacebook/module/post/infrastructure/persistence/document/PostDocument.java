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
    private List<String> reactIds = new ArrayList<>();
    
    @CreatedDate
    private Instant createdAt;
    
    @LastModifiedDate
    private Instant updatedAt;
}
