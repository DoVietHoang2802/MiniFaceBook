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


## ⚙️ Backend Architecture
- **Modular Pattern:** Tách biệt `AuthModule`, `UsersModule`, `ChatsModule`.
- **Realtime Flow:** Frontend -> Socket Gateway -> Service -> DB -> Broadcast.
- **Security:**
  - `ThrottlerModule` chống brute-force.
  - `JwtAuthGuard` & `Cookie-based Auth`.
  - **Refresh Token Rotation:** Chống chiếm đoạt phiên đăng nhập.
- **Documentation:**
  - **Swagger UI:** Tự động hóa tài liệu API cho Frontend.

## 📐 Scalability Strategy (Chiến lược mở rộng)
- **Room-based Architecture:** Mọi cuộc hội thoại (1-1 hay Group) đều được quản lý bằng Socket.IO Rooms. Điều này giúp nâng cấp lên Group Chat ở Phase 6 mà không cần thay đổi logic Gateway.
- **Extensible DB Schema:** Thiết kế `Chats` collection sử dụng mảng `members` linh hoạt, sẵn sàng cho việc mở rộng số lượng thành viên cuộc hội thoại mà không cần Migration Database.
- **Stateless Gateway:** Sử dụng Redis Adapter cho Socket.IO ngay từ đầu để đảm bảo hệ thống có thể Scale-out (chạy trên nhiều server) mà vẫn đồng bộ realtime mượt mà.
- **Event-Driven Architecture (Future):** Sẵn sàng tích hợp Kafka/RabbitMQ để tách rời các xử lý nặng (Gửi mail, thông báo, xử lý ảnh) ra khỏi luồng chính của API.
- **High-performance Search (Future):** Thay thế Regex MongoDB bằng ElasticSearch để đảm bảo tốc độ tìm kiếm tin nhắn trong hàng tỷ record.
- **Polyglot Persistence:** Tích hợp Neo4j để quản lý Social Graph, thay thế các phép JOIN/Lookup chéo phức tạp của MongoDB để tối ưu hiệu năng đồ thị.


## 📂 Project Structure
- `/src/modules`: Logic nghiệp vụ chính.
- `/src/common`: Guards, Interceptors, Filters, Decorators.
- `/src/shared`: CloudinaryService, MailService.
- `/src/configs`: Cấu hình hệ thống.

## 🌐 External Services
- **Cloudinary:** Quản lý hình ảnh và media.
- **Resend:** Dịch vụ gửi Email (Auth, Notifications).
- **Vercel:** Hosting Frontend React.
- **MongoDB Atlas:** Database Cloud.
- **Redis:** Caching trạng thái Online, Session và hỗ trợ Socket.IO Adapter.
- **Prometheus & Grafana:** Hệ thống Monitoring và Dashboard theo dõi sức khỏe server.
- **Google Gemini API:** Cung cấp các tính năng thông minh (Tóm tắt hội thoại, Phân tích cảm xúc).