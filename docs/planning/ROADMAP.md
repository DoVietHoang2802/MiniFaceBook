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

## 👥 PHASE 3: SOCIAL GRAPH & FRIENDS ✅
*Mục tiêu: Xây dựng mạng lưới kết nối giữa các người dùng.*
*Lý do đưa lên trước Chat: Cần biết ai là bạn bè để hiển thị danh sách chat.*

- [x] **Sprint 3.1: Friend Request System (ĐÃ HOÀN THÀNH 🎉)**
    - [x] Thiết kế **Friendship Entity** trong MongoDB.
        - *Fields:* `requesterId`, `addresseeId`, `status` (PENDING/ACCEPTED/REJECTED/BLOCKED), `createdAt`, `updatedAt`.
        - *Indexes:* Compound index trên `(requesterId, addresseeId)` để tránh duplicate.
    - [x] API Gửi lời mời kết bạn (`POST /friends/request/{userId}`).
        - *Validation:* Không gửi cho chính mình, không gửi duplicate, không gửi cho người đã block.
    - [x] API Hủy lời mời đã gửi (`DELETE /friends/request/{friendshipId}`).
    - [x] API Chấp nhận lời mời (`PUT /friends/request/{friendshipId}/accept`).
    - [x] API Từ chối lời mời (`PUT /friends/request/{friendshipId}/reject`).
- [x] **Sprint 3.2: Friend List & Management (ĐÃ HOÀN THÀNH 🎉)**
    - [x] API Lấy danh sách bạn bè (`GET /friends`).
    - [x] API Lấy danh sách lời mời đang chờ (`GET /friends/requests/pending`).
    - [x] API Lấy danh sách lời mời đã gửi (`GET /friends/requests/sent`).
    - [x] API Hủy kết bạn / Unfriend (`DELETE /friends/{friendId}`).
    - [x] API Block người dùng (`POST /friends/block/{userId}`) + Unblock (`DELETE /friends/block/{userId}`).
        - *Cơ chế:* `requesterId` = người chặn, `addresseeId` = người bị chặn, `status = BLOCKED`. Chỉ người chặn mới gỡ được.
    - [x] Tích hợp `isSentByMe` (sentByMe) vào response + batch-load `findAllByIds` chống N+1.
- [x] **Sprint 3.3: User Search & Discovery (ĐÃ HOÀN THÀNH 🎉)**
    - [x] **[FIX BUG nền tảng - ĐÃ XONG 🎉]** Thêm field `name` (họ tên) vào Backend.
        - *Lý do:* Frontend `RegisterForm` ĐÃ có ô "Họ và tên" và gửi `name` lên, nhưng Backend (`RegisterRequest`, `User`, `UserDocument`) KHÔNG nhận → tên bị vứt bỏ, không lưu DB. Đây là bug FE-BE mismatch tồn tại từ Sprint 1.
        - *Đã làm:* `RegisterRequest` thêm `name` (`@NotBlank` + `@Size` 2-50); `User` + `UserDocument` (có `@Indexed`) + `UserResponse` thêm `name`; MapStruct tự map; thêm mã lỗi `NAME_REQUIRED` (1020) + `NAME_INVALID` (1021). Test 5 case PASS.
    - [x] **[API Search - ĐÃ XONG 🎉]** Tìm kiếm người dùng (`GET /friends/search?q=keyword&page=&size=`).
        - *Implementation:* MongoDB Regex case-insensitive trên field `name`, chỉ lấy user `verified=true`.
        - *Response:* `UserSearchResponse` kèm `relationshipStatus` (NONE/PENDING_SENT/PENDING_RECEIVED/FRIEND/BLOCKED) + `friendshipId`.
        - *Cải tiến đã làm:* Loại trừ chính mình; ẩn người đã chặn mình (privacy); có phân trang. Test 7 case PASS.
        - *Lưu ý endpoint:* Đặt tại `/friends/search` (không phải `/users/search`) vì logic cần `FriendshipRepository` (thuộc module friendship - đúng Clean Architecture).
    - [x] Giao diện Search Users với kết quả realtime (debounce 300ms). *(ĐÃ XONG 🎉 - module `friends`)*
    - [x] Giao diện Friend List với tabs: Bạn bè / Lời mời / Đã gửi. *(ĐÃ XONG 🎉 - `FriendsPage` 4 tab, nút động theo relationshipStatus, Optimistic UI)*
