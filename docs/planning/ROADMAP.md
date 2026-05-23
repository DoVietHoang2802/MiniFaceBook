# 🗺️ DETAILED PROJECT ROADMAP - PROJECT MINI FACEBOOK

## 🚀 PHASE 0: FOUNDATION & INFRASTRUCTURE
*Mục tiêu: Thiết lập bộ khung kỹ thuật chuẩn để mở rộng dự án không bị rối.*

- [x] **Sprint 0.1: Spring Boot Setup**
    - [x] Khởi tạo dự án Spring Boot 3.x với Java 21 (Maven).
    - [x] Cấu hình **Mongock** để quản lý Database Migration cho MongoDB.
    - [x] Cấu hình **Checkstyle** và **Spotless** cho code style.
    - [x] Thiết lập **Docker Compose** cho MongoDB và Redis.
- [x] **Sprint 0.2: Common Utilities & Security Foundation**
    - [x] Thiết lập bộ khung phản hồi chuẩn **ApiResponse** (Unified JSON Structure).
    - [x] Triển khai bảng mã lỗi tập trung **ErrorCode** & Custom **AppException**.
    - [x] Xây dựng **Global Exception Handling** (Tấm khiên bảo mật & đồng nhất lỗi).
    - [x] Triển khai **BaseEntity với Auditing** (Tự động theo dõi ngày tạo/sửa - chuẩn Industry).
    - [x] Thiết lập **Global Mapper Config** (MapStruct - tối ưu hiệu năng chuyển đổi dữ liệu).
    - [x] Cấu hình **Spring Security** (Stateless JWT với **Refresh Token Rotation** - Nền tảng lõi).
        - *Highlight:* **Stateless Architecture** (Không Session, dễ dàng Scale-out).
        - *Highlight:* **OAuth2 Resource Server** (Chuẩn Spring Security 6 mới nhất).
        - *Highlight:* **Custom 401 Response** (Đồng nhất lỗi Unauthenticated với ApiResponse).
        - *Highlight:* **Bcrypt Password Encoder** (Mã hóa mật khẩu chuẩn an toàn).
        - *Lưu ý:* Cơ chế Revoke Token sẽ được triển khai lưu DB ở Phase 1.
    - [x] Tích hợp **Bucket4j** cho Rate Limiting (Chống Spam API).
- [x] **Sprint 0.3: API Documentation & Quality Assurance**
    - [x] Tích hợp **SpringDoc OpenAPI** (Swagger).
        - *Strategic Value:* **"Single Source of Truth"** - Thiết lập hợp đồng dữ liệu chuẩn xác giữa Backend và Frontend, loại bỏ rủi ro sai sót và tối ưu hóa quá trình tích hợp hệ thống.
    - [x] Cấu hình **ArchUnit** để kiểm tra tính toàn vẹn của kiến trúc.
        - *Strategic Value:* **"Architecture as Code"** - Tự động hóa việc giám sát các quy tắc Clean Architecture, đảm bảo hệ thống luôn nhất quán và không phát sinh nợ kỹ thuật (Tech Debt) khi mở rộng.

---

## 🔐 PHASE 1: AUTHENTICATION & IDENTITY
*Mục tiêu: Quản lý người dùng và xác thực bảo mật.*

- [x] **Sprint 1.1: Core Auth & RBAC**
    - [x] Thiết kế User Entity (Domain) và Repository (Infrastructure - Spring Data MongoDB).
    - [x] Triển khai **RBAC** (Role-Based Access Control) với các quyền ADMIN, USER.
    - [x] Triển khai Security Filters cho **Refresh Token Rotation**.
    - [x] Triển khai **Spring Security JWT** với Cookie-based (HttpOnly).
    - [x] Tích hợp **Resend** để gửi email xác thực tài khoản.
