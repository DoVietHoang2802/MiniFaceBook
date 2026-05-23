package com.minifacebook.module.post.application.dto;

import com.minifacebook.module.post.domain.entity.ReactionType;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ReactionRequest {
    private ReactionType type;
}