- [x] **Sprint 3.4: Friend Suggestions (ĐÃ HOÀN THÀNH 🎉)**
    - [x] Thuật toán gợi ý bạn bè dựa trên **Mutual Friends** (bạn của bạn, đếm số bạn chung, in-memory).
    - [x] API `GET /friends/suggestions?limit=` - Trả về danh sách gợi ý sắp xếp theo mutual count. Batch query chống N+1.
    - [x] Giao diện "People You May Know" trên sidebar dùng data thật (thay mock cũ), Optimistic Add Friend, empty state.

---

## 💬 PHASE 4: REALTIME CHAT 🟡
*Mục tiêu: Giao tiếp thời gian thực mượt mà giữa bạn bè.*

- [x] **Sprint 4.1: WebSocket Foundation (ĐÃ HOÀN THÀNH 🎉)**
    - [x] Khởi tạo WebSocket Server với **Spring WebSocket + STOMP Protocol**.
        - *Highlight:* STOMP cung cấp topic/queue pattern, dễ scale.
        - *Highlight:* SockJS fallback cho browser không hỗ trợ WebSocket.
    - [x] Cấu hình **WebSocket Security** - Xác thực JWT khi handshake (đọc từ HttpOnly Cookie qua `WebSocketAuthInterceptor` + validate trên STOMP CONNECT qua `WebSocketChannelInterceptor`).
    - [x] Quản lý trạng thái **Online/Offline** bằng Redis (TTL-based presence 35s, heartbeat 25s, tự expire khi mất kết nối).
    - [x] **Redis Pub/Sub** — Triển khai đồng bộ tin nhắn realtime giữa các WebSocket sessions (scale-ready cho đa server).
        - *Lý do triển khai ngay:* Thiết kế sẵn cho scale ngang, không cần refactor sau. MessageListener pattern + RedisMessageListenerContainer.
        - *Cơ chế:* User A gửi tin → Backend publish lên Redis channel `chat.room.<roomId>` → Tất cả server đang subscribe sẽ nhận và broadcast qua WebSocket.
        - *Với 1 server:* Vẫn hoạt động bình thường, overhead không đáng kể (~0.5ms/message).
    - [x] **Nâng cấp JWT Blacklist** — chuyển từ MongoDB `revoked` flag → Redis TTL cho Access Token khi logout.
        - *Benchmark thực tế trên máy dev:* Redis EXISTS **0.019 ms/lần** vs MongoDB findOne (có index) **0.75 ms/lần** → **Redis nhanh hơn ~40 lần**.
        - *Logic nghiệp vụ giữ nguyên 100%* (Port-Adapter pattern qua `TokenBlacklistPort` ở shared layer), chỉ đổi nơi lưu.
    - [x] Frontend: Tích hợp **@stomp/stompjs** + **SockJS-client** (`webSocketService` singleton + `useWebSocket` hook + `presenceService`).
    - [x] Bug fix: ProfilePage crash khi 401 (thêm guard `!user || !user.email`).
    - [x] Bug fix: authService response parsing - thống nhất `ApiResponse<T>` structure cho login/getMe endpoints.
- [x] **Sprint 4.2: Chat Infrastructure**
    - [x] **Bổ sung Domain & Infrastructure Layer cho Chat Module** (tuân thủ Clean Architecture 4 lớp).
        - *Package structure:* `domain/entity`, `domain/repository`, `infrastructure/persistence`, `infrastructure/mapper`.
    - [x] Thiết kế **Conversation Entity** (1-1 chat - Domain POJO).
        - *Fields:* `id`, `participantIds[]` (exactly 2), `lastMessageSummary`, `lastMessageAt`, `createdAt`.
        - *LastMessageSummary (Value Object):* `senderId`, `contentPreview` (100 chars), `type`, `sentAt` — không embed full message để tiết kiệm payload.
        - *Validation:* Participants phải là bạn bè (ACCEPTED status), không duplicate conversation.
        - *UnreadCount:* Tính on-the-fly từ DB query hoặc cache Redis (không lưu field để tránh desync).
    - [x] Thiết kế **Message Entity** (Domain POJO).
        - *Fields:* `id`, `conversationId`, `senderId`, `content`, `type` (TEXT/IMAGE/FILE), `createdAt`.
        - *Status tracking:* `deliveredAt`, `seenAt` (nullable Instant) — giống Facebook Messenger.
        - *Cơ chế:*
            - **SENT** ✓: Tin nhắn đã lưu DB (có `createdAt`).
            - **DELIVERED** ✓✓: Recipient online và nhận qua WebSocket → backend set `deliveredAt`.
            - **SEEN** 👁️: Recipient mở conversation → frontend gọi API `markAsSeen` → backend set `seenAt`.
    - [x] **MongoDB Indexes** (thêm vào DATABASE_SCHEMA.md):
        - `conversations`: multikey index `participantIds`, descending index `lastMessageAt`, compound unique index `participantIds` (sorted array).
        - `messages`: compound index `(conversationId, createdAt DESC)`, optional index `senderId`.
    - [x] API Lấy danh sách conversations (`GET /conversations`) - Sort theo `lastMessageAt` DESC.
        - *Response:* Include `lastMessageSummary`, `unreadCount` (tính realtime).
    - [x] API Lấy messages của conversation (`GET /conversations/{id}/messages?page=&size=`) - Phân trang infinite scroll.
        - *Validation:* User phải là participant của conversation.
    - [x] API Tạo/Lấy conversation (`POST /conversations`) - Idempotent (return existing nếu đã có).
        - *Validation:* Recipient phải là friend (ACCEPTED), không tạo với chính mình.
    - [x] API Mark messages as seen (`PUT /conversations/{id}/seen`) - Cập nhật `seenAt` cho tất cả messages chưa xem của conversation.
        - *Trigger:* Frontend gọi khi user mở conversation hoặc focus vào chat window.
        - *Realtime sync:* Emit WebSocket event đến sender để update UI (✓✓ → 👁️).
