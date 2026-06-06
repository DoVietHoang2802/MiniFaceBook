# 🤝 SESSION HANDOFF - MiniFaceBook Project

## 📅 Cập nhật ngày: 06/06/2026
## 🏁 Trạng thái hiện tại: 🏆 PHASE 4 REALTIME CHAT HOÀN THÀNH 100% (Sprint 4.1→4.5). Tổng tiến độ **~90%**. Chat đầy đủ tính năng: WebSocket+Redis, status SENT/DELIVERED/SEEN, Typing Indicator, Reactions, Reply (+jump), Media (preview tray), Edit/Delete (15 phút), Infinite Scroll. Tiếp theo: **Phase 5 - Notification System** (thông báo realtime cho like/comment/friend/message).

> ⚠️ **Lưu ý lộ trình (Version 2.0):** ROADMAP đã được tái cấu trúc thành **7 Phases**. Phase 3 (cũ là Realtime Chat) nay là **Social Graph & Friends**; Chat dời xuống Phase 4; bổ sung Phase 5 (Notification System). Chi tiết xem `ROADMAP.md`.

---

## 📋 TÓM TẮT PHIÊN LÀM VIỆC (06/06/2026)

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

### Bước tiếp theo (Sprint 4.4 - Chat UX Enhancements):
- Typing Indicator (WebSocket broadcast "user is typing...")
- Read Receipts UI (hiển thị avatar nhỏ dưới tin nhắn đã seen)
- Media Messages (gửi ảnh/file trong chat qua Cloudinary)

---

