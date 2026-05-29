# 🗺️ DETAILED PROJECT ROADMAP - PROJECT MINI FACEBOOK

> **Last Updated:** May 2026 | **Version:** 2.0 | **Total Phases:** 7

---

## 🚀 PHASE 0: FOUNDATION & INFRASTRUCTURE ✅
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
    - [x] Tích hợp **Bucket4j** cho Rate Limiting (Chống Spam API).
- [x] **Sprint 0.3: API Documentation & Quality Assurance**
    - [x] Tích hợp **SpringDoc OpenAPI** (Swagger).
        - *Strategic Value:* **"Single Source of Truth"** - Thiết lập hợp đồng dữ liệu chuẩn xác giữa Backend và Frontend.
    - [x] Cấu hình **ArchUnit** để kiểm tra tính toàn vẹn của kiến trúc.
        - *Strategic Value:* **"Architecture as Code"** - Tự động hóa việc giám sát các quy tắc Clean Architecture.

---

## 🔐 PHASE 1: AUTHENTICATION & IDENTITY ✅
*Mục tiêu: Quản lý người dùng và xác thực bảo mật.*

- [x] **Sprint 1.1: Core Auth & RBAC**
    - [x] Thiết kế User Entity (Domain) và Repository (Infrastructure - Spring Data MongoDB).
    - [x] Triển khai **RBAC** (Role-Based Access Control) với các quyền ADMIN, USER.
    - [x] Triển khai Security Filters cho **Refresh Token Rotation**.
    - [x] Triển khai **Spring Security JWT** với Cookie-based (HttpOnly).
    - [x] Tích hợp **Resend** để gửi email xác thực tài khoản.
- [x] **Sprint 1.2: Frontend Foundation (React + shadcn/ui + Zod + TanStack Query)**
    - [x] Tích hợp Custom Skill ui-ux-pro-max và thiết lập quy chuẩn UI_UX_DESIGN.md.
    - [x] Khởi tạo dự án React (Vite) và cấu hình kiến trúc phân lớp theo chuẩn FRONTEND_ARCHITECTURE.md.
    - [x] Cài đặt **Tailwind CSS v4** (CSS-first), **shadcn/ui**, **Zod** và **TanStack Query**.
    - [x] Xây dựng bộ UI Component cơ bản và tích hợp các Mockups tĩnh chất lượng cao.
- [x] **Sprint 1.3: Frontend Auth & Premium UI/UX Integration**
    - [x] Triển khai các form đăng nhập, đăng ký và logic validate Zod.
    - [x] Tích hợp cơ chế tự động **Silent Refresh** qua Axios Interceptor (Mutex Lock + Promise Queue).
    - [x] Thiết kế giao diện Đăng nhập/Đăng ký Premium (Glassmorphic Glow, Shake Animation, Responsive).
- [x] **Sprint 1.4: Profile & Media**
    - [x] Tích hợp **Cloudinary Service** vào Shared Module dùng chung.
    - [x] API Get Me & Update Profile người dùng.
    - [x] API Upload Avatar (xử lý trung gian qua Cloudinary).
    - [x] Xây dựng giao diện Profile Page Premium (Avatar Ripple Pulse, Upload Media trực quan).

---

## 📝 PHASE 2: CONTENT & NEWS FEED ✅
*Mục tiêu: Cho phép người dùng tương tác thông qua việc chia sẻ nội dung bài viết và hình ảnh.*

- [x] **Sprint 2.1: Post System (ĐÃ HOÀN THÀNH 🎉)**
    - [x] API Đăng bài viết (Hỗ trợ Text và Image qua Cloudinary).
    - [x] API Newsfeed: Hiển thị bài viết phân trang chuẩn Clean Architecture.
    - [x] Giao diện 3 cột Premium (`3-Column Grid Layout`).
    - [x] Tích hợp Responsive cực mịn (Icon-Only mode, Floating Actions).
- [x] **Sprint 2.2: Reactions & Comments (ĐÃ HOÀN THÀNH 🎉)**
    - [x] Logic Like/React cho bài viết (6 emoji reactions với hover bar).
    - [x] Hệ thống Comment cấp 1 cho các bài đăng.
    - [x] **Client-side Image Compression** (tự động nén ảnh < 1MB trước upload).

---

## 👥 PHASE 3: SOCIAL GRAPH & FRIENDS ⏳
*Mục tiêu: Xây dựng mạng lưới kết nối giữa các người dùng.*
*Lý do đưa lên trước Chat: Cần biết ai là bạn bè để hiển thị danh sách chat.*

