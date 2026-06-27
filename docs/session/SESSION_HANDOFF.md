# 🤝 SESSION HANDOFF - MiniFaceBook Project

## 📅 Cập nhật ngày: 27/06/2026
## 🏁 Trạng thái hiện tại: 🎉 SPRINT 6.2 HOÀN THÀNH (MockMvc Integration Tests, Redis Cache & Soft Delete Audit). Tổng tiến độ **~90%**.

> ⚠️ **Lưu ý lộ trình (Version 2.0):** ROADMAP đã được tái cấu trúc thành **7 Phases**. Phase 6 là **Navigation, Performance & Testing**; Phase 7 là **Deployment**. Chi tiết xem `ROADMAP.md`.

---

## 📋 TÓM TẮT PHIÊN LÀM VIỆC (27/06/2026 - INTEGRATION TESTING, REDIS CACHE & SOFT DELETE AUDIT)

### Công việc đã thực hiện:

1. **MockMvc Integration Testing**:
   * Phát triển `PostIntegrationTest.java` bao phủ toàn bộ vòng đời của Bài viết: Tạo bài viết -> Thả cảm xúc -> Thêm bình luận -> Xóa mềm bình luận -> Xóa mềm bài viết.
   * Phát triển `MessageIntegrationTest.java` bao phủ luồng Chat: Gửi tin nhắn -> Đánh dấu delivered -> Sửa nội dung tin nhắn -> Thu hồi/xóa mềm tin nhắn.
   * Cả 2 kiểm thử tích hợp sử dụng `MockMvc` chạy hoàn chỉnh trên cơ sở dữ liệu MongoDB và Redis.
   * Toàn bộ test suite backend đạt kết quả **34/34 tests PASS (100%)**.

2. **Audit và Verify Caching & Soft Delete**:
   * Kiểm chứng cơ chế Soft Delete bài viết (Phase 2) và tin nhắn (Sprint 4.5) hoạt động chính xác ở cả tầng Service và Database.
   * Kiểm chứng Redis Caching cho Profile người dùng (`AuthService`) và danh sách bạn bè (`FriendshipService`) chạy ổn định, tự động làm sạch (evict) khi cập nhật dữ liệu.

3. **Cập nhật Tài liệu & STAR Highlights**:
   * Đồng bộ và đánh dấu hoàn thành Sprint 6.2 trong `ROADMAP.md` và `PROGRESS.md`.
   * Thêm Highlight 45 (STAR format) vào tệp tin `CV_PORTFOLIO_HIGHLIGHTS.md`.

### Files chính:
- `backend/src/test/java/com/minifacebook/module/post/presentation/PostIntegrationTest.java`
- `backend/src/test/java/com/minifacebook/module/chat/presentation/MessageIntegrationTest.java`
- `docs/planning/ROADMAP.md`
- `docs/planning/PROGRESS.md`
- `docs/guidelines/CV_PORTFOLIO_HIGHLIGHTS.md`
- `docs/session/SESSION_HANDOFF.md`

---

## 📋 TÓM TẮT PHIÊN LÀM VIỆC (26/06/2026 - MODAL REDESIGN & SSE & UX FIXES & COMMENT DELETION)

### Công việc đã thực hiện:

1. **Split-Pane Post Detail Modal (Facebook-style Viewer):**
   * Thay vì hiển thị bình luận ngay dưới bài viết ở trang chủ gây giật khung hình, khi nhấn "Bình luận", hệ thống mở một Modal chia đôi màn hình (Split-pane) hiện đại.
   * **Bài viết có ảnh:** Cột trái hiển thị ảnh rộng căn giữa với nền đen, hỗ trợ chuyển slide ảnh mượt mà. Cột phải là bình luận và thông tin tác giả.
   * **Bài viết không ảnh:** Cột trái hiển thị khung màu tím khói thanh lịch thương hiệu Hizo (`bg-[#F4F0FD]`), chữ trích dẫn tím sẫm (`text-[#3F2E60]`) kèm ký tự trích dẫn nghệ thuật (`“`/`”`). Cột phải là bình luận.
   * **Responsive:** Cột trang trí bên trái tự động ẩn trên thiết bị di động (`hidden md:flex`) để tối ưu hóa diện tích hiển thị.
   * **Độ mờ nền (Backdrop Blur):** Tinh chỉnh độ mờ nền vừa phải (`backdrop-blur-[6px] bg-slate-950/50`) giúp nhìn nhẹ nhàng bố cục trang chủ bên dưới.

2. **Gia cố & Tối ưu hóa Real-time SSE:**
   * Khắc phục lỗi trình duyệt bị giới hạn kết nối (SSE Connection Limit) khi mở nhiều bài viết. Tích hợp cơ chế đăng ký SSE linh hoạt trên Backend và tối ưu hóa việc quản lý luồng ngầm trên Frontend.

3. **Sửa lỗi lọt sự kiện Hover cảm xúc (Reaction Scoping UX Fix):**
   * Di chuyển sự kiện `onMouseEnter`/`onMouseLeave` của bảng chọn cảm xúc ra khỏi khung chứa lớn. Bây giờ chỉ khi rê chuột trực tiếp vào **nút "Thích" (Like)** thì bảng chọn cảm xúc mới hiển thị, không bị hiện nhầm khi rê chuột qua nút "Bình luận" hay "Chia sẻ". Sửa đồng bộ ở cả `PostCard.tsx` và `PostDetailModal.tsx`.