## 🛑 MANDATORY PROTOCOLS (BẮT BUỘC TUÂN THỦ)
1. **Docs Over Skills:** Nếu Skill mâu thuẫn với Docs, AI PHẢI dừng lại, báo cáo USER và sửa Skill theo Docs. Tuyệt đối không tự ý làm sai lệch cấu trúc dự án.
2. **Anomaly Reporting:** Bất kỳ dấu hiệu bất thường nào (Lỗi Build, xung đột thư viện, mâu thuẫn logic) đều phải báo cáo ngay cho USER trước khi can thiệp.
3. **Architecture Guard:** Cấm phá vỡ quy tắc Clean Architecture. Phải chạy `mvn test` để kiểm tra `ArchitectureTest.java` sau mỗi thay đổi lớn ở Backend.
4. **Default UI/UX Skill:** Mặc định tự động kích hoạt và tuân thủ 100% cẩm nang [ui-ux-pro-max](file:///d:/Project_MiniFace/.antigravity/skills/ui-ux-pro-max/SKILL.md) và cẩm nang thiết kế [docs/guidelines/UI_UX_DESIGN.md](file:///d:/Project_MiniFace/docs/guidelines/UI_UX_DESIGN.md) cho tất cả các tác vụ liên quan đến giao diện, thiết kế, Frontend và CSS.
5. **Session Bootstrap Verification (Bắt buộc Khởi động Phiên):** AI ở lượt trả lời đầu tiên của phiên mới **bắt buộc** phải tuân thủ nghiêm ngặt **Luật 9.6 (AI_GUIDELINES.md)**, chạy lệnh đọc 5 tệp tài liệu cốt lõi (`README.md`, `docs/session/SESSION_HANDOFF.md`, `docs/planning/ROADMAP.md`, `docs/planning/PROGRESS.md`, `docs/guidelines/AI_GUIDELINES.md`) và in ra bảng **Startup Verification Table** tóm tắt mục tiêu phiên để chứng minh đã đọc, trước khi được làm bất kỳ việc gì khác.

---

### ✅ Công việc đã hoàn thành (Sprint 1.1 -> Sprint 4.3)

#### A. Backend (Spring Boot 3.x)
- **Domain Modeling & Persistence:** Thiết kế domain model `User` độc lập framework, triển khai `UserRepositoryImpl` mapping qua `UserDocument` lưu trong MongoDB.
- **High-Security Cookies:** Lưu trữ tokens qua **HttpOnly Cookie** (`accessToken` và `refreshToken`) chống nguy cơ tấn công XSS/CSRF.
- **Refresh Token Rotation & Anti-Replay:** Triển khai xoay vòng refresh token, thu hồi token cũ ngay khi sử dụng lại. Nếu phát hiện Replay Attack, hệ thống xóa sạch toàn bộ active tokens của user.
- **Xác thực Email qua Resend:** Tích hợp Resend Email API gửi link xác thực kích hoạt tài khoản (`/auth/verify?token=...`), bắt buộc kích hoạt trước khi cho phép đăng nhập.
- **Swagger Documentation:** Cập nhật 100% Swagger OpenAPI cho các endpoint xác thực.
- **ArchUnit & Security Auditing:** Sắp xếp phân lớp Clean Architecture đạt chuẩn 100% test case ArchUnit. Vá thành công lỗ hổng bảo mật vô hiệu hóa token trong database (`revoked: true`) khi người dùng logout.
- **Media Upload Bảo mật (Sprint 1.4):** Tích hợp Cloudinary kết hợp bộ quét nhị phân **Apache Tika (Magic Bytes)** ngăn chặn hoàn toàn việc tải lên file độc hại giả dạng đuôi ảnh. Thiết lập xử lý ngoại lệ `MaxUploadSizeExceededException` mượt mà cho file >5MB.
- **Tái cấu trúc Sạch - Shared Core (Sprint 1.4):** Tránh phụ thuộc chéo khi bước sang Phase 2 bằng cách đưa `MediaService` (Domain Interface) và `CloudinaryService` (Adapter) ra phân vùng `shared` dùng chung. Được xác thực hoàn toàn qua ArchUnit với 0 lỗi vi phạm.
- **Chat System (Phase 4):** WebSocket STOMP + SockJS, Redis Presence/Pub/Sub, Conversation & Message CRUD, real-time delivery với status transitions (SENT→DELIVERED→SEEN), DuplicateKeyException catch chống race condition.

#### B. Frontend (React 19 + Vite + TypeScript)
- **Kiến trúc Modular Phân Lớp:** Tổ chức dự án theo chuẩn với core, components, và modules nghiệp vụ khép kín.
- **Form & Zod Validations:** Thiết kế `LoginForm`, `RegisterForm` và `authSchema` đảm bảo lọc và chuẩn hóa dữ liệu sạch từ Client-side.
- **Silent Refresh & Axios Mutex Lock:** Triển khai Axios Client có Interceptor tự động xoay vòng Access Token ngầm.
- **Chat UI (Phase 4):** 2-column layout Facebook Messenger style, Stories carousel, Filter tabs, real-time messaging với Optimistic UI, STOMP WebSocket integration.

#### C. Kiến trúc & Hạ tầng
- **Modular Monolith** chạy trên 1 VPS duy nhất, MongoDB (chính) + Redis (Presence, JWT Blacklist, Unread Count, Pub/Sub).
- **MongoDB Replica Set (`rs0`)** hỗ trợ transactions.
- **Docker Compose** orchestration hoàn chỉnh.

---

### 🚀 Nhiệm vụ tiếp theo (Sprint 4.4 - Chat UX Enhancements)

- **Typing Indicator:** Broadcast event "user is typing" qua WebSocket, hiển thị animation "..." trong chat.
- **Read Receipts UI:** Avatar nhỏ dưới tin nhắn đã seen (giống Messenger).
- **Media Messages:** Gửi ảnh/file trong chat, upload qua Cloudinary, preview inline.
- Sprint 4.5: Message Management (edit/delete, infinite scroll).

---
*Ghi chú: Luôn giữ file `TESTING_GUIDE.md`, `PHASE_3_FRIENDS_TESTING.md` và `PHASE_4_CHAT_TESTING.md` cập nhật để đảm bảo tính sẵn sàng kiểm thử của hệ thống.*
