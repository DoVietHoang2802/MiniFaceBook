# Neo4j Architect Skill

Tài liệu hướng dẫn AI cách thiết kế và triển khai cơ sở dữ liệu đồ thị Neo4j trong dự án MiniFaceBook.

## 📋 Nguyên tắc cốt lõi

1. **Polyglot Persistence (Lưu trữ đa mô hình):**
   - Chỉ lưu `userId` (dưới dạng UUID/String) vào các Node của Neo4j.
   - **Tuyệt đối không** lưu các thông tin dư thừa như `name`, `avatar`, `bio` vào Neo4j. Các thông tin này phải được truy xuất từ MongoDB dựa trên `userId`.
   - Mục đích: Tránh lặp dữ liệu (Data redundancy) và giữ cho Neo4j cực kỳ nhẹ, chỉ tập trung vào cấu trúc kết nối.

2. **Quy chuẩn truy vấn (Cypher Query):**
   - Sử dụng Parameterized Queries để chống Cypher Injection.
   - Luôn sử dụng Index cho thuộc tính `userId` trên Node `User`.
   - Cấu trúc câu lệnh mẫu cho Friend:
     ```cypher
     MATCH (u1:User {userId: $uid1}), (u2:User {userId: $uid2})
     MERGE (u1)-[:FRIEND]-(u2)
     ```

3. **Cơ chế đồng bộ (Sync Mechanism):**
   - Sử dụng **Mongoose Middleware (Hooks)**:
     - Khi một User mới được tạo thành công trong MongoDB, tự động tạo một Node `User` tương ứng trong Neo4j.
     - Khi xóa User trong MongoDB, tự động xóa Node và mọi quan hệ liên quan trong Neo4j.
   - Ưu tiên xử lý đồng bộ này qua một Event Bus hoặc xử lý bất đồng bộ để không làm chậm luồng API chính.

## 🚀 Các tính năng ứng dụng
- **Mutual Friends:** Tính toán số lượng bạn chung giữa 2 người dùng.
- **Friend Recommendations:** Thuật toán gợi ý kết bạn dựa trên số lượng bạn chung hoặc độ sâu của quan hệ (ví dụ: bạn của bạn).
- **Social Graph Visualization:** Sẵn sàng cho việc hiển thị bản đồ quan hệ trong tương lai.
