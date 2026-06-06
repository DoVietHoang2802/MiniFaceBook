package com.minifacebook.infrastructure.persistence.migrations;

import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.index.IndexOperations;

/**
 * Migration khởi tạo index cho Module Chat (Sprint 4.2).
 */
@ChangeUnit(id = "create-chat-indexes", order = "001", author = "antigravity")
public class Migration_20260605_AddChatIndexes {

  @Execution
  public void changeSet(MongoTemplate mongoTemplate) {
    // 1. Index cho conversations collection
    IndexOperations convIndexes = mongoTemplate.indexOps("conversations");
    
    // Unique index trên participantIds (Sorted array) để đảm bảo tính idempotent
    convIndexes.ensureIndex(new Index()
        .on("participantIds", Sort.Direction.ASC)
        .unique()
        .named("participants_unique_idx")
    );

    // Index trên lastMessageAt giảm dần để tối ưu hóa truy vấn danh sách hội thoại
    convIndexes.ensureIndex(new Index()
        .on("lastMessageAt", Sort.Direction.DESC)
        .named("last_message_at_idx")
    );

    // 2. Index cho messages collection
    IndexOperations msgIndexes = mongoTemplate.indexOps("messages");

    // Compound Index (conversationId ASC, createdAt DESC) để query chat history nhanh
    msgIndexes.ensureIndex(new Index()
        .on("conversationId", Sort.Direction.ASC)
        .on("createdAt", Sort.Direction.DESC)
        .named("conv_created_idx")
    );

    // Index trên senderId để hỗ trợ thống kê hoặc tìm kiếm tin nhắn theo người gửi
    msgIndexes.ensureIndex(new Index()
        .on("senderId", Sort.Direction.ASC)
        .named("sender_idx")
    );
  }

  @RollbackExecution
  public void rollback(MongoTemplate mongoTemplate) {
    mongoTemplate.indexOps("conversations").dropIndex("participants_unique_idx");
    mongoTemplate.indexOps("conversations").dropIndex("last_message_at_idx");
    mongoTemplate.indexOps("messages").dropIndex("conv_created_idx");
    mongoTemplate.indexOps("messages").dropIndex("sender_idx");
  }
}
