package com.minifacebook.module.post.domain.entity;

import lombok.*;
import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Comment {
    private String id;
    private String postId;
    private String authorId;
    private String content;
    private String imageUrl; // Cho phép bình luận bằng 1 ảnh (nếu cần)
    private boolean deleted;
    private Instant deletedAt;
    private Instant createdAt;
    private Instant updatedAt;
}