- [x] **Sprint 1.2: Frontend Foundation (React + shadcn/ui + Zod + TanStack Query)**
    - [x] Tích hợp Custom Skill ui-ux-pro-max và thiết lập quy chuẩn ../guidelines/UI_UX_DESIGN.md.
    - [x] Khởi tạo dự án React (Vite) và cấu hình kiến trúc phân lớp theo chuẩn ../architecture/FRONTEND_ARCHITECTURE.md.
    - [x] Cài đặt **Tailwind CSS v4** (CSS-first), **shadcn/ui**, **Zod** và **TanStack Query**.
    - [x] Xây dựng bộ UI Component cơ bản và tích hợp các Mockups tĩnh chất lượng cao từ ../ui_mockups.
- [x] **Sprint 1.3: Frontend Auth & Premium UI/UX Integration**
    - [x] Triển khai các form đăng nhập, đăng ký và logic validate Zod (`LoginForm`, `RegisterForm`, `authSchema`).
    - [x] Tích hợp cơ chế tự động Silent Refresh qua Axios Interceptor có cờ Mutex Lock `isRefreshing` và mảng Promise Queue xếp hàng chờ, kết hợp với cấu hình cookie `withCredentials: true`.
    - [x] Vượt qua 100% kiểm thử runtime và sửa sạch lỗi biên dịch ES module do cờ `verbatimModuleSyntax: true`.
    - [x] Thiết kế giao diện Đăng nhập/Đăng ký Premium hoàn chỉnh (áp dụng đầy đủ 10 nguyên tắc vàng UI/UX, Focus Glassmorphic Glow, Responsive Layout khắc phục lỗi vỡ khung đứng khi viewport nhỏ, Shake animation phản hồi lỗi nhạy bén, nút Google vi tương tác mượt mà).
- [x] **Sprint 1.4: Profile & Media (Backend & Frontend - Task 1 Finalization)**
    - [x] Tích hợp Cloudinary Service vào Shared Module dùng chung.
    - [x] API Get Me & Update Profile người dùng.
    - [x] API Upload Avatar (xử lý trung gian qua Cloudinary).
    - [x] Xây dựng giao diện Trang cá nhân người dùng (Profile Page - GiaoDienCaNhan.png) Premium áp dụng thiết kế Focus Glassmorphic Glow, Avatar Ripple Pulse và Upload Media trực quan.

---

## 📝 PHASE 2: CONTENT & NEWS FEED (Trang chủ & Dòng thời gian)
*Mục tiêu: Cho phép người dùng tương tác thông qua việc chia sẻ nội dung bài viết và hình ảnh thực tế.*

- [x] **Sprint 2.1: Post System (Hạ tầng bài viết - ĐÃ HOÀN THÀNH 🎉)**
    - [x] API Đăng bài viết (Hỗ trợ định dạng Text và Image qua hạ tầng Cloudinary đã xây dựng ở Sprint 1.4).
    - [x] API Newsfeed: Hiển thị bài viết phân trang chuẩn Clean Architecture.
    - [x] Giao diện 3 cột Premium (`3-Column Grid Layout` matching `GiaoDienChinh.png` & `TrangChu4.png`).
    - [x] Tích hợp khả năng co dãn Responsive cực mịn sang Icon-Only và các phím hành động lơ lửng, vi tương tác kết bạn mượt mà.
- [ ] **Sprint 2.2: Reactions & Comments (Tương tác bài viết)**
    - [x] Logic Like/React cho bài viết (UI mượt mà, API kết nối).
    - [x] Hệ thống Comment cấp 1 (đơn giản) cho các bài đăng.
    - [ ] **Tối ưu hóa hình ảnh (Tương lai):** Tích hợp giải pháp **Client-side Image Compression** (tự động nén ảnh xuống dưới 1MB trước khi gửi đi) để tiết kiệm 90% chi phí đám mây và tối ưu trải nghiệm mạng yếu.

---

## 💬 PHASE 3: THE HEART - REALTIME CHAT (MVP)
*Mục tiêu: Giao tiếp thời gian thực mượt mà.*

