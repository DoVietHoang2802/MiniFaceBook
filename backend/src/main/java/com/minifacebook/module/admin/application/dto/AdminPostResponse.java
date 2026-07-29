package com.minifacebook.module.admin.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminPostResponse {
    private String id;
    private String authorId;
    private String authorName;
    private String authorAvatar;
    private String content;
    private List<String> images;
    private int likeCount;
    private int commentCount;
    private Instant createdAt;
}
