package com.minifacebook.module.post.infrastructure.persistence.document;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "comments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommentDocument {
    @Id
    private String id;
    
    @Indexed // Đánh index postId để tải bình luận của bài viết siêu nhanh
    private String postId;
    private String authorId;
    private String content;
    private String imageUrl;
    
    private boolean deleted;
    private Instant deletedAt;
    
    @CreatedDate
    private Instant createdAt;
    
    @LastModifiedDate
    private Instant updatedAt;
}
