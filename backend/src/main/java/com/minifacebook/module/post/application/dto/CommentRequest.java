package com.minifacebook.module.post.application.dto;

import jakarta.validation.constraints.AssertTrue;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

@Data
@NoArgsConstructor
public class CommentRequest {
    private String content;
    
    private String parentId; // Optional parent comment ID
    
    private MultipartFile image; // Optional image attachment

    @AssertTrue(message = "Comment content or image is required")
    public boolean isContentOrImagePresent() {
        return (content != null && !content.isBlank()) || (image != null && !image.isEmpty());
    }
}
