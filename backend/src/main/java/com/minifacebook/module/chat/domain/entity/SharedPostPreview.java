package com.minifacebook.module.chat.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** Immutable snapshot shown for a post shared in a conversation. */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SharedPostPreview {
  private String postId;
  private String authorName;
  private String authorAvatar;
  private String contentPreview;
  private String imageUrl;
}