- [ ] **Sprint 4.3: Messaging Logic & Realtime Delivery**
    - [ ] **WebSocket Message Controller** - Nhận tin nhắn qua STOMP `/app/chat.send`.
        - *Flow:* Client send → Backend validate → Save DB → Update Conversation lastMessage → Emit to recipient qua Redis Pub/Sub.
    - [ ] **Message Status Transition (giống Facebook Messenger):**
        - **SENT** ✓: Message có `createdAt` (đã lưu DB).
        - **DELIVERED** ✓✓: Recipient online → Backend emit qua WebSocket → Recipient client nhận được → gọi callback set `deliveredAt`.
            - *Implementation:* WebSocket `/user/{recipientId}/queue/messages` → Client auto-ack → REST `PUT /messages/{id}/delivered`.
        - **SEEN** 👁️: User mở conversation → Frontend gọi `PUT /conversations/{id}/seen` → Backend set `seenAt` cho all messages → Emit WebSocket đến sender.
    - [ ] **Optimistic UI (Frontend):**
        - Tin nhắn hiển thị ngay với status PENDING (⏱️) → Server response → update status SENT (✓).
        - Nếu fail → hiển thị ❌ + nút retry.
    - [ ] **Redis Pub/Sub Integration:**
        - Channel pattern: `chat.room.<conversationId>`.
        - Message format: `{type: "NEW_MESSAGE", data: MessageResponse}`.
        - All servers subscribe → broadcast đến WebSocket sessions của participants.
    - [ ] **Redis Unread Count với TTL** (từ AI review - tránh memory leak):
        - Khi gửi tin nhắn mới → increment unread count cho recipient.
        - Set TTL 7 ngày: `redisTemplate.expire(key, 7, TimeUnit.DAYS)`.
        - Key pattern: `unread:<conversationId>:<recipientId>`.
    - [ ] **ContentPreview Helper** (từ AI review - XSS prevention + truncate):
        - Sanitize HTML tags: `content.replaceAll("<[^>]*>", "")`.
        - Truncate về 100 chars (97 + "...").
        - Handle IMAGE/FILE type với placeholder: "📷 Đã gửi một ảnh", "📎 Đã gửi một file".
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
| 3 | Social Graph & Friends | ✅ HOÀN THÀNH | 100% |
| 4 | Realtime Chat | 🟡 Đang làm | 20% (1/5 Sprint) |
| 5 | Notification System | ⏳ Chưa bắt đầu | 0% |
| 6 | Advanced & Deployment | ⏳ Chưa bắt đầu | 0% |
| 7 | Extended Features | ⏳ Chưa bắt đầu | 0% |

**Tổng tiến độ: ~62%** (4/7 Phases hoàn thành + Sprint 4.1 xong)

---

## 🔧 TECH DEBT & CẢI TIẾN CẦN THEO DÕI

> Các khoản nợ kỹ thuật và cải tiến được ghi nhận trong quá trình review. Trạng thái: 🔴 Chưa làm | 🟡 Đang làm | ✅ Đã xong

