package com.minifacebook.module.post.domain.entity;

import lombok.*;
import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Reaction {
    private String id;
    private String postId;
    private String userId;
    private ReactionType type;
    private Instant createdAt;
}