- [ ] **Sprint 3.1: Messaging Foundation**
    - [ ] Khởi tạo WebSocket Server với **Spring WebSocket**.
    - [ ] Cấu hình **Redis Pub/Sub** để đồng bộ trạng thái giữa các server.
    - [ ] Quản lý trạng thái Online/Offline bằng Redis.
- [ ] **Sprint 3.2: Messaging Logic**
    - [ ] Thiết kế Messages & Chats Collection (Denormalization field `lastMessage`).
    - [ ] Luồng: Client -> Socket -> Service -> Save DB -> Emit cho người nhận.
    - [ ] Xử lý trạng thái tin nhắn: Sent (Đã gửi), Delivered (Đã nhận), Seen (Đã xem).
    - [ ] Triển khai Pagination (phân trang) cho tin nhắn để tối ưu hiệu năng.
- [ ] **Sprint 3.3: Realtime Notifications**
    - [ ] Gửi thông báo realtime qua Socket khi có tương tác (Like, Comment, Friend Request).

---

## 👥 PHASE 4: SOCIAL GRAPH & FRIENDS
*Mục tiêu: Xây dựng mạng lưới kết nối giữa các người dùng.*

- [ ] **Sprint 4.1: Friend Request**
    - [ ] Thiết kế collection `friendships` trong MongoDB (Trạng thái: Pending, Accepted, Rejected).
    - [ ] API Gửi/Hủy lời mời kết bạn (Handle logic tránh duplicate request).
- [ ] **Sprint 4.2: Social Interactions**
    - [ ] API lấy danh sách bạn bè và danh sách lời mời đang chờ.
    - [ ] API Chấp nhận hoặc Từ chối lời mời kết bạn.
    - [ ] Tích hợp Search người dùng bằng Regex MongoDB.

---

## 🛠️ PHASE 5: ADVANCED & DEPLOYMENT
*Mục tiêu: Hoàn thiện kỹ thuật chuyên sâu và đưa sản phẩm lên môi trường thật.*

- [ ] **Sprint 5.1: Optimization & Quality Audit**
    - [ ] Áp dụng Soft Delete cho tin nhắn và bài viết.
    - [ ] Caching dữ liệu tĩnh hoặc danh sách bạn bè bằng Redis.
    - [ ] Viết Unit Test bằng **JUnit 5** và Integration Test bằng **MockMvc** + **Testcontainers**.
- [ ] **Sprint 5.2: CI/CD & Production**
    - [ ] Viết E2E Test bằng **Playwright** cho các luồng chính.
    - [ ] Thiết lập GitHub Actions tự động chạy Build & Test khi push code.
    - [ ] Deploy Backend lên Render/Railway.
    - [ ] Deploy Frontend lên Vercel/Netlify.
    - [ ] Tích hợp **Sentry** để theo dõi lỗi Realtime trên Production cho cả Backend và Frontend.
    - [ ] **K6 Load Testing:** Bắt buộc chạy kiểm tra sức chịu tải trước khi go-live.

---

## 🚀 PHASE 6: EXTENDED FEATURES (MỞ RỘNG)
*Mục tiêu: Đưa dự án lên tầm cao mới với các tính năng mở rộng.*

- [ ] **Sprint 6.1: Advanced Messaging**
    - [ ] **Group Chat:** Triển khai logic nhóm, quản lý quyền **Admin/Member (RBAC)** và thông báo nhóm.
- [ ] **Sprint 6.2: Rich Media & Social**
    - [ ] **Video & Story:** Hỗ trợ định dạng video và tính năng tin tức 24h (Stories).
    - [ ] **Voice/Video Call:** Nghiên cứu tích hợp WebRTC cho cuộc gọi realtime trực tiếp.
- [ ] **Sprint 6.3: AI-Assisted Features (Trend 2026)**
    - [ ] Tích hợp **Google Gemini API** để tóm tắt nội dung hội thoại dài.
    - [ ] AI Sentiment Analysis: Phân tích cảm xúc tin nhắn/bài viết bằng Gemini.