| # | Hạng mục | Nhóm | Ưu tiên | Trạng thái | Dự kiến |
|:-:|----------|------|:-------:|:----------:|---------|
| 1 | MongoDB Replica Set + `MongoTransactionManager` | Hạ tầng | 🔴 Cao | ✅ Đã xong | Hoàn thành 30/05 |
| 2 | `findAllByIds` chống N+1 Query | Hiệu năng | 🟡 TB | ✅ Đã xong | Hoàn thành 30/05 |
| 3 | Đồng bộ `AppException` cho Post module | Chuẩn hóa | 🟡 TB | 🔴 Chưa làm | Gom 1 lần |
| 4 | `isSentByMe` trong FriendshipResponse | Logic/UX | 🟢 Thấp | ✅ Đã xong | Hoàn thành 30/05 (Sprint 3.2) |
| 5 | Thêm field `displayName` cho User | Logic/UX | 🟢 Thấp | ✅ Đã xong | Hoàn thành 30/05 (dùng field `name`, Sprint 3.3) |
| 6 | Tối ưu phân trang Search (aggregation pipeline) | Hiệu năng | 🟢 Thấp | 🔴 Chưa làm | Khi scale > 1000 users |
| 7 | StompBrokerRelay (RabbitMQ) cho scale lớn | Hạ tầng | 🟢 Thấp | 🔴 Chưa làm | Phase 7 (> 10 servers) |

### ✅ #1: MongoDB Replica Set + TransactionManager (ĐÃ HOÀN THÀNH 30/05)
- **Hiện trạng "nửa vời":** `@Transactional` ĐÃ viết trong `FriendshipService` (Sprint 3.1) nhưng CHƯA hoạt động thật do thiếu `MongoTransactionManager` Bean + MongoDB đang chạy standalone (không hỗ trợ transaction).
- **Rủi ro:** Method ghi DB nhiều lần mà lỗi giữa chừng → KHÔNG rollback được → dữ liệu sai lệch.
- **Đã làm:** (1) `docker-compose` chạy mongo `--replSet rs0` + healthcheck tự `rs.initiate()`; (2) thêm `MongoConfig` khai báo `MongoTransactionManager` Bean; (3) connection string thêm `?directConnection=true`. Đã verify replica set PRIMARY + transaction chạy thật.
- **Quyết định USER:** GIỮ `@Transactional` để đảm bảo ACID và sẵn sàng scale production.

### ✅ #2: `findAllByIds` chống N+1 Query (ĐÃ HOÀN THÀNH 30/05)
- **Vấn đề:** `UserRepository` chỉ có `findById`. Lấy danh sách 50 bạn = 1 + 50 = 51 queries.
- **Đã làm:** Thêm `List<User> findAllByIds(List<String> ids)` vào `UserRepository` + impl trong `UserRepositoryImpl` (dùng `MongoRepository.findAllById`) → gom còn 1 query. Sẵn sàng cho Sprint 3.2.

### � #4: `isSentByMe` trong FriendshipResponse (ĐÃ HOÀN THÀNH 30/05 - Sprint 3.2)
- **Vấn đề:** UI danh sách lời mời cần biết "mình gửi hay người ta gửi" để hiển thị nút đúng (Thu hồi vs Chấp nhận/Từ chối).
- **Đã làm:** Thêm `boolean sentByMe` vào `FriendshipResponse`, Service set dựa trên so sánh `requesterId` với user hiện tại. Đã verify qua test (sent→true, pending→false).

### 🟢 #5: Thêm field `displayName` cho User (ĐÃ HOÀN THÀNH 30/05 - Sprint 3.3)
- **Vấn đề:** `User` chỉ có `email/avatar/bio`, chưa có tên hiển thị → UI hiển thị email thiếu chuyên nghiệp + lộ thông tin riêng tư + không search được.
- **Đã làm:** Thêm field `name` (dùng tên `name` thay vì `displayName` để khớp Frontend đang gửi sẵn). Bắt buộc khi đăng ký, có index phục vụ search. Đồng thời sửa bug FE-BE mismatch làm mất tên.

### 🟢 #6: Tối ưu phân trang Search bằng Aggregation Pipeline
- **Bối cảnh:** API `GET /friends/search` (Sprint 3.3) thực hiện lọc (loại chính mình + ẩn người đã chặn mình) ở **tầng service - SAU** khi truy vấn DB theo tên. Do đó `totalElements` đếm theo số kết quả khớp tên (TRƯỚC khi lọc), có thể lệch nhẹ so với số phần tử thực tế hiển thị trong trang.
- **Ảnh hưởng:** KHÔNG đáng kể ở quy mô demo (~100 users). Chỉ cần xử lý khi scale lớn (> 1000 users) để con số phân trang chính xác tuyệt đối.
- **Giải pháp tương lai:** Chuyển sang **MongoDB Aggregation Pipeline** ($lookup friendships + $match loại trừ ngay trong DB) để lọc và đếm chính xác ở tầng database, tránh lệch `totalElements`.
- **Ghi chú:** Hạn chế này đã được comment rõ trong Javadoc của `FriendshipService.searchUsers()`.