- [ ] **Sprint 3.1: Friend Request System**
    - [ ] Thiết kế **Friendship Entity** trong MongoDB.
        - *Fields:* `requesterId`, `addresseeId`, `status` (PENDING/ACCEPTED/REJECTED/BLOCKED), `createdAt`, `updatedAt`.
        - *Indexes:* Compound index trên `(requesterId, addresseeId)` để tránh duplicate.
    - [ ] API Gửi lời mời kết bạn (`POST /friends/request`).
        - *Validation:* Không gửi cho chính mình, không gửi duplicate, không gửi cho người đã block.
    - [ ] API Hủy lời mời đã gửi (`DELETE /friends/request/{id}`).
    - [ ] API Chấp nhận lời mời (`PUT /friends/request/{id}/accept`).
    - [ ] API Từ chối lời mời (`PUT /friends/request/{id}/reject`).
- [ ] **Sprint 3.2: Friend List & Management**
    - [ ] API Lấy danh sách bạn bè (`GET /friends`) - Có phân trang.
    - [ ] API Lấy danh sách lời mời đang chờ (`GET /friends/requests/pending`).
    - [ ] API Lấy danh sách lời mời đã gửi (`GET /friends/requests/sent`).
    - [ ] API Hủy kết bạn / Unfriend (`DELETE /friends/{friendId}`).
    - [ ] API Block người dùng (`POST /friends/block/{userId}`).
- [ ] **Sprint 3.3: User Search & Discovery**
    - [ ] API Tìm kiếm người dùng (`GET /users/search?q=keyword`).
        - *Implementation:* MongoDB Text Index hoặc Regex search.
        - *Response:* Kèm trạng thái friendship (NONE/PENDING/FRIEND/BLOCKED).
    - [ ] Giao diện Search Users với kết quả realtime (debounce 300ms).
    - [ ] Giao diện Friend List với tabs: Bạn bè / Lời mời / Đã gửi.
- [ ] **Sprint 3.4: Friend Suggestions (Optional - Nice to Have)**
    - [ ] Thuật toán gợi ý bạn bè dựa trên **Mutual Friends**.
    - [ ] API `GET /friends/suggestions` - Trả về danh sách gợi ý.
    - [ ] Giao diện "Những người bạn có thể biết" trên sidebar.

---

## 💬 PHASE 4: REALTIME CHAT ⏳
*Mục tiêu: Giao tiếp thời gian thực mượt mà giữa bạn bè.*

- [ ] **Sprint 4.1: WebSocket Foundation**
    - [ ] Khởi tạo WebSocket Server với **Spring WebSocket + STOMP Protocol**.
        - *Highlight:* STOMP cung cấp topic/queue pattern, dễ scale.
        - *Highlight:* SockJS fallback cho browser không hỗ trợ WebSocket.
    - [ ] Cấu hình **WebSocket Security** - Xác thực JWT khi handshake.
    - [ ] Cấu hình **Redis Pub/Sub** để đồng bộ messages giữa multiple server instances.
    - [ ] Quản lý trạng thái **Online/Offline** bằng Redis (TTL-based presence).
    - [ ] Frontend: Tích hợp **@stomp/stompjs** + **SockJS-client**.
- [ ] **Sprint 4.2: Chat Infrastructure**
    - [ ] Thiết kế **Conversation Entity** (1-1 chat).
        - *Fields:* `participants[]`, `lastMessage`, `lastMessageAt`, `unreadCount`.
        - *Denormalization:* Embed `lastMessage` để tối ưu query danh sách chat.
    - [ ] Thiết kế **Message Entity**.
        - *Fields:* `conversationId`, `senderId`, `content`, `type` (TEXT/IMAGE/FILE), `status` (SENT/DELIVERED/SEEN), `createdAt`.
    - [ ] API Lấy danh sách conversations (`GET /conversations`).
    - [ ] API Lấy messages của conversation (`GET /conversations/{id}/messages`) - Có phân trang.
    - [ ] API Tạo conversation mới (`POST /conversations`).
- [ ] **Sprint 4.3: Messaging Logic**
    - [ ] Luồng gửi tin nhắn: Client → WebSocket → Service → Save DB → Emit to recipient.
    - [ ] Xử lý trạng thái tin nhắn:
        - **Sent** ✓: Tin nhắn đã lưu vào DB.
        - **Delivered** ✓✓: Recipient online và nhận được.
        - **Seen** 👁️: Recipient đã mở conversation.
    - [ ] API Mark messages as seen (`PUT /conversations/{id}/seen`).
    - [ ] **Optimistic UI**: Hiển thị tin nhắn ngay khi gửi, sync status sau.
