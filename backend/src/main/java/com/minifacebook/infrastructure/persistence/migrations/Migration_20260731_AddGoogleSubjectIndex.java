package com.minifacebook.infrastructure.persistence.migrations;

import com.mongodb.client.model.IndexOptions;
import com.mongodb.client.model.Indexes;
import org.bson.Document;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import org.springframework.data.mongodb.core.MongoTemplate;

/** Allows only one non-empty Google OIDC subject while preserving legacy null users. */
@ChangeUnit(id = "create-google-subject-index", order = "004", author = "codex")
public class Migration_20260731_AddGoogleSubjectIndex {
  @Execution
  public void changeSet(MongoTemplate mongoTemplate) {
    mongoTemplate.getCollection("users").createIndex(Indexes.ascending("googleSubject"),
        new IndexOptions().name("user_google_subject_unique").unique(true)
            .partialFilterExpression(new Document("googleSubject", new Document("$type", "string"))));
  }

  @RollbackExecution
  public void rollback(MongoTemplate mongoTemplate) {
    mongoTemplate.getCollection("users").dropIndex("user_google_subject_unique");
  }
}
