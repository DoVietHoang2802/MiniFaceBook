package com.minifacebook.module.post.application.dto;

import java.time.Instant;
import lombok.Builder;
import lombok.Data;

/** Lightweight, non-personalized post result for header search suggestions. */
@Data
@Builder
public class PostSuggestionResponse {
  private String id;
  private String authorId;
  private String authorName;
  private String authorAvatar;
  private String excerpt;
  private Instant createdAt;
}