- [ ] **Sprint 4.4: Chat UX Enhancements**
    - [ ] **Typing Indicator**: Hiển thị "Đang nhập..." khi người kia đang gõ.
        - *Implementation:* Emit typing event qua WebSocket, debounce 1s.
    - [ ] **Message Reactions**: React emoji cho từng tin nhắn (❤️ 👍 😂 😮 😢 😡).
    - [ ] **Reply to Message**: Quote/Reply tin nhắn cụ thể.
        - *UI:* Swipe right to reply (mobile) hoặc hover menu (desktop).
    - [ ] **Media in Chat**: Gửi ảnh trong tin nhắn.
        - *Reuse:* Cloudinary service từ Phase 1.
        - *Compression:* Client-side compression từ Phase 2.
- [ ] **Sprint 4.5: Message Management**
    - [ ] **Delete Message**: Soft delete với option "Xóa cho tôi" / "Xóa cho mọi người".
        - *Time limit:* "Xóa cho mọi người" chỉ trong 15 phút.
    - [ ] **Edit Message**: Cho phép sửa tin nhắn trong 15 phút.
        - *UI:* Hiển thị "(đã chỉnh sửa)" bên cạnh tin nhắn.
    - [ ] Giao diện Chat hoàn chỉnh với **Infinite Scroll** (TanStack Query + Virtualization).

---

## � PHASE 5: NOTIFICATION SYSTEM ⏳
*Mục tiêu: Thông báo realtime cho mọi tương tác trong hệ thống.*
*Lý do tách riêng: Notification là cross-cutting concern, dùng chung cho nhiều module.*

- [ ] **Sprint 5.1: Notification Infrastructure**
    - [ ] Thiết kế **Notification Entity**.
        - *Fields:* `recipientId`, `type`, `title`, `content`, `data` (JSON), `isRead`, `createdAt`.
        - *Types:* `LIKE`, `COMMENT`, `FRIEND_REQUEST`, `FRIEND_ACCEPTED`, `NEW_MESSAGE`, `MENTION`.
    - [ ] Tạo **NotificationService** với các methods:
        - `createNotification(recipientId, type, data)`
        - `markAsRead(notificationId)`
        - `markAllAsRead(recipientId)`
        - `getUnreadCount(recipientId)`
    - [ ] Tạo **NotificationRepository** với Spring Data MongoDB.
- [ ] **Sprint 5.2: In-App Notifications**
    - [ ] API Lấy danh sách notifications (`GET /notifications`) - Có phân trang.
    - [ ] API Đánh dấu đã đọc (`PUT /notifications/{id}/read`).
    - [ ] API Đánh dấu tất cả đã đọc (`PUT /notifications/read-all`).
    - [ ] API Lấy số lượng chưa đọc (`GET /notifications/unread-count`).
    - [ ] Giao diện **Notification Bell** với badge count.
    - [ ] Giao diện **Notification Dropdown** với danh sách thông báo.
- [ ] **Sprint 5.3: Realtime Push Notifications**
    - [ ] Tích hợp với WebSocket từ Phase 4 để push notification realtime.
    - [ ] Emit notification qua STOMP topic `/user/{userId}/notifications`.
    - [ ] Frontend: Subscribe và hiển thị toast notification khi nhận.
    - [ ] **Sound notification** (optional): Phát âm thanh khi có thông báo mới.
- [ ] **Sprint 5.4: Notification Triggers Integration**
    - [ ] Trigger notification khi có **Like** bài viết (Phase 2).
    - [ ] Trigger notification khi có **Comment** bài viết (Phase 2).
    - [ ] Trigger notification khi có **Friend Request** (Phase 3).
    - [ ] Trigger notification khi **Friend Request được chấp nhận** (Phase 3).
    - [ ] Trigger notification khi có **Tin nhắn mới** (Phase 4).
- [ ] **Sprint 5.5: Email Notifications (Optional)**
    - [ ] Tái sử dụng **Resend Service** từ Phase 1.
    - [ ] Gửi email khi có Friend Request (nếu user offline > 24h).
    - [ ] Gửi email digest hàng tuần (tổng hợp hoạt động).
    - [ ] API cài đặt notification preferences (`PUT /users/notification-settings`).

