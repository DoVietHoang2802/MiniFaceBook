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
  - `googleSubject` (String, unique partial index when present)
  - `authProvider` (`PASSWORD`, `GOOGLE`, `PASSWORD_AND_GOOGLE`; owner-only account metadata)
  - `verificationToken` (String, index)
  - `createdAt` (Instant)
  - `updatedAt` (Instant)
- **RefreshTokens (Collection: refresh_tokens):**
  - `token` (String, unique)
  - `user` (DBRef to User)
  - `expiryDate` (Instant, index)
  - `revoked` (Boolean, default: false)
  - `createdAt` (Instant)
- **Messages:** `conversationId` (index), `senderId`, `content`, `type` (TEXT/IMAGE/FILE/POST), `mediaUrl`, server-derived `sharedPost` snapshot, delivered/seen status, reactions, reply snapshot, edit/delete state and `conversationId+createdAt` index.
- **Conversations:** `participantIds` (array 2 ID), `lastMessageSummary` (denormalized), `lastMessageAt`, `createdAt`.
- **Friends:** `requesterId`, `recipientId`, `status`, `unique_pair` (Compound Index).



## 🏗️ Kiến trúc Hệ thống (System Architecture)

Dự án áp dụng mô hình **Monorepo + Modular Monolith + Clean Architecture**:

### 1. Monorepo
Quản lý toàn bộ mã nguồn Frontend và Backend trong cùng một Repository để đồng bộ hóa quy trình phát triển và kiểm thử.

### 2. Modular Monolith (Backend)
Thay vì chia nhỏ thành Microservices ngay từ đầu (gây phức tạp về vận hành), dự án sử dụng **Modular Monolith**. Backend là một khối duy nhất nhưng được phân chia thành các Module nghiệp vụ độc lập:
- **Auth Module:** Quản lý định danh và quyền hạn.
- **User Module:** Quản lý thông tin cá nhân.
- **Chat Module:** Xử lý tin nhắn realtime.
- **Post Module:** Bài đăng, comments/replies, media, reactions và detail deep links.
- **Friendship Module:** Friend request, suggestions và relationship state.
- **Notification Module:** Event-driven notification, unread cache, SSE/STOMP delivery.
- **Admin Module:** Moderation, user controls và system broadcast.

### 3. Clean Architecture (Per Module)
Mỗi module bên trong Backend được tổ chức thành 4 lớp để đảm bảo tính độc lập:
- **Domain:** Chứa Logic nghiệp vụ thuần túy (Entities, Interfaces).
- **Application:** Điều phối logic nghiệp vụ (Services, DTOs).
- **Infrastructure:** Cài đặt các công nghệ cụ thể (MongoDB, Redis, External APIs).
- **Presentation:** Giao tiếp với thế giới bên ngoài (REST Controllers, STOMP Endpoints).

### 4. Modular Frontend (React + Vite)
Được cấu trúc theo mô hình **Kiến trúc Phân lớp Module** cho Auth, Post, Friends, Chat, Notification, Profile và Admin; `core/` giữ API/auth/monitoring/shared hooks.
👉 Chi tiết đặc tả xem tại: [FRONTEND_ARCHITECTURE.md](./FRONTEND_ARCHITECTURE.md)

---

## 🛠️ Tech Stack & Infrastructure
- **Domain Layer:** Chứa Entities, Value Objects và Repository Interfaces. Không phụ thuộc vào Framework.
- **Application Layer:** Chứa Use Cases và Application Services định nghĩa logic nghiệp vụ.
- **Infrastructure Layer:** Cài đặt thực tế của Repositories (Spring Data), External Clients và Configurations.
- **Presentation Layer:** REST Controllers và DTOs.
- **Security (Hệ thống bảo mật cấp cao):**
  - **Đăng ký (Register):** Mã hóa mật khẩu bằng BCrypt bảo mật cao, tự động phát sinh token kích hoạt tài khoản.
  - **Xác thực tài khoản (Verify Email):** Tích hợp hoàn hảo với **Resend Email API**, gửi email kích hoạt thật đến hòm thư người dùng để xác nhận trạng thái `verified: true` trước khi cho phép đăng nhập.
  - **Đăng nhập (Login):** Password login và Google OAuth/OIDC local flow phát hành 2 HttpOnly Cookies (`accessToken` và `refreshToken`). Google-only account không có local password; password actions được ẩn/chặn cho đến khi có secure create-password flow.
  - **Phân quyền (RBAC):** Tích hợp phân quyền nghiêm ngặt theo các Role (ADMIN, USER) trực tiếp trong Claims của JWT, bảo vệ tuyệt đối các API nhạy cảm.
  - **Refresh Token Rotation (Xoay vòng Token):** Cơ chế phòng chống Replay Attack thông minh. Khi người dùng refresh token, hệ thống sẽ cấp phát một cặp token mới và thu hồi token cũ. Nếu phát hiện token cũ đã bị sử dụng lại (kẻ gian lấy trộm), hệ thống lập tức xóa sạch toàn bộ active tokens của user đó để bảo vệ tài khoản.
  - **Đăng xuất (Logout):** Xóa sạch cookies ở Client và vô hiệu hóa (**`revoked: true`**) Refresh Token trong cơ sở dữ liệu MongoDB (vá thành công lỗ hổng bảo mật bỏ sót hủy token ở database ban đầu).
  - **Chống Spam (Adaptive Rate Limiting):** Tích hợp thuật toán giới hạn thích ứng (Adaptive Rate Limiting) bằng `Bucket4j` và Redis để tự động nhận diện và chặn đứng các IP spam bot tốc độ cao, đồng thời bảo vệ trải nghiệm thông suốt không bị block nhầm cho người dùng thực.
  - **Upload Media Bảo Mật Cao:** Backend xác thực Apache Tika Magic Bytes cho JPEG/PNG/WebP/GIF. Post media enforce tối đa 10 ảnh, 10MB final file và 30MB aggregate request; FE nhận raw input tối đa 20MB/ảnh, nén WebP bằng Web Worker rồi tái kiểm tra final budget. Avatar/cover giữ policy 5MB riêng. Cloudinary có startup verification ở local, không còn fallback ảnh random khi credential thiếu/sai.
  - **Tài liệu hóa (OpenAPI):** Tích hợp Swagger UI tại `/api/docs` cập nhật đầy đủ 100% mô tả nghiệp vụ và nút Authorize Token.

  
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
- **Backend:** `localhost:8080` (Context-path: `/api`).

