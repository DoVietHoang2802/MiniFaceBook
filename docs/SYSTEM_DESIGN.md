# System Design & Database

## 🧱 Database Schema (MongoDB)
- **Users (Collection: users):**
  - `email` (String, unique)
  - `password` (String, hashed)
  - `name` (String)
  - `avatar` (String)
  - `bio` (String)
  - `roles` (Set<Role>)
  - `verified` (Boolean, default: false)
  - `verificationToken` (String, index)
  - `createdAt` (Instant)
  - `updatedAt` (Instant)
- **RefreshTokens (Collection: refresh_tokens):**
  - `token` (String, unique)
  - `user` (DBRef to User)
  - `expiryDate` (Instant, index)
  - `revoked` (Boolean, default: false)
  - `createdAt` (Instant)
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


## 🏗️ Kiến trúc Hệ thống (System Architecture)

Dự án áp dụng mô hình **Monorepo + Modular Monolith + Clean Architecture**:

### 1. Monorepo
Quản lý toàn bộ mã nguồn Frontend và Backend trong cùng một Repository để đồng bộ hóa quy trình phát triển và kiểm thử.

### 2. Modular Monolith (Backend)
Thay vì chia nhỏ thành Microservices ngay từ đầu (gây phức tạp về vận hành), dự án sử dụng **Modular Monolith**. Backend là một khối duy nhất nhưng được phân chia thành các Module nghiệp vụ độc lập:
- **Auth Module:** Quản lý định danh và quyền hạn.
- **User Module:** Quản lý thông tin cá nhân.
- **Chat Module:** Xử lý tin nhắn realtime.
- **Social Module:** Quản lý bài đăng, bình luận, tương tác.

### 3. Clean Architecture (Per Module)
Mỗi module bên trong Backend được tổ chức thành 4 lớp để đảm bảo tính độc lập:
- **Domain:** Chứa Logic nghiệp vụ thuần túy (Entities, Interfaces).
- **Application:** Điều phối logic nghiệp vụ (Services, DTOs).
- **Infrastructure:** Cài đặt các công nghệ cụ thể (MongoDB, Redis, External APIs).
- **Presentation:** Giao tiếp với thế giới bên ngoài (REST Controllers, STOMP Endpoints).

---

## 🛠️ Tech Stack & Infrastructure
- **Domain Layer:** Chứa Entities, Value Objects và Repository Interfaces. Không phụ thuộc vào Framework.
- **Application Layer:** Chứa Use Cases và Application Services định nghĩa logic nghiệp vụ.
- **Infrastructure Layer:** Cài đặt thực tế của Repositories (Spring Data), External Clients và Configurations.
- **Presentation Layer:** REST Controllers và DTOs.
- **Security (Hệ thống bảo mật cấp cao):** 
  - **Spring Security + JWT Stateless + Cookie-based (HttpOnly):** Cả Access Token và Refresh Token đều được lưu trữ hoàn toàn trong HttpOnly Cookie để bảo vệ chống lại các lỗ hổng bảo mật phổ biến (XSS, CSRF).
  - **Refresh Token Rotation (Xoay vòng Token):** Mỗi khi người dùng refresh token, hệ thống sẽ cấp phát một cặp token mới và vô hiệu hóa token cũ. Nếu phát hiện token cũ đã bị sử dụng lại (kẻ gian lấy trộm), hệ thống lập tức thu hồi toàn bộ active tokens của user đó.
  - **RBAC (Role-Based Access Control):** Phân quyền nghiêm ngặt theo các Role (ADMIN, USER).
  - **Xác thực Email tài khoản qua Resend:** Đăng ký tài khoản mới sẽ gửi email xác thực kèm link token kích hoạt.
  
  ##### 🔄 Secure Authentication & Refresh Token Rotation Flow
  ```mermaid
  sequenceDiagram
      autonumber
      actor Client as SPA Frontend
      participant Server as Spring Boot API
      participant DB as MongoDB

      Note over Client,Server: Đăng nhập (Login Flow)
      Client->>Server: POST /auth/login (email, password)
      Server->>DB: Tìm và đối chiếu mật khẩu
      Server->>Server: Tạo Access Token & Refresh Token
      Server->>DB: Lưu Refresh Token mới vào DB
      Server-->>Client: Trả về HTTP 200 OK + User Info<br/>(Lưu set-cookie: accessToken & refreshToken [HttpOnly])

      Note over Client,Server: Truy cập API được bảo vệ (Protected Request)
      Client->>Server: GET /api/posts (Cookies tự động gửi kèm)
      Server->>Server: Security Filter giải mã accessToken từ Cookie
      Server-->>Client: Trả về Dữ liệu bài viết (HTTP 200)

      Note over Client,Server: Xoay vòng Refresh Token (Token Rotation Flow)
      Client->>Server: POST /auth/refresh (Cookie tự động gửi refreshToken)
      Server->>DB: Tìm và kiểm tra refreshToken trong DB
      alt Token đã bị thu hồi (Kẻ gian dùng lại token cũ)
          Server->>DB: Xoá sạch toàn bộ active tokens của User này (Replay Attack detected!)
          Server-->>Client: Trả về HTTP 401 Unauthorized (Yêu cầu đăng nhập lại)
      else Token hợp lệ
          Server->>DB: Đánh dấu token cũ là revoked=true
          Server->>Server: Tạo Access Token mới & Refresh Token mới
          Server->>DB: Lưu Refresh Token mới vào DB
          Server-->>Client: Trả về HTTP 200 OK + User Info<br/>(Ghi đè set-cookie: accessToken & refreshToken mới)
      end
  ```
- **Tools:** Lombok (Code generation), MapStruct (Mapping), ArchUnit (Governance).
- **Documentation:** Swagger UI (SpringDoc OpenAPI).

## 🔌 Infrastructure Ports (Hạ tầng Docker)
Dự án sử dụng Docker Compose để quản lý các Service phụ trợ. Cần lưu ý các Port đã được tùy chỉnh để tránh xung đột:
- **MongoDB:** `localhost:27018` (Port mặc định 27017 đã được thay đổi).
- **Redis:** `localhost:6379`.
- **Neo4j:** `localhost:7474` (HTTP) / `7687` (Bolt).
- **Backend:** `localhost:8080` (Context-path: `/api`).

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
- **Redis:** Caching trạng thái Online, Session và hỗ trợ Spring WebSocket (STOMP) qua Redis Pub/Sub.
- **Prometheus & Grafana:** Hệ thống Monitoring và Dashboard theo dõi sức khỏe server.
- **Google Gemini API:** Cung cấp các tính năng thông minh (Tóm tắt hội thoại, Phân tích cảm xúc).
- **Sentry:** Theo dõi và báo cáo lỗi Realtime trên Production cho cả Backend và Frontend.