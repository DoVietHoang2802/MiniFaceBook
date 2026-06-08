# 🤝 SESSION HANDOFF - MiniFaceBook Project

## 📅 Cập nhật ngày: 08/06/2026
## 🏁 Trạng thái hiện tại: 🎉 PHASE 5 NOTIFICATION HOÀN THÀNH 100% + 🔑 FORGOT PASSWORD OTP 6 SỐ & REDIS CACHE HOÀN THÀNH + 🎨 AUTHENTICATION UI REFACTOR & A11Y COMPLIANT. Tổng tiến độ **~87%**. Hệ thống Authentication Forms đã chuyển hẳn sang theme sáng Slate Light Notion, loại bỏ 100% cảnh báo tiếp cận A11y, phân tách thành công mã lỗi `INVALID_CREDENTIALS` (1028) trên Backend và lưu vết Quy chuẩn giao tiếp 3 phần vào `AI_GUIDELINES.md`.

> ⚠️ **Lưu ý lộ trình (Version 2.0):** ROADMAP đã được tái cấu trúc thành **7 Phases**. Phase 3 (cũ là Realtime Chat) nay là **Social Graph & Friends**; Chat dời xuống Phase 4; bổ sung Phase 5 (Notification System & Security Flows). Chi tiết xem `ROADMAP.md`.

---

## 📋 TÓM TẮT PHIÊN LÀM VIỆC (08/06/2026 - SPRINT 5.6)

### Công việc đã thực hiện:

1. **Authentication Form UI Refactoring:** Chuyển đổi LoginForm, RegisterForm, ForgotPasswordForm từ phong cách xám đậm cũ sang theme sáng Slate Light đồng nhất với thiết kế của News Feed.
2. **Accessibility (A11y) Compliance:** Liên kết label và input bằng `htmlFor`/`id` trên toàn bộ các trường, bổ sung đầy đủ `aria-label`, `title`, và `placeholder` cho mảng 6 ô nhập OTP.
3. **Phân tách mã lỗi đăng nhập (Error Code Segregation):** Thêm mã lỗi `INVALID_CREDENTIALS` (1028) trong `ErrorCode.java` và throw đúng mã này trong `AuthService.java` khi đăng nhập sai mật khẩu, giúp hiển thị chuẩn xác thông báo lỗi thay vì "Phiên hết hạn".
4. **Cơ chế ghi nhớ phong cách giao tiếp:** Ghi trực tiếp quy tắc phản hồi 3 phần (Phân tích, Phương án, Hành động) vào file `AI_GUIDELINES.md` để lưu dấu vĩnh viễn cho các phiên làm việc sau.

### Files chính:
- `backend/src/main/java/com/minifacebook/shared/exception/ErrorCode.java`
- `backend/src/main/java/com/minifacebook/module/auth/application/service/AuthService.java`
- `frontend/src/modules/auth/components/{LoginForm.tsx, RegisterForm.tsx, ForgotPasswordForm.tsx}`
- `docs/guidelines/AI_GUIDELINES.md`


### Công việc đã thực hiện (Phase 5 Notification — Sprint 5.1→5.3 + triggers 5.4):

1. **Module Notification (Clean Architecture 4 lớp):** entity + `NotificationType` enum, port `NotificationRepository`, Mongo adapter (Document index `(recipientId, createdAt DESC)`), MapStruct mapper, `NotificationService`, listener, `NotificationController`.

2. **Event-driven decoupling:** `NotificationEvent` (shared) + `ApplicationEventPublisher`. Listener `@Async @TransactionalEventListener(AFTER_COMMIT)` — tạo thông báo sau commit, luồng nền. Self-guard `actorId==recipientId`. Redis cache `notif:unread:<userId>`.

3. **Realtime + UI:** push `/user/queue/notifications` qua `SimpMessagingTemplate`; `NotificationBell` (badge + dropdown + toast + Optimistic UI), badge sidebar đồng bộ.

4. **4 trigger:** LIKE (chỉ thả mới), COMMENT, FRIEND_REQUEST, FRIEND_ACCEPTED.

5. **Fix nợ kiến trúc Phase 4:** tách port `ChatEventPublisher` cho `ChatRedisPublisher` → ArchUnit pass 100%.

6. **Fix bug khi test:** (a) `webSocketService` tự re-subscribe khi reconnect (hết lỗi phải F5 sau restart); (b) MapStruct bỏ sót `isRead` (Lombok boolean+`@Builder`) → `@Mapping` + `@JsonProperty("isRead")` (fix đánh dấu đã đọc không lưu); (c) comment count đồng bộ optimistic CommentSection↔PostCard.

### Files chính:
- `backend/.../module/notification/**` (toàn bộ module mới)
- `backend/.../shared/event/NotificationEvent.java`, `infrastructure/config/AsyncConfig.java`
- `backend/.../module/chat/application/port/ChatEventPublisher.java` (+ publisher implement)
- `backend/.../module/{friendship,post}/application/service/*` (publish events)
- `frontend/src/modules/notification/**`, `frontend/src/App.tsx`, `frontend/src/modules/chat/services/webSocketService.ts`, `frontend/src/modules/post/components/{PostCard,CommentSection}.tsx`

### Known Issues / Chưa làm:
- **Chat unread badge realtime** (Sprint 5.4 cuối): tin nhắn mới → chấm đỏ trên nút Chats sidebar. Chưa wire.
- **Sound notification** (5.3 optional), **Email notification** (5.5) — chưa làm.
- **Feed/comment KHÔNG realtime** (đúng thiết kế): user B phải F5 để thấy comment/like count mới. Dự kiến làm realtime feed (topic `/topic/post.<id>`, chỉ subscribe bài đang mở) ở phiên sau.

### Bước tiếp theo (đã chốt với USER):
- ✅ **Realtime like/comment count cho feed** — ĐÃ XONG.
- ✅ **Chat unread badge realtime** (trigger 5/5 của 5.4) — ĐÃ XONG (chấm đỏ nút Chats sidebar, logic 2 luồng riêng).
- Còn lại Phase 5 (optional, làm khi cần): **sound notification** (5.3), **email notification** (5.5).
- Gợi ý tiếp theo: Phase 6 (Optimization, Testing coverage, CI/CD, Deployment).

---

## 📋 PHIÊN TRƯỚC (06/06/2026 — Phase 4 Chat)

### Công việc đã thực hiện (6 thay đổi):

1. **Chat UI Refactor** (`ChatPage.tsx`): Tái cấu trúc layout sang 2 cột mới với Stories carousel, Filter tabs (All/Unread/Groups/Requests), Search bar tròn, Input bar với icons (Emoji/Image/Mic), Chat header với icons (Search/Phone/Video/More).

2. **MongoDB Fix**: Xóa index sai `participants_unique_idx` (unique trên multikey array field `participantIds` → chặn user có >1 conversation). Đổi sang `participants_idx` (non-unique). Files: `ConversationDocument.java`, `Migration_20260605_AddChatIndexes.java`.

3. **Backend Fix**: Bỏ `@Transactional` khỏi 3 methods trong `ConversationService` (`getOrCreateConversation`, `getConversations`, `markAllAsSeen`) để fix WriteConflict trên single-node replica set khi có concurrent requests.

4. **Frontend Fix**: Di chuyển `onClearInitialRecipient()` vào `finally` block để ngăn infinite loop khi API call fails.

5. **Frontend Fix**: Thêm optional chaining `f.name?.toLowerCase()` trong `filteredFriends` để tránh crash khi friend object thiếu field name.

6. **Global CSS**: Thêm `html { font-size: 14px }` vào `index.css` để compact toàn bộ UI ~12%.

