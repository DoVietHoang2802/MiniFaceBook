package com.minifacebook.module.post.application.dto;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;
import jakarta.validation.constraints.Size;
import java.util.List;

@Data
public class CreatePostRequest {
    @Size(max = 2000, message = "Post content must not exceed 2000 characters")
    private String content;
    
    private List<MultipartFile> images;
}
