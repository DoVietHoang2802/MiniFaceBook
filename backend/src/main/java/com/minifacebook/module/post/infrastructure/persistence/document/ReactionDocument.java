package com.minifacebook.module.post.infrastructure.persistence.document;

import com.minifacebook.module.post.domain.entity.ReactionType;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "reactions")
@CompoundIndex(name = "post_user_idx", def = "{'postId': 1, 'userId': 1}", unique = true)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReactionDocument {
    @Id
    private String id;
    
    private String postId;
    private String userId;
    private ReactionType type;
    
    @CreatedDate
    private Instant createdAt;
}
