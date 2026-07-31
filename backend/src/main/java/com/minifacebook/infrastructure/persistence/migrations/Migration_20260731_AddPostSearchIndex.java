package com.minifacebook.infrastructure.persistence.migrations;

import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.TextIndexDefinition;

/** Creates the Phase 1 full-text index for public post content. */
@ChangeUnit(id = "create-post-search-index", order = "003", author = "codex")
public class Migration_20260731_AddPostSearchIndex {

  @Execution
  public void changeSet(MongoTemplate mongoTemplate) {
    mongoTemplate.indexOps("posts").ensureIndex(
        new TextIndexDefinition.TextIndexDefinitionBuilder()
            .onField("content")
            .named("post_content_text_idx")
            .build());
  }

  @RollbackExecution
  public void rollback(MongoTemplate mongoTemplate) {
    mongoTemplate.indexOps("posts").dropIndex("post_content_text_idx");
  }
}