---

## 🛠️ PHASE 6: ADVANCED & DEPLOYMENT ⏳
*Mục tiêu: Hoàn thiện kỹ thuật chuyên sâu và đưa sản phẩm lên môi trường thật.*

- [ ] **Sprint 6.1: Optimization & Quality Audit**
    - [ ] Áp dụng **Soft Delete** cho tin nhắn và bài viết.
    - [ ] **Redis Caching** cho dữ liệu tĩnh (user profile, friend list).
    - [ ] Viết **Unit Test** bằng JUnit 5 (coverage > 70%).
    - [ ] Viết **Integration Test** bằng MockMvc + Testcontainers.
- [ ] **Sprint 6.2: CI/CD Pipeline**
    - [ ] Viết **E2E Test** bằng Playwright cho các luồng chính.
    - [ ] Thiết lập **GitHub Actions** tự động Build & Test khi push code.
    - [ ] Cấu hình **SonarQube** để kiểm tra code quality (optional).
- [ ] **Sprint 6.3: Production Deployment**
    - [ ] Deploy Backend lên **Render** hoặc **Railway**.
    - [ ] Deploy Frontend lên **Vercel** hoặc **Netlify**.
    - [ ] Cấu hình **Environment Variables** cho production.
    - [ ] Setup **Custom Domain** và **SSL Certificate**.
- [ ] **Sprint 6.4: Monitoring & Observability**
    - [ ] Tích hợp **Sentry** để theo dõi lỗi Realtime (Backend + Frontend).
    - [ ] **K6 Load Testing**: Kiểm tra sức chịu tải trước go-live.
        - *Target:* 100 concurrent users, response time < 500ms.
    - [ ] Setup **Health Check Endpoints** (`/actuator/health`).

---

## 🚀 PHASE 7: EXTENDED FEATURES ⏳
*Mục tiêu: Đưa dự án lên tầm cao mới với các tính năng mở rộng.*

- [ ] **Sprint 7.1: Group Chat**
    - [ ] Thiết kế **Group Entity** với RBAC (Admin/Member).
    - [ ] API CRUD Group (Create, Update, Delete, Add/Remove members).
    - [ ] Group notifications và mentions (@all, @username).
    - [ ] Giao diện Group Chat với member list sidebar.
- [ ] **Sprint 7.2: Rich Media & Stories**
    - [ ] Hỗ trợ **Video Upload** cho bài viết (Cloudinary video).
    - [ ] Tính năng **Stories** (tin tức 24h tự động xóa).
    - [ ] Giao diện Stories carousel trên đầu newsfeed.
- [ ] **Sprint 7.3: Voice/Video Call (Research)**
    - [ ] Nghiên cứu tích hợp **WebRTC** cho cuộc gọi realtime.
    - [ ] Signaling server với WebSocket.
    - [ ] TURN/STUN server configuration.
- [ ] **Sprint 7.4: AI-Assisted Features (Trend 2026)**
    - [ ] Tích hợp **Google Gemini API** để tóm tắt hội thoại dài.
    - [ ] **AI Sentiment Analysis**: Phân tích cảm xúc tin nhắn/bài viết.
    - [ ] **Smart Reply Suggestions**: Gợi ý câu trả lời nhanh.

---

## 📊 TỔNG KẾT TIẾN ĐỘ

| Phase | Tên | Trạng thái | Tiến độ |
|:-----:|-----|:----------:|:-------:|
| 0 | Foundation & Infrastructure | ✅ HOÀN THÀNH | 100% |
| 1 | Authentication & Identity | ✅ HOÀN THÀNH | 100% |
| 2 | Content & News Feed | ✅ HOÀN THÀNH | 100% |
| 3 | Social Graph & Friends | ⏳ Chưa bắt đầu | 0% |
| 4 | Realtime Chat | ⏳ Chưa bắt đầu | 0% |
| 5 | Notification System | ⏳ Chưa bắt đầu | 0% |
| 6 | Advanced & Deployment | ⏳ Chưa bắt đầu | 0% |
| 7 | Extended Features | ⏳ Chưa bắt đầu | 0% |

**Tổng tiến độ: ~43%** (3/7 Phases hoàn thành)

---

## 📝 CHANGELOG

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | May 2026 | Restructure to 7 Phases: Swap Phase 3↔4, Add Phase 5 (Notifications), Enhance Chat features |
| 1.0 | Apr 2026 | Initial 6 Phases roadmap |