### Files đã sửa:
- `frontend/src/modules/chat/components/ChatPage.tsx`
- `backend/src/main/java/com/minifacebook/module/chat/application/service/ConversationService.java`
- `backend/src/main/java/com/minifacebook/module/chat/infrastructure/persistence/document/ConversationDocument.java`
- `backend/src/main/java/com/minifacebook/infrastructure/persistence/migration/Migration_20260605_AddChatIndexes.java`
- `frontend/src/index.css`

### Known Issues:
- **Duplicate conversation** (extremely rare): Race condition khi 2 user tạo conversation đồng thời. Code-level prevention đã có (DuplicateKeyException catch + retry). Khuyến nghị production: thêm field `participantKey` (sorted concat of IDs) với unique index.

### Bước tiếp theo (Phase 5 - Notification System):
- Notification Entity + Service (LIKE, COMMENT, FRIEND_REQUEST, FRIEND_ACCEPTED, NEW_MESSAGE)
- In-app notifications (bell + badge + dropdown)
- Realtime push qua WebSocket (tái dùng hạ tầng STOMP + Redis Pub/Sub đã có ở Phase 4)

---

## 🛑 MANDATORY PROTOCOLS (BẮT BUỘC TUÂN THỦ)
1. **Docs Over Skills:** Nếu Skill mâu thuẫn với Docs, AI PHẢI dừng lại, báo cáo USER và sửa Skill theo Docs. Tuyệt đối không tự ý làm sai lệch cấu trúc dự án.
2. **Anomaly Reporting:** Bất kỳ dấu hiệu bất thường nào (Lỗi Build, xung đột thư viện, mâu thuẫn logic) đều phải báo cáo ngay cho USER trước khi can thiệp.
3. **Architecture Guard:** Cấm phá vỡ quy tắc Clean Architecture. Phải chạy `mvn test` để kiểm tra `ArchitectureTest.java` sau mỗi thay đổi lớn ở Backend.
4. **Default UI/UX Skill:** Mặc định tự động kích hoạt và tuân thủ 100% cẩm nang [ui-ux-pro-max](file:///d:/Project_MiniFace/.antigravity/skills/ui-ux-pro-max/SKILL.md) và cẩm nang thiết kế [docs/guidelines/UI_UX_DESIGN.md](file:///d:/Project_MiniFace/docs/guidelines/UI_UX_DESIGN.md) cho tất cả các tác vụ liên quan đến giao diện, thiết kế, Frontend và CSS.
5. **Session Bootstrap Verification (Bắt buộc Khởi động Phiên):** AI ở lượt trả lời đầu tiên của phiên mới **bắt buộc** phải tuân thủ nghiêm ngặt **Luật 9.6 (AI_GUIDELINES.md)**, chạy lệnh đọc 5 tệp tài liệu cốt lõi (`README.md`, `docs/session/SESSION_HANDOFF.md`, `docs/planning/ROADMAP.md`, `docs/planning/PROGRESS.md`, `docs/guidelines/AI_GUIDELINES.md`) và in ra bảng **Startup Verification Table** tóm tắt mục tiêu phiên để chứng minh đã đọc, trước khi được làm bất kỳ việc gì khác.

---

### ✅ Công việc đã hoàn thành (Sprint 1.1 -> Sprint 4.5)

#### A. Backend (Spring Boot 3.x)
- **Domain Modeling & Persistence:** Thiết kế domain model `User` độc lập framework, triển khai `UserRepositoryImpl` mapping qua `UserDocument` lưu trong MongoDB.
- **High-Security Cookies:** Lưu trữ tokens qua **HttpOnly Cookie** (`accessToken` và `refreshToken`) chống nguy cơ tấn công XSS/CSRF.
- **Refresh Token Rotation & Anti-Replay:** Triển khai xoay vòng refresh token, thu hồi token cũ ngay khi sử dụng lại. Nếu phát hiện Replay Attack, hệ thống xóa sạch toàn bộ active tokens của user.
- **Xác thực Email qua Resend:** Tích hợp Resend Email API gửi link xác thực kích hoạt tài khoản (`/auth/verify?token=...`), bắt buộc kích hoạt trước khi cho phép đăng nhập.
- **Swagger Documentation:** Cập nhật 100% Swagger OpenAPI cho các endpoint xác thực.
- **ArchUnit & Security Auditing:** Sắp xếp phân lớp Clean Architecture đạt chuẩn 100% test case ArchUnit. Vá thành công lỗ hổng bảo mật vô hiệu hóa token trong database (`revoked: true`) khi người dùng logout.
- **Media Upload Bảo mật (Sprint 1.4):** Tích hợp Cloudinary kết hợp bộ quét nhị phân **Apache Tika (Magic Bytes)** ngăn chặn hoàn toàn việc tải lên file độc hại giả dạng đuôi ảnh. Thiết lập xử lý ngoại lệ `MaxUploadSizeExceededException` mượt mà cho file >5MB.
- **Tái cấu trúc Sạch - Shared Core (Sprint 1.4):** Tránh phụ thuộc chéo khi bước sang Phase 2 bằng cách đưa `MediaService` (Domain Interface) và `CloudinaryService` (Adapter) ra phân vùng `shared` dùng chung. Được xác thực hoàn toàn qua ArchUnit với 0 lỗi vi phạm.
- **Chat System (Phase 4 - HOÀN THÀNH 100%):** WebSocket STOMP + SockJS, Redis Presence/Pub/Sub, Conversation & Message CRUD, status SENT→DELIVERED→SEEN. **Sprint 4.4:** Typing Indicator (Redis TTL self-healing), Message Reactions (embedded Map 6 emoji), Reply (denormalized snapshot + jump-to-message), Media (upload Cloudinary/Tika, preview tray, nén). **Sprint 4.5:** Edit/Delete (2 chế độ, 15 phút), Infinite Scroll (DESC pagination + giữ scroll position).

#### B. Frontend (React 19 + Vite + TypeScript)
- **Kiến trúc Modular Phân Lớp:** Tổ chức dự án theo chuẩn với core, components, và modules nghiệp vụ khép kín.
- **Form & Zod Validations:** Thiết kế `LoginForm`, `RegisterForm` và `authSchema` đảm bảo lọc và chuẩn hóa dữ liệu sạch từ Client-side.
- **Silent Refresh & Axios Mutex Lock:** Triển khai Axios Client có Interceptor tự động xoay vòng Access Token ngầm.
- **Chat UI (Phase 4 - HOÀN THÀNH):** Layout 3 cột (conversations + chat + profile panel), Stories carousel, Filter tabs, real-time messaging Optimistic UI, STOMP WebSocket. Typing indicator, reactions picker, reply quote (+jump), media preview tray + progress, edit/delete menu, infinite scroll.

#### C. Kiến trúc & Hạ tầng
- **Modular Monolith** chạy trên 1 VPS duy nhất, MongoDB (chính) + Redis (Presence, JWT Blacklist, Unread Count, Pub/Sub).
- **MongoDB Replica Set (`rs0`)** hỗ trợ transactions.
- **Docker Compose** orchestration hoàn chỉnh.

---

### 🚀 Nhiệm vụ tiếp theo (Phase 6 - Navigation & Phase 7 - VPS Deployment)

- **Phase 6 - Navigation**: Thiết lập và tích hợp `react-router-dom` cho việc điều hướng trang động và deep-linking.
- **Phase 7 - VPS Deployment**: Deploy hệ thống (Spring Boot, MongoDB, Redis, React, Nginx) lên VPS thực tế.
- **Testing & Performance Optimization**: Tối ưu hóa hiệu suất load trang và viết các bài test tích hợp cho WebSocket.

---
*Ghi chú: Luôn giữ file `TESTING_GUIDE.md`, `PHASE_3_FRIENDS_TESTING.md` và `PHASE_4_CHAT_TESTING.md` cập nhật để đảm bảo tính sẵn sàng kiểm thử của hệ thống.*
