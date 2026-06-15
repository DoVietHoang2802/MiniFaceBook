package com.minifacebook.module.post.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommentReaction {
    private String id;
    private String commentId;
    private String userId;
    private ReactionType type;
    private Instant createdAt;
}
