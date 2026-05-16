# System Design & Database

## 🧱 Database Schema (MongoDB)
- **Users:** `email` (unique), `password` (hashed), `avatar`, `bio`.
- **Messages:** `chatId` (index), `senderId`, `content`, `type`, `status` (sent/delivered/seen), `timestamp` (index).
- **Chats:** `members` (array of ID), `lastMessage` (Denormalized object), `updatedAt`.
- **Friends:** `requesterId`, `recipientId`, `status`, `unique_pair` (Compound Index).

#### 🕸️ Graph Database (Neo4j)
- **Nodes:**
  - `User`: `{ userId: UUID }`
- **Relationships:**
  - `FRIEND`: `(u1:User)-[:FRIEND]->(u2:User)`
  - `FOLLOW`: `(u1:User)-[:FOLLOW]->(u2:User)`
  - `BLOCK`: `(u1:User)-[:BLOCK]->(u2:User)`


## ⚙️ Backend Architecture (Modular Clean Architecture)
- **Domain Layer:** Chứa Entities, Value Objects và Repository Interfaces. Không phụ thuộc vào Framework.
- **Application Layer:** Chứa Use Cases và Application Services định nghĩa logic nghiệp vụ.
- **Infrastructure Layer:** Cài đặt thực tế của Repositories (Spring Data), External Clients và Configurations.
- **Presentation Layer:** REST Controllers và DTOs.
- **Security:** Spring Security + JWT Stateless + Refresh Token Rotation.
- **Tools:** Lombok (Code generation), MapStruct (Mapping), ArchUnit (Governance).
- **Documentation:** Swagger UI (SpringDoc OpenAPI).

## 📐 Scalability Strategy (Chiến lược mở rộng)
- **Topic/Queue-based Architecture:** Mọi cuộc hội thoại được định tuyến bằng STOMP Destinations (/topic, /queue). Điều này giúp nâng cấp lên Group Chat ở Phase 6 thông qua Message Broker (RabbitMQ) cực kỳ dễ dàng.
- **Extensible DB Schema:** Thiết kế `Chats` collection sử dụng mảng `members` linh hoạt, sẵn sàng cho việc mở rộng số lượng thành viên cuộc hội thoại mà không cần Migration Database.
- **Stateless Gateway:** Sử dụng Redis Pub/Sub ngay từ đầu để đồng bộ tin nhắn WebSocket giữa các instances khi scale-out.
- **Event-Driven Architecture (Future):** Sẵn sàng tích hợp Kafka/RabbitMQ để tách rời các xử lý nặng (Gửi mail, thông báo, xử lý ảnh) ra khỏi luồng chính của API.
- **High-performance Search (Future):** Thay thế Regex MongoDB bằng ElasticSearch để đảm bảo tốc độ tìm kiếm tin nhắn trong hàng tỷ record.
- **Polyglot Persistence:** Tích hợp Neo4j để quản lý Social Graph, thay thế các phép JOIN/Lookup chéo phức tạp của MongoDB để tối ưu hiệu năng đồ thị.


## 📂 Project Structure (Gradle/Maven)
- `src/main/java/com/minifacebook/modules/<module-name>/`:
  - `domain/`: Entities, Interfaces.
  - `application/`: Services, Use Cases.
  - `infrastructure/`: Persistence, External Clients.
  - `presentation/`: Controllers, DTOs.
- `src/main/resources/`: Configurations, SQL/NoSQL migrations.
- `src/test/java/`: JUnit 5, Mockito, Testcontainers tests.

## 🌐 External Services
- **Cloudinary:** Quản lý hình ảnh và media.
- **Resend:** Dịch vụ gửi Email (Auth, Notifications).
- **Vercel:** Hosting Frontend React.
- **MongoDB Atlas:** Database Cloud.
- **Redis:** Caching trạng thái Online, Session và hỗ trợ Socket.IO Adapter.
- **Prometheus & Grafana:** Hệ thống Monitoring và Dashboard theo dõi sức khỏe server.
- **Google Gemini API:** Cung cấp các tính năng thông minh (Tóm tắt hội thoại, Phân tích cảm xúc).