# 🗺️ DETAILED PROJECT ROADMAP - PROJECT MINI FACEBOOK

## 🚀 PHASE 0: FOUNDATION & INFRASTRUCTURE
*Mục tiêu: Thiết lập bộ khung kỹ thuật chuẩn để mở rộng dự án không bị rối.*

- [x] **Sprint 0.1: Project Setup**
    - [x] Khởi tạo NestJS với kiến trúc Modular[cite: 1].
    - [x] Cấu hình ESLint, Prettier, Husky & Lint-staged để chuẩn hóa code style[cite: 1, 2].
    - [x] Viết file `docker-compose.yml` cho MongoDB & Redis[cite: 1, 2].
- [ ] **Sprint 0.2: Common Utilities**
    - [x] Cấu hình `ValidationPipe` toàn cục (Class-validator & Class-transformer)[cite: 1].
        - *💡 Tối ưu thêm:* Đã cấu hình `enableImplicitConversion: true` giúp tự động ép kiểu dữ liệu từ DTO mà không cần dùng `@Type()`.
        - *💡 Tối ưu thêm:* Đã dùng `exceptionFactory` gộp chung lỗi Validate vào `BadRequestException`.
    - [x] Triển khai `Global Exception Filter` xử lý lỗi đồng nhất toàn hệ thống[cite: 1].
        - *💡 Tối ưu bảo mật:* Ẩn chi tiết lỗi nhạy cảm của server khi gặp lỗi 500. Format gọn gàng mảng lỗi của ValidationPipe vào trường `details`.
    - [x] Bật `CORS` trong main.ts[cite: 1].
        - *⚠️ Lưu ý sau này:* Hiện đang dùng `origin: '*'` và `credentials: true`. Khi lên Phase 1 ghép Frontend, cần sửa `origin` thành domain cụ thể (vd: `http://localhost:5173`) để trình duyệt không chặn token.
    - [x] Setup Winston Logging để theo dõi log và debug[cite: 1].
        - *💡 Tối ưu kiến trúc:* Chuyển `GlobalExceptionFilter` vào `app.module.ts` (Dependency Injection) để Filter tự động gọi Winston ghi lại lỗi ra file `logs/error.log`. NestJS giờ đã dùng Winston làm Logger mặc định.
    - [x] Cấu hình NestJS Throttler chống Spam và DDoS API[cite: 2].
        - *💡 Tối ưu bảo mật:* Đã cấu hình giới hạn 100 requests / 60 giây cho mỗi IP. Khai báo `ThrottlerGuard` toàn cục bằng Dependency Injection.
    - [x] **Sprint 0.3: API Documentation & Professional Tools**
        - [x] Tích hợp **Swagger (OpenAPI 3.0)** để tự động hóa tài liệu API.
        - [x] Đã cấu hình Bearer Auth sẵn sàng cho Phase 1.

---

## 🔐 PHASE 1: AUTHENTICATION & IDENTITY
*Mục tiêu: Quản lý người dùng và xác thực bảo mật.*

- [ ] **Sprint 1.1: Core Auth**
    - [x] Thiết kế User Schema (Mongoose) có đánh Index cho field `email`[cite: 1].
    - [ ] API Login: Triển khai cơ chế **Refresh Token Rotation** (Access Token ngắn hạn, Refresh Token lưu vào Redis/DB).
    - [ ] Triển khai **Passport JWT Strategy** với Cookie-based (HttpOnly) để chống XSS/CSRF.
    - [ ] Tích hợp **Resend** để gửi email xác thực tài khoản & thông báo.
- [ ] **Sprint 1.2: Frontend Foundation (React + shadcn/ui + Zod + TanStack Query)**
    - [ ] Khởi tạo dự án React (Vite).
    - [ ] Cài đặt **Tailwind CSS**, **shadcn/ui**, **Zod** và **TanStack Query**.
    - [ ] Xây dựng bộ UI Component cơ bản (Button, Input, Card, Dialog).
- [ ] **Sprint 1.3: Profile & Media**
    - [ ] Tích hợp Cloudinary Service vào Shared Module dùng chung[cite: 1].
    - [ ] API Get Me & Update Profile người dùng[cite: 1].
    - [ ] API Upload Avatar (xử lý trung gian qua Cloudinary)[cite: 1].

---

## 💬 PHASE 2: THE HEART - REALTIME CHAT (MVP)
*Mục tiêu: Triển khai tính năng quan trọng nhất của dự án.*

- [ ] **Sprint 2.1: Socket Foundation**
    - [ ] Khởi tạo Socket.IO Gateway trong NestJS[cite: 1].
    - [ ] Triển khai **Redis Adapter** cho Socket.IO để sẵn sàng cho việc Scale-out (nhiều server chạy song song).
    - [ ] Triển khai WebSocket Guard để verify JWT ngay khi handshake[cite: 1].
    - [ ] Quản lý trạng thái Online/Offline bằng **Redis** (Tối ưu tốc độ truy xuất).
- [ ] **Sprint 2.2: Messaging Logic**
    - [ ] Thiết kế Messages & Chats Collection (Denormalization field `lastMessage`)[cite: 1].
    - [ ] Luồng: Client -> Socket -> Service -> Save DB -> Emit cho người nhận[cite: 1].
    - [ ] Xử lý trạng thái tin nhắn: Sent (Đã gửi), Delivered (Đã nhận), Seen (Đã xem)[cite: 1].
    - [ ] Triển khai Pagination (phân trang) cho tin nhắn để tối ưu hiệu năng[cite: 1].

---

## 👥 PHASE 3: SOCIAL GRAPH & FRIENDS
*Mục tiêu: Xây dựng mạng lưới kết nối giữa các người dùng.*

- [ ] **Sprint 3.1: Friend Request**
    - [ ] Thiết kế Friend Schema (Trạng thái: Pending, Accepted, Rejected)[cite: 1].
    - [ ] API Gửi/Hủy lời mời kết bạn (Handle logic tránh duplicate request)[cite: 1].
    - [ ] Khởi tạo Neo4j Connection và đồng bộ dữ liệu Node (User ID) từ MongoDB sang Neo4j.
    - [ ] Tích hợp Cypher Query để tính toán số lượng bạn chung và thuật toán gợi ý kết bạn.

- [ ] **Sprint 3.2: Social Interactions**
    - [ ] API lấy danh sách bạn bè và danh sách lời mời đang chờ[cite: 1].
    - [ ] API Chấp nhận hoặc Từ chối lời mời kết bạn[cite: 1].
    - [ ] Tích hợp Search người dùng bằng Regex MongoDB[cite: 1].

---

## 📝 PHASE 4: CONTENT & ENGAGEMENT
*Mục tiêu: Tăng tương tác thông qua bài viết và thông báo.*

- [ ] **Sprint 4.1: Post System**
    - [ ] API Đăng bài viết (Hỗ trợ định dạng Text và Image qua Cloudinary)[cite: 1].
    - [ ] API Newsfeed: Hiển thị bài viết từ danh sách bạn bè[cite: 1].
- [ ] **Sprint 4.2: Reactions & Comments**
    - [ ] Logic Like/React cho bài viết và tin nhắn[cite: 1].
    - [ ] Hệ thống Comment cấp 1 (đơn giản) cho các bài đăng[cite: 1].
- [ ] **Sprint 4.3: Realtime Notifications**
    - [ ] Gửi thông báo realtime qua Socket khi có tương tác (Like, Comment, Friend Request)[cite: 1].
- [ ] **Sprint 4.4: AI-Assisted Features (Trend 2026)**
    - [ ] Tích hợp **Google Gemini API** để tóm tắt nội dung hội thoại dài.
    - [ ] AI Sentiment Analysis: Phân tích cảm xúc tin nhắn/bài viết bằng Gemini.

---

## 🛠️ PHASE 5: ADVANCED & DEPLOYMENT
*Mục tiêu: Hoàn thiện kỹ thuật chuyên sâu và đưa sản phẩm lên môi trường thật.*

- [ ] **Sprint 5.1: Optimization**
    - [ ] Áp dụng Soft Delete cho tin nhắn và bài viết (không xóa vật lý)[cite: 1].
    - [ ] Caching dữ liệu tĩnh hoặc danh sách bạn bè bằng Redis[cite: 1].
    - [ ] Viết Unit Test bằng **Jest** cho các logic nghiệp vụ quan trọng[cite: 1, 2].
- [ ] **Sprint 5.2: CI/CD & Production**
    - [ ] Viết E2E Test bằng **Playwright** cho các luồng chính.
    - [ ] Thiết lập GitHub Actions tự động chạy Build & Test khi push code[cite: 2].
    - [ ] Deploy Backend lên Render/Railway[cite: 1].
    - [ ] Deploy Frontend lên Vercel/Netlify[cite: 1].

---

## 🚀 PHASE 6: SCALING & EXTENDED FEATURES (MỞ RỘNG)
*Mục tiêu: Đưa dự án lên tầm cao mới với các tính năng phức tạp sau khi Core đã đạt 10/10.*

- [ ] **Sprint 6.1: Advanced Messaging & Search**
    - [ ] **Group Chat:** Triển khai logic nhóm, quản lý quyền Admin/Member và thông báo nhóm.
    - [ ] **Message Search (ElasticSearch):** Tích hợp ElasticSearch để xử lý tìm kiếm dữ liệu lớn với tốc độ cao, thay thế Regex MongoDB.
- [ ] **Sprint 6.2: Rich Media & Social**
    - [ ] **Video & Story:** Hỗ trợ định dạng video và tính năng tin tức 24h (Stories).
    - [ ] **Voice/Video Call:** Nghiên cứu tích hợp WebRTC cho cuộc gọi realtime trực tiếp.
- [ ] **Sprint 6.3: Infrastructure Scaling & Monitoring**
    - [ ] **Message Broker (Kafka/RabbitMQ):** Triển khai kiến trúc Event-Driven để xử lý Notification và tác vụ nền khi hệ thống có hàng triệu user.
    - [ ] Tích hợp **Prometheus & Grafana** để theo dõi hiệu năng hệ thống chuyên sâu.