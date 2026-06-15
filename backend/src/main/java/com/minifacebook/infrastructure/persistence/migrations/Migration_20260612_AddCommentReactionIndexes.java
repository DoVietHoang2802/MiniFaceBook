package com.minifacebook.infrastructure.persistence.migrations;

import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.index.IndexOperations;

@ChangeUnit(id = "create-comment-reaction-indexes", order = "002", author = "codex")
public class Migration_20260612_AddCommentReactionIndexes {

    @Execution
    public void changeSet(MongoTemplate mongoTemplate) {
        IndexOperations indexes = mongoTemplate.indexOps("comment_reactions");

        indexes.ensureIndex(new Index()
                .on("commentId", Sort.Direction.ASC)
                .on("userId", Sort.Direction.ASC)
                .unique()
                .named("comment_user_idx"));

        indexes.ensureIndex(new Index()
                .on("commentId", Sort.Direction.ASC)
                .named("comment_idx"));
    }

    @RollbackExecution
    public void rollback(MongoTemplate mongoTemplate) {
        mongoTemplate.indexOps("comment_reactions").dropIndex("comment_user_idx");
        mongoTemplate.indexOps("comment_reactions").dropIndex("comment_idx");
    }
}
