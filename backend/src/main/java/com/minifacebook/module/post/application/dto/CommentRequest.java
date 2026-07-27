package com.minifacebook.module.post.application.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

@Data
@NoArgsConstructor
public class CommentRequest {
    @NotBlank(message = "Comment content cannot be blank")
    private String content;
    
    private String parentId; // Optional parent comment ID
    
    private MultipartFile image; // Optional image attachment
}