### 🟢 #7: StompBrokerRelay (RabbitMQ) cho scale lớn (MỚI THÊM - từ AI Review)
- **Bối cảnh:** Hiện tại dùng SimpleBroker + Redis Pub/Sub (đã implement Phase 4.1). Giải pháp này đủ cho 2-10 backend servers.
- **Khi nào cần RabbitMQ:**
  - Khi có > 10 backend instances (high scale)
  - Cần message persistence (tin nhắn không mất khi server crash)
  - Group chat với routing logic phức tạp
- **Lợi ích:**
  - Better message routing at massive scale
  - Built-in message durability
  - Advanced routing patterns (topic exchange, fanout)
- **Trade-offs:**
  - Thêm infrastructure complexity (1-2 RabbitMQ nodes)
  - Chi phí hosting (~$20-50/tháng)
  - Cần config thêm STOMP relay endpoint
- **Kết luận:** Ưu tiên THẤP - chỉ làm Phase 7 khi thực sự cần. Redis Pub/Sub hiện tại đủ tốt cho dự án demo/portfolio.

### 🟡 #3: Đồng bộ `AppException` cho Post module (CHƯA LÀM)
- **Vấn đề:** `PostService`/`ReactionService`/`CommentService` dùng `RuntimeException` thô → rơi vào handler 9999 (HTTP 500), message tiếng Anh xấu.
- **Giải pháp:** Đổi sang `AppException(ErrorCode...)`. Bổ sung mã `POST_NOT_FOUND`, `COMMENT_NOT_FOUND` (vùng 3xxx) vào `ErrorCode`.

---

## 📝 CHANGELOG

| Version | Date | Changes |
|---------|------|---------|
| 2.7 | Jun 2026 | Hoàn tất review Sprint 4.2 và chuẩn bị Sprint 4.3. Bổ sung 2 improvement vào Sprint 4.3: (1) Redis TTL cho unread count (tránh memory leak khi user offline lâu), (2) ContentPreview helper method (sanitize HTML + truncate 100 chars). Thêm Tech Debt #7: StompBrokerRelay (RabbitMQ) - ưu tiên thấp, chỉ cần khi > 10 servers. Nguồn: AI review + Senior Architect validation. |
| 2.6 | Jun 2026 | Hoàn thành Sprint 4.1 (WebSocket Foundation + Redis Presence + JWT Blacklist). Redis lần đầu được dùng thật trong dự án với 2 use case: Presence TTL Online/Offline (35s + heartbeat 25s) và JWT Blacklist Access Token (TTL = remaining token lifetime). Benchmark trên máy dev: Redis EXISTS 0.019ms/lần vs MongoDB findOne 0.75ms/lần → nhanh hơn ~40x. Áp dụng Port-Adapter (`TokenBlacklistPort` ở `shared/security`) tuân thủ Clean Architecture. Bug fix ProfilePage crash khi 401. Pub/Sub chưa làm — để dành khi scale 2+ server. |
| 2.5 | May 2026 | Hoàn thành Sprint 3.4 (Friend Suggestions - Mutual Friends algorithm + UI sidebar data thật). PHASE 3 trọn vẹn 100%. |
| 2.4 | May 2026 | Hoàn thành UI Phase 3: module `friends` (FriendsPage 4 tab - Tìm kiếm/Bạn bè/Lời mời/Đã gửi), nút động theo relationshipStatus + Optimistic UI. Phase 3 XONG 100%. |
| 2.3 | May 2026 | Sprint 3.3 backend: fix bug FE-BE `name` + API Search (`/friends/search`) với enrich relationship status, loại self, ẩn người chặn. Ghi nhận Tech Debt #6 (tối ưu phân trang search). |
| 2.2 | May 2026 | Hoàn thành Sprint 3.2 (Friend List, Unfriend, Block/Unblock) + tích hợp `sentByMe` & batch-load chống N+1 |
| 2.1 | May 2026 | Hoàn thành Sprint 3.1 (Friend Request System) + Việt hóa toàn bộ message lỗi & Swagger. Ghi nhận 5 Tech Debt/cải tiến cần theo dõi. |
| 2.0 | May 2026 | Restructure to 7 Phases: Swap Phase 3↔4, Add Phase 5 (Notifications), Enhance Chat features |
| 1.0 | Apr 2026 | Initial 6 Phases roadmap |