## 📀 Quyết định Kiến trúc Hiện tại
- **Modular Monolith trên 1 VPS:** Toàn bộ Backend chạy trên một instance duy nhất. Đơn giản, dễ vận hành, phù hợp giai đoạn hiện tại.
- **MongoDB là database duy nhất:** Quản lý toàn bộ dữ liệu (User, Post, Chat, Friendship). Không sử dụng Graph Database.
- **Redis đa mục đích (Phase 4):** Presence Online/Offline (TTL), JWT Blacklist, Typing Indicator (TTL), Unread Count, và **Redis Pub/Sub** (channel `chat.room.*`) đồng bộ chat realtime đa server. Rate Limiting vẫn dùng Bucket4j in-memory.
- **OAuth transaction (single AWS instance):** Spring `JSESSIONID` chỉ dùng tạm cho Google authorization state/nonce và bị hủy sau callback; JWT cookies vẫn là application session. Redis/Spring Session chỉ cần khi scale nhiều backend replicas.
- **Tạc vụ nền bằng Spring `@Async`:** Giải quyết các tác vụ bất đồng bộ (gửi mail, xử lý ảnh) mà không cần Message Broker.
- **K6 Load Testing:** Bắt buộc chạy kiểm tra sức chịu tải trước mỗi lần deploy lên Production.


## 📂 Project Structure (Gradle/Maven)
- `src/main/java/com/minifacebook/modules/<module-name>/`:
  - `domain/`: Entities, Interfaces.
  - `application/`: Services, Use Cases.
  - `infrastructure/`: Persistence, External Clients.
  - `presentation/`: Controllers, DTOs.
- `src/main/resources/`: Configurations, SQL/NoSQL migrations.
- `src/test/java/`: JUnit 5, Mockito, Testcontainers tests.

## 🐳 Local Infrastructure (Docker Compose)
Dự án cung cấp một file `docker-compose.yml` để chạy toàn bộ hạ tầng cần thiết cho môi trường phát triển cục bộ (Local Dev):
*   **MongoDB (Port 27018):** Cơ sở dữ liệu chính của hệ thống — lưu toàn bộ dữ liệu.
*   **Redis (Port 6379):** Cache, JWT Blacklist và Rate Limiting.
*   **Mailpit (Port 8025 Web UI / Port 1025 SMTP):** Giả lập Mail SMTP Server cục bộ. Khi chạy môi trường Local Dev, Spring Boot sẽ cấu hình gửi mail qua SMTP Mailpit cục bộ. Bạn có thể mở giao diện Web UI tại `http://localhost:8025` để xem và click link xác thực như thật. Giải pháp này giúp kiểm thử email nhanh chóng, trực quan và bảo vệ quota miễn phí của API Resend thật (chỉ dùng trên Production).

## 🌐 External Services
- **Cloudinary:** Quản lý hình ảnh và media.
- **Resend:** Dịch vụ gửi Email (Auth, Notifications).
- **Vercel:** Hosting Frontend React.
- **MongoDB Atlas:** Database Cloud.
- **Redis:** Caching và JWT Blacklist (Token bị thu hồi sau khi logout).
- **Sentry:** Theo dõi và báo cáo lỗi Realtime trên Production cho cả Backend và Frontend.