4. **Xóa bình luận Realtime qua SSE:**
   * Triển khai sự kiện truyền thông tin xóa bình luận realtime qua SSE. Khi một bình luận bị xóa, Backend sẽ phát sự kiện kèm cờ `deleted: true`. Client bắt được sự kiện này sẽ tự động loại bỏ bình luận khỏi cache dữ liệu hiển thị (React Query) của bài viết tương ứng mà không cần tải lại toàn trang.

5. **Khắc phục hoàn toàn lỗi Accessibility (A11y):**
   * Bổ sung đầy đủ các thuộc tính `title` và `aria-label` cho tất cả các nút đóng modal (`X`), nút điều hướng ảnh, giúp giải quyết triệt để cảnh báo khả năng tiếp cận và đảm bảo dự án build thành công 100% không lỗi lầm.

### Files chính:
- `frontend/src/modules/post/components/PostDetailModal.tsx`
- `frontend/src/modules/post/components/PostCard.tsx`
- `frontend/src/modules/post/components/CommentSection.tsx`
- `backend/src/main/java/com/minifacebook/module/post/application/service/CommentService.java`
- `docs/session/SESSION_HANDOFF.md`

---

## 📋 TÓM TẮT PHIÊN LÀM VIỆC (12/06/2026 - CHAT HARDENING & ACCESSIBILITY FIXES)

### Công việc đã thực hiện:

1. **Review 1 - Frontend Rollback Optimistic UI:** Gia cố ChatPage.tsx để tự khôi phục trạng thái cũ khi edit message, delete me, hoặc delete everyone thất bại. Tránh tình trạng UI báo đã xóa/sửa nhưng backend reject do hết hạn 15 phút, mất mạng hoặc hết phiên.
2. **Review 2 - Backend Unit Tests:** Mở rộng MessageServiceTest.java thêm các kịch bản: owner-only, text-only, cửa sổ 15 phút, deletedFor, soft delete cho mọi người, và lọc tin nhắn đã xóa riêng.
3. **Accessibility (A11y) Linter Fixes:** Bổ sung thuộc tính `title` mô tả hành động cho các thẻ `<input type="file" className="hidden" />` trong `CreatePostCard.tsx` (dòng 163) và `ProfilePage.tsx` (dòng 300), giải quyết triệt để lỗi đỏ của A11y Linter.
4. **Dọn dẹp Warnings Backend:** Xóa bỏ các `import` thư viện thừa không sử dụng tại `ConversationService.java`, `NotificationEventListener.java`, và `MessageServiceTest.java`.
5. **Verify:** Chạy `mvn test` PASS 18/18 tests thành công trên Backend.

### Files chính:
- `frontend/src/modules/chat/components/ChatPage.tsx`
- `frontend/src/modules/post/components/CreatePostCard.tsx`
- `frontend/src/modules/profile/components/ProfilePage.tsx`
- `backend/src/main/java/com/minifacebook/module/chat/application/service/ConversationService.java`
- `backend/src/main/java/com/minifacebook/module/notification/application/listener/NotificationEventListener.java`
- `backend/src/test/java/com/minifacebook/module/chat/application/service/MessageServiceTest.java`
- `docs/planning/PROGRESS.md`
- `docs/planning/ROADMAP.md`

---
## 📋 TÓM TẮT PHIÊN LÀM VIỆC (08/06/2026 - SPRINT 5.7)

### Công việc đã thực hiện:

1. **Dashboard Localization (Việt hóa toàn diện):**
   * Sidebar bên trái: Dịch toàn bộ sang tiếng Việt (Khám phá, Bạn bè, Cộng đồng, Trò chuyện, Thông báo, Bộ sưu tập, Trang cá nhân, Cài đặt).
   * Thanh tìm kiếm: Placeholder đổi thành "Tìm kiếm bạn bè, bài viết, cộng đồng...".
   * Widgets bên phải: Việt hóa "Chủ đề xu hướng", "Gợi ý kết bạn", nút "Xem tất cả", "Kết bạn", "Xem thêm".
   * Khung tạo bài viết (`CreatePostCard`): Đổi placeholder "Bạn đang nghĩ gì thế...?" và dịch các nút "Ảnh / Video", "Cảm xúc", "Check-in", "Bình chọn", "Đăng bài".
   * Landing & Footer: Việt hóa các nhãn tính năng nổi bật của Vizo cùng dòng bản quyền ở footer.
2. **Sửa lỗi độ tương phản (Contrast Fix) trên ProfilePage:**
   * Thay đổi class tiêu đề "Kéo & Thả ảnh đại diện" từ `text-white` sang `text-slate-800` để tránh bị ẩn trên nền sáng.
   * Tái thiết kế vùng kéo thả ảnh (Drag & Drop box) từ theme dark-mode cũ sang phong cách Slate Light đồng nhất (`border-slate-200`, `bg-slate-50/50`, `text-slate-600`), nâng cao trải nghiệm A11y.

### Files chính:
- `frontend/src/App.tsx`
- `frontend/src/modules/post/components/CreatePostCard.tsx`
- `frontend/src/modules/profile/components/ProfilePage.tsx`
- `docs/planning/PROGRESS.md`
- `docs/planning/ROADMAP.md`

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
