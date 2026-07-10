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
- [x] **Sprint 4.3: Messaging Logic & Realtime Delivery**
    - [x] **WebSocket Message Controller** - Nhận tin nhắn qua STOMP `/app/chat.send`.
        - *Flow:* Client send → Backend validate → Save DB → Update Conversation lastMessage → Emit to recipient qua Redis Pub/Sub.
    - [x] **Message Status Transition (giống Facebook Messenger):**
        - **SENT** ✓: Message có `createdAt` (đã lưu DB).
        - **DELIVERED** ✓✓: Recipient online → Backend emit qua WebSocket → Recipient client nhận được → gọi callback set `deliveredAt`.
            - *Implementation:* WebSocket `/user/{recipientId}/queue/messages` → Client auto-ack → REST `PUT /messages/{id}/delivered`.
        - **SEEN** 👁️: User mở conversation → Frontend gọi `PUT /conversations/{id}/seen` → Backend set `seenAt` cho all messages → Emit WebSocket đến sender.
    - [x] **Optimistic UI (Frontend):**
        - Tin nhắn hiển thị ngay with status PENDING (⏱️) → Server response → update status SENT (✓).
        - Nếu fail → hiển thị ❌ + nút retry.
    - [x] **Redis Pub/Sub Integration:**
        - Channel pattern: `chat.room.<conversationId>`.
        - Message format: `{type: "NEW_MESSAGE", data: MessageResponse}`.
        - All servers subscribe → broadcast đến WebSocket sessions của participants.
    - [x] **Redis Unread Count với TTL** (từ AI review - tránh memory leak):
        - Khi gửi tin nhắn mới → increment unread count cho recipient.
        - Set TTL 7 ngày: `redisTemplate.expire(key, 7, TimeUnit.DAYS)`.
        - Key pattern: `unread:<conversationId>:<recipientId>`.
    - [x] **ContentPreview Helper** (từ AI review - XSS prevention + truncate):
        - Sanitize HTML tags: `content.replaceAll("<[^>]*>", "")`.
        - Truncate về 100 chars (97 + "...").
        - Handle IMAGE/FILE type với placeholder: "📷 Đã gửi một ảnh", "📎 Đã gửi một file".
- [ ] **Sprint 4.4: Chat UX Enhancements**

    > **📌 Thứ tự triển khai (đã chốt với USER):** Làm tăng dần độ phức tạp, tận dụng hạ tầng sẵn có. **Media làm CUỐI CÙNG** — chỉ bắt đầu sau khi 3 tính năng kia chạy thành công.
    > **Quy tắc:** Mỗi tính năng phải chạy & test thành công (kết quả thực tế) trước khi chuyển sang tính năng kế tiếp.

    - [x] **① Typing Indicator** — *(Ưu tiên 1: quick win, không động DB)* ✅ **HOÀN THÀNH**
        - [x] Emit typing event qua WebSocket STOMP `/app/chat.typing`, throttle 2s phía client.
        - [x] Hiển thị "Đang nhập..." (3 nơi: chat header, bubble 3 chấm nhảy, preview conversation list).
        - [x] 🆕 **CẢI TIẾN (USER duyệt):** Dùng **Redis TTL key** `typing:<convId>:<userId>` (TTL 4s) thay vì chỉ dựa WebSocket event thuần.
            - *Lý do:* Nếu user đóng tab / mất mạng đột ngột, indicator **tự biến mất khi key expire** → không bị kẹt "đang nhập" mãi mãi.
            - *Đồng bộ:* Tái sử dụng pattern **Presence TTL** đã làm ở Sprint 4.1 (nhất quán kiến trúc).
            - *Client:* auto-clear indicator sau 5s nếu không nhận thêm event (double-safety).
        - [x] **Cascade 4 mốc thời gian** (đã chốt với USER): throttle **2s** < stop-timer **3s** < Redis TTL **4s** < client auto-clear **5s**. Thứ tự tăng dần để mỗi lớp dự phòng lớp trước, tránh nhấp nháy.
            - *Vì sao stop-timer (3s) > throttle (2s)?* Khi gõ liên tục, ping mới mỗi 2s luôn reset stop-timer trước khi nó kịp bắn → indicator không tắt oan giữa lúc đang gõ. Stop chỉ bắn khi thực sự ngừng ≥3s.
        - [x] Cleanup timers khi unmount + auto-scroll khi đối phương bắt đầu gõ.
        - [x] **Verify:** Backend compile PASS, Frontend diagnostics 0 lỗi. Test thực tế 2 trình duyệt: typing hiện/ẩn đúng, đóng tab tự hết kẹt.

    - [x] **② Message Reactions** — *(Ưu tiên 2: reuse logic Phase 2)* ✅ **HOÀN THÀNH**
        - [x] React emoji cho từng tin nhắn (❤️ 👍 😂 😮 😢 😡) qua STOMP `/app/chat.react`.
        - [x] 🆕 **Quyết định thiết kế:** Dùng **embedded Map<userId, emoji>** trong Message (KHÁC Post dùng collection riêng).
            - *Lý do:* Chat 1-1 tối đa 2 người react/tin → embed tối ưu (load cùng message, atomic, không cần phân trang). Post có hàng trăm reaction nên mới cần collection riêng + pagination.
        - [x] Toggle logic: thả lại đúng emoji đang có → gỡ; emoji khác → thay; chưa có → thêm.
        - [x] Emit realtime qua Redis Pub/Sub (type "REACTION") → `/user/queue/reactions` cho cả 2 participant (đồng bộ đa thiết bị). Gửi nguyên map đầy đủ → client chỉ replace, không tính delta.
        - [x] Frontend: Optimistic UI (cập nhật local ngay), nút 😊 hover, picker 6 emoji, badge ở góc bong bóng, overlay click-outside.
        - [x] **Verify:** Backend compile PASS, Frontend diagnostics 0 lỗi.

    - [x] **③ Reply to Message** — *(Ưu tiên 3)* ✅ **HOÀN THÀNH**
        - [x] Thêm value object `ReplyPreview` (denormalized snapshot) + field `replyTo` vào Message/Document/Response; `replyToMessageId` vào SendRequest.
        - [x] 🆕 **Quyết định thiết kế:** Lưu **snapshot** tin gốc (messageId + senderName + contentPreview) thay vì chỉ ID.
            - *Lý do:* Hiển thị quote ngay khi load danh sách mà không query thêm (tránh N+1, cùng nguyên tắc `LastMessageSummary`). Nếu tin gốc bị sửa/xóa sau, quote giữ nội dung tại thời điểm reply (đúng hành vi Messenger).
        - [x] Backend validate tin gốc cùng conversation (chống reply chéo), helper `buildShortPreview` (≤80 ký tự, placeholder ảnh/file).
        - [x] Frontend: state `replyingTo`, Optimistic UI (giữ replyTo khi server không trả về), banner "Đang trả lời" trên input, nút Reply hover, **quote tách phía trên bong bóng màu trung tính** (dễ đọc trên mọi nền, giống Messenger/Zalo).
        - [x] **Verify:** Backend compile PASS, FE 0 lỗi, test 2 trình duyệt OK.

    - [x] **④ Media in Chat (ẢNH) — LÀM CUỐI CÙNG** ✅ **HOÀN THÀNH**
        - [x] Gửi ảnh trong tin nhắn — `MessageType.IMAGE` + `mediaUrl`. REST `POST /conversations/{id}/messages/image` (multipart).
        - [x] **Reuse:** `MediaService.uploadAvatar()` (Cloudinary + Apache Tika magic-bytes scan từ Phase 1) + tái dùng luôn `sendMessage` type=IMAGE → ít code, atomic, tự có Pub/Sub realtime + reply.
        - [x] 🆕 **Optimistic UI blob preview** — hiển thị ảnh GỐC local ngay (`URL.createObjectURL`) → user luôn thấy đúng ảnh, **tránh "ảnh khác"**.
        - [x] 🆕 **Upload progress bar** overlay % trên ảnh.
        - [x] 🆕 **Nén thông minh**: skip GIF, skip file <1MB, `preserveExif`, nén WebP cho ảnh lớn.
        - [x] 🆕 **Preview tray giống Messenger** — thumbnail tối đa 4, nút X xóa, nút + thêm, KHÔNG auto-gửi, gửi ảnh + text cùng lúc.
        - [x] 🆕 **Click quote → nhảy tới tin gốc** (giống Facebook) + highlight viền tím 1.6s.
        - [x] **Bug fix:** race REST vs WebSocket echo gây trùng ảnh → dedup theo id trước + match optimistic ảnh theo type.
        - [x] **Verify:** Backend compile PASS, FE 0 lỗi. Sandbox fallback (cloud `demo`→picsum) test không cần key thật.
- [x] **Sprint 4.5: Message Management** ✅ **HOÀN THÀNH**
    - [x] **Delete Message** ✅ — Soft delete 2 chế độ: "Xóa cho riêng tôi" (field `deletedFor` Set, ẩn phía mình, không báo người khác) và "Thu hồi với mọi người" (`deleted` flag, chỉ sender, trong 15 phút, realtime).
    - [x] **Edit Message** ✅ — Sửa tin TEXT, chỉ sender, trong 15 phút; nhãn "(đã chỉnh sửa)"; realtime qua event UPDATE.
        - [x] Backend: `editMessage`/`deleteMessage` service + `PUT /messages/{id}` + `DELETE /messages/{id}?scope=` + 4 error code (3007-3010) + `MessageUpdateEvent` Pub/Sub type "UPDATE" → `/user/queue/updates`.
        - [x] Frontend: Optimistic UI, hover Pencil (sửa) + Trash (menu me/everyone, mở lên trên), banner "Đang chỉnh sửa", placeholder "Tin nhắn đã được thu hồi".
        - [x] **Perf fix:** tắt verbose STOMP debug logging (`console.log` mọi frame) → hết lag khi mở DevTools.
    - [x] **Infinite Scroll** ✅ — Load tin cũ khi cuộn lên, giữ scroll position.
        - [x] Backend: `getMessages` sort DESC (page 0 = mới nhất), page size 15.
        - [x] Frontend: load 15 tin mới nhất → reverse hiển thị cũ→mới; cuộn lên đầu (`scrollTop < 80`) → tải page kế → prepend; **giữ vị trí cuộn** bằng `useLayoutEffect` đo chênh lệch `scrollHeight` (không nháy/nhảy); spinner đầu khung; lọc trùng id; dừng khi hết tin.
        - [x] **Quyết định:** dùng scroll-height-diff thay vì virtualization (đủ cho quy mô demo, đơn giản, không cần thư viện).
    - [x] **Verify:** Backend compile PASS, FE 0 lỗi, test thực tế cuộn mượt không nhảy.

---

## � PHASE 5: NOTIFICATION SYSTEM 🚧 (~90% — 5.1→5.4 xong, còn sound 5.3 + email 5.5 optional)
*Mục tiêu: Thông báo realtime cho mọi tương tác trong hệ thống.*
*Lý do tách riêng: Notification là cross-cutting concern, dùng chung cho nhiều module.*

- [x] **Sprint 5.1: Notification Infrastructure** ✅ *(HOÀN THÀNH — theo logic Facebook/Zalo)*

    > **🎯 NGUYÊN TẮC: 2 luồng riêng biệt (giống Facebook/Zalo)**
    > - **Chat unread** → 🔴 chấm đỏ/badge trên nút **Chats** (sidebar), KHÔNG vào notification center. (Đã có sẵn `unreadCount` ở Phase 4, cần wire realtime badge ra nav — *để 5.4*.)
    > - **Notification center** (🔔 chuông) → CHỈ chứa: LIKE, COMMENT, FRIEND_REQUEST, FRIEND_ACCEPTED. **KHÔNG có NEW_MESSAGE** (tránh trùng lặp với chat unread).

    - [x] Thiết kế **Notification Entity** (domain POJO + `NotificationType` enum).
        - *Fields:* `recipientId`, `actorId`, `type`, `entityId`, `content`, `isRead`, `createdAt`.
        - *Types:* `LIKE`, `COMMENT`, `FRIEND_REQUEST`, `FRIEND_ACCEPTED`.
        - *Indexes:* compound `(recipientId, createdAt DESC)` cho list; đếm unread qua `countByRecipientIdAndReadFalse`.
    - [x] 🆕 **Event-driven decoupling:** `NotificationEvent` (shared) + `ApplicationEventPublisher`; listener `@Async @TransactionalEventListener(AFTER_COMMIT)` → chỉ tạo thông báo sau khi giao dịch nguồn commit (tránh thông báo "ma" khi rollback), chạy luồng nền không chặn request gốc. Module Post/Friendship chỉ `publishEvent(...)` → ArchUnit pass.
    - [x] Tạo **NotificationService**: `createNotification` (kèm **self-guard** `actorId == recipientId`), `markAsRead`, `markAllAsRead` (updateMulti), `getUnreadCount`.
    - [x] 🆕 **Redis unread cache** `notif:unread:<userId>` (TTL 1 ngày) — đếm nhanh, invalidate khi có thông báo mới / mark-read.
    - [x] Tạo **NotificationRepository** (port) + Mongo adapter + Document + MapStruct mapper (chuẩn 4 lớp). *(Lưu ý: ép `@Mapping isRead` vì Lombok boolean `isXxx` + `@Builder` làm MapStruct bỏ sót.)*
    - [x] 🆕 **Tái dùng realtime infra Phase 4:** push trực tiếp qua `SimpMessagingTemplate` → `/user/queue/notifications`. Tách port `ChatEventPublisher` cho `ChatRedisPublisher` → fix nợ ArchUnit Phase 4 (application không phụ thuộc infra).
    - [x] **AsyncConfig** (`@EnableAsync` + thread pool `taskExecutor`).
- [x] **Sprint 5.2: In-App Notifications** ✅
    - [x] API Lấy danh sách notifications (`GET /notifications`) - Có phân trang (mới nhất trước).
    - [x] API Đánh dấu đã đọc (`PUT /notifications/{id}/read`).
    - [x] API Đánh dấu tất cả đã đọc (`PUT /notifications/read-all`).
    - [x] API Lấy số lượng chưa đọc (`GET /notifications/unread-count`).
    - [x] Giao diện **Notification Bell** với badge count (đồng bộ cả badge sidebar).
    - [x] Giao diện **Notification Dropdown** với danh sách (icon theo loại, thời gian tương đối, chấm chưa đọc, "đánh dấu tất cả đã đọc", Optimistic UI).
- [x] **Sprint 5.3: Realtime Push Notifications** ✅
    - [x] Tích hợp WebSocket từ Phase 4 để push notification realtime.
    - [x] Emit notification qua STOMP `/user/queue/notifications`.
    - [x] Frontend: Subscribe + hiển thị toast khi nhận + tăng badge realtime.
    - [x] 🆕 **Fix re-subscribe on reconnect:** `webSocketService` ghi nhớ intents và tự đăng ký lại mỗi lần (re)connect → không còn "chết kênh" phải F5 sau khi server restart (áp dụng cho cả chat).
    - [x] **Sound notification** (optional): Phát âm thanh khi có thông báo mới (đã tích hợp chuông báo Facebook và tiếng tin nhắn Messenger chuẩn).
- [x] **Sprint 5.4: Notification Triggers Integration** ✅ *(5/5 HOÀN THÀNH)*
    - [x] Trigger notification khi có **Like** bài viết — `ReactionService` publish `NotificationEvent` (chỉ khi thả MỚI, không bắn khi gỡ).
    - [x] Trigger notification khi có **Comment** bài viết — `CommentService` publish `NotificationEvent`.
    - [x] Trigger notification khi có **Friend Request** — `FriendshipService.sendRequest` publish event.
    - [x] Trigger notification khi **Friend Request được chấp nhận** — `FriendshipService.acceptRequest` publish event.
    - [x] **Tin nhắn mới (Phase 4) → chấm đỏ badge nút Chats sidebar** (KHÔNG vào notification center). Backend: `MessageService` bắn tín hiệu `CHAT_UNREAD` tới người nhận, `markAllAsSeen` bắn tới chính mình; `GET /conversations/unread/total`. Frontend: hook `useChatUnread` (fetch tổng + subscribe `/user/queue/chat-unread` → refetch số chính xác), badge số đỏ trên nút Chats. **Hoàn tất logic 2 luồng riêng giống Messenger.**
- [ ] **Sprint 5.5: Email Notifications (Optional)**
    - [ ] Tái sử dụng **Resend Service** từ Phase 1.
    - [ ] Gửi email khi có Friend Request (nếu user offline > 24h).
    - [ ] Gửi email digest hàng tuần (tổng hợp hoạt động).
    - [ ] API cài đặt notification preferences (`PUT /users/notification-settings`).

---

## 🛠️ PHASE 6: NAVIGATION, PERFORMANCE & TESTING ⏳
*Mục tiêu: Cải tiến UI/UX chi tiết, tối ưu hóa hiệu năng, viết test và tích hợp CI/CD.*

- [x] **Sprint 6.1: Split-Pane Post Detail Modal & Reaction Scoping UX Fix** ✅
    - [x] Thiết kế **PostDetailModal** hiển thị chi tiết bài viết dạng 2 cột (Split-pane) giống Facebook.
    - [x] Tích hợp nền tím khói thương hiệu Hizo (`bg-[#F4F0FD]`) cho bài viết không có ảnh (Option 1).
    - [x] Khắc phục triệt để giới hạn kết nối SSE giúp quản lý luồng ngầm mượt mà.
    - [x] Cố định sự kiện hover cảm xúc chỉ ở nút "Thích", tránh hiển thị nhầm khi di chuột qua "Bình luận" hay "Chia sẻ".
    - [x] Sửa toàn bộ lỗi Accessibility và đạt trạng thái build thành công.
- [x] **Sprint 6.2: Optimization & Quality Audit** ✅
    - [x] Áp dụng **Soft Delete** cho tin nhắn (Sprint 4.5) và bài viết (Phase 2). ✅
    - [x] **Redis Caching** cho dữ liệu tĩnh (user profile, friend list). ✅
    - [x] Viết **Unit Test** bằng JUnit 5 (coverage > 70%). ✅
        - *Đã có bước đệm:* Module Chat đã được hardening thêm test cho edit/delete message và rollback Optimistic UI ngày 12/06/2026.
    - [x] Viết **Integration Test** bằng MockMvc + Testcontainers. ✅
- [x] **Sprint 6.3: CI/CD Pipeline** ✅ *(3/3 HOÀN THÀNH)*
    - [x] Viết **E2E Test** bằng Playwright cho các luồng chính. ✅
    - [x] Thiết lập **GitHub Actions** tự động Build & Test khi push code. ✅
    - [x] Cấu hình **SonarQube/SonarCloud** để kiểm tra code quality. ✅
- [ ] **Sprint 6.4: Production Deployment**
    - [ ] Deploy Backend lên **Render** hoặc **Railway**.
    - [ ] Deploy Frontend lên **Vercel** hoặc **Netlify**.
    - [ ] Cấu hình **Environment Variables** cho production.
    - [ ] Setup **Custom Domain** và **SSL Certificate**.
- [ ] **Sprint 6.5: Monitoring & Observability**
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
| 4 | Realtime Chat | ✅ HOÀN THÀNH | 100% (Sprint 4.1→4.5 trọn vẹn) |
| 5 | Notification System | ✅ HOÀN THÀNH | 100% (Tích hợp SSE & đồng bộ Realtime) |
| 6 | Navigation & Performance | 🟡 ĐANG THỰC HIỆN | 80% (Hoàn thành Sprint 6.1, 6.2, 6.3) |
| 7 | Extended Features | ⏳ Chưa bắt đầu | 0% |

**Tổng tiến độ: ~95%** (Phase 0-5 hoàn thành trọn vẹn, Phase 6 đang triển khai)

---

## 🔧 TECH DEBT & CẢI TIẾN CẦN THEO DÕI

> Các khoản nợ kỹ thuật và cải tiến được ghi nhận trong quá trình review. Trạng thái: 🔴 Chưa làm | 🟡 Đang làm | ✅ Đã xong

| # | Hạng mục | Nhóm | Ưu tiên | Trạng thái | Dự kiến |
|:-:|----------|------|:-------:|:----------:|---------|
| 1 | MongoDB Replica Set + `MongoTransactionManager` | Hạ tầng | 🔴 Cao | ✅ Đã xong | Hoàn thành 30/05 |
| 2 | `findAllByIds` chống N+1 Query | Hiệu năng | 🟡 TB | ✅ Đã xong | Hoàn thành 30/05 |
| 3 | Đồng bộ `AppException` cho Post module | Chuẩn hóa | 🟡 TB | ✅ Đã xong | Hoàn thành 09/07 |
| 4 | `isSentByMe` trong FriendshipResponse | Logic/UX | 🟢 Thấp | ✅ Đã xong | Hoàn thành 30/05 (Sprint 3.2) |
| 5 | Thêm field `displayName` cho User | Logic/UX | 🟢 Thấp | ✅ Đã xong | Hoàn thành 30/05 (dùng field `name`, Sprint 3.3) |
| 6 | Tối ưu phân trang Search (aggregation pipeline) | Hiệu năng | 🟢 Thấp | 🔴 Chưa làm | Khi scale > 1000 users |
| 7 | StompBrokerRelay (RabbitMQ) cho scale lớn | Hạ tầng | 🟢 Thấp | 🔴 Chưa làm | Phase 7 (> 10 servers) |
| 8 | Infinite Scroll cho News Feed | Logic/UX | 🟡 TB | ✅ Đã xong | Hoàn thành 09/07 |
| 9 | Dọn dẹp Checkstyle Java Warnings | Chuẩn hóa | 🟢 Thấp | ✅ Đã xong | Hoàn thành 22/06 |
| 10 | Redis Caching cho User Profile và Friend List | Hiệu năng | 🟡 TB | ✅ Đã xong | Hoàn thành 09/07 |
| 11 | Trang Cài đặt tài khoản (Account/Settings Page) | Logic/UX | 🟢 Thấp | ✅ Đã xong | Hoàn thành 09/07 |


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

### ✅ #3: Đồng bộ `AppException` cho Post module (ĐÃ HOÀN THÀNH 09/07)
- **Vấn đề:** `PostService`/`ReactionService`/`CommentService` dùng `RuntimeException` thô → rơi vào handler 9999 (HTTP 500), message tiếng Anh xấu.
- **Giải pháp:** Đổi sang `AppException(ErrorCode...)`. Bổ sung mã `POST_NOT_FOUND`, `COMMENT_NOT_FOUND`, `POST_UNAUTHORIZED` vào `ErrorCode`.

### ✅ #8: Infinite Scroll cho News Feed (ĐÃ HOÀN THÀNH 09/07)
- **Vấn đề:** Hiện tại News Feed đang load các bài viết theo phân trang tĩnh hoặc load cứng, chưa mang lại trải nghiệm cuộn liền mạch như các mạng xã hội hiện đại.
- **Giải pháp:** Tích hợp logic scroll listener phía Frontend sử dụng `IntersectionObserver`, phát hiện khi người dùng cuộn đến gần cuối trang thì tự động gọi API lấy trang tiếp theo và nối vào danh sách hiện tại.

### ✅ #9: Dọn dẹp Checkstyle Java Warnings (ĐÃ HOÀN THÀNH 22/06)
- **Vấn đề:** Codebase Backend còn tồn tại một số cảnh báo Checkstyle (thụt lề, thiếu Javadoc, wildcard import) gây mất điểm chất lượng khi quét kiểm thử tự động.
- **Giải pháp:** Rà soát và sửa đổi code Java để tuân thủ 100% quy tắc Google Java Style được định nghĩa trong cấu hình Checkstyle của dự án.

### ✅ #10: Redis Caching cho User Profile và Friend List (ĐÃ HOÀN THÀNH 09/07)
- **Vấn đề:** Các dữ liệu thông tin cá nhân và danh sách bạn bè được truy vấn liên tục từ MongoDB khi tải trang chủ hoặc chat, gây overhead không cần thiết.
- **Giải pháp:** Triển khai cơ chế cache (Read-through/Write-through) lên Redis với thời gian TTL phù hợp để tăng tốc độ phản hồi API, đồng thời đảm bảo cơ chế thu hồi (eviction) đồng bộ cho cả ID và Email khi thay đổi thông tin.

### ✅ #11: Trang Cài đặt tài khoản (Account/Settings Page) (ĐÃ HOÀN THÀNH 09/07)
- **Vấn đề:** Chưa có màn hình quản trị tài khoản để người dùng tự đổi mật khẩu (khi đang đăng nhập) hoặc thiết lập các tùy chọn nhận thông báo.
- **Giải pháp:** Xây dựng màn hình Settings trong Frontend và tích hợp các API thay đổi mật khẩu an toàn, tự động thu hồi token (Token Eviction) và đưa vào blacklist của Redis.

---


## 📝 CHANGELOG

| Version | Date | Changes |
|---------|------|---------|
| 4.4 | Jul 2026 | **Infinite Scroll, Settings Page, Redis Profile Cache Sync & AppException Alignment — HOÀN THÀNH Sprint 6.4 🎉**: Tích hợp cuộn vô hạn cho News Feed bằng `IntersectionObserver`, hoàn thành trang Cài đặt đổi mật khẩu và thu hồi token, vá lỗi đồng bộ cache Redis User Profile cho cả ID/Email, đồng thời chuẩn hóa lỗi Post/Comment module thành `AppException`. Vượt qua 36/36 tests JUnit 5. |
| 4.3 | Jun 2026 | **Profile Navigations & Empty Chat Bug — HOÀN THÀNH Sprint 6.3 & Cải tiến Giao diện 🎉**: Nhấp vào avatar hoặc tên của tác giả trong phần bình luận (`CommentSection.tsx`) hoặc bạn chat ở thanh tiêu đề/nút hành động Profile của cuộc trò chuyện (`ChatPage.tsx`) sẽ điều hướng sang trang cá nhân. Sửa đổi cờ theo dõi tải danh sách hội thoại `hasLoadedConvs` để khắc phục triệt để lỗi bị kẹt giao diện chat đối với người dùng chưa có cuộc hội thoại nào. Chạy Playwright E2E vượt qua 9/9 tests. |
| 4.2 | Jun 2026 | **Split-Pane Post Detail Modal & Reaction Scoping UX Fix — HOÀN THÀNH Sprint 6.1 🎉**: Thiết kế giao diện Modal bình luận dạng 2 cột (Split-pane) kiểu Facebook. Đồng bộ hiển thị khung màu tím khói thương hiệu Hizo cho bài viết không có ảnh (Option 1) và hiển thị ảnh chi tiết bên trái. Scope lại hover reaction chỉ hiển thị ở nút "Thích", tránh kích hoạt nhầm khi di chuột qua "Bình luận" hay "Chia sẻ" ở cả `PostCard` và `PostDetailModal`. Khắc phục lỗi giới hạn kết nối SSE, tối ưu tài nguyên. Sửa lỗi Accessibility và build hoàn hảo 100% không lỗi. |
| 4.1 | Jun 2026 | **Quality Hardening & Linter Fixes — HOÀN THÀNH 🎉**: Khắc phục các cảnh báo biên dịch và linter ở cả Frontend và Backend. Bật `"forceConsistentCasingInFileNames": true` để đồng bộ hóa. Sửa các cảnh báo Accessibility (A11y) của các nút chức năng bằng thuộc tính `title`. Loại bỏ hoàn toàn inline styles trong `CommentSection.tsx` và `ChatPage.tsx` sang Tailwind CSS classes. Dọn dẹp các import thừa ở Backend (`NotificationService.java`, `PostRealtimeBroadcaster.java`, v.v.). Cập nhật `RateLimitingFilter.java` sang API `Bandwidth.builder()` mới. Sửa lỗi type safety (Raw types/Unchecked casts/Unboxing) trong `GlobalExceptionHandler.java`, `MessageServiceTest.java`, và `FriendshipService.java`. |
| 4.0 | Jun 2026 | **SSE Migration for Post Feed, Comments & Notifications — HOÀN THÀNH Task 2 🎉**: Di chuyển hoàn toàn hạ tầng cập nhật số đếm Post, Thông báo (Notifications) và Bình luận mới (Comments) từ WebSocket sang Server-Sent Events (SSE) giúp tối ưu hiệu năng và khả năng mở rộng. Sửa lỗi đường dẫn SSE Frontend gọi thiếu `/api`. Tối ưu hóa UI Bình luận: đảo ngược thứ tự Optimistic Update từ append (dưới cùng) thành prepend (trên đầu) đồng bộ với sắp xếp `createdAt DESC` của Backend, đem lại trải nghiệm đăng bình luận tức thì không giật lag. Backend controllers sửa lỗi định danh `@AuthenticationPrincipal` sang Jwt tránh lỗi 500. |
| 3.9 | Jun 2026 | **Chat Unread Badge realtime — KHEP TRON Sprint 5.4 (5/5) 🎉**: Tin nhan moi -> cham do/badge tren nut Chats o sidebar (giong Messenger), KHONG vao notification center -> hoan tat logic "2 luong rieng". Backend: `ChatEventPublisher.publishChatUnread` + subscriber day `/user/queue/chat-unread` (payload nhe, chi la tin hieu); `MessageService.sendMessage` ban toi nguoi nhan; `markAllAsSeen` ban toi chinh minh (dong bo moi tab); `GET /conversations/unread/total` cong don unread (Redis cache + fallback DB). Frontend: `chatService.getTotalUnread`, hook `useChatUnread` (fetch tong luc dang nhap + subscribe tin hieu -> refetch so chinh xac, khong cong/tru thu cong -> khong lech), badge so do tren nut Chats. Don log debug. Verify: mvn compile PASS, ArchUnit PASS, FE 0 loi, test 2 trinh duyet OK. Con lai Phase 5: sound (5.3 optional), email (5.5 optional). |
| 3.8 | Jun 2026 | **Realtime Feed Counts (like/comment) HOÀN THÀNH & TEST OK 🎉**: Số like/comment của bài viết cập nhật realtime cho mọi người đang xem, không cần F5. Backend: `PostCountEvent` (payload nhẹ: postId + reactCount + commentCount + reactionsCount) + `PostRealtimeBroadcaster` đẩy tới topic công khai `/topic/post.<id>` qua `SimpMessagingTemplate`; `ReactionService` broadcast ở MỌI thay đổi (thêm/gỡ/đổi), `CommentService` broadcast khi có comment. Frontend: `PostCard` **subscribe-on-mount** đúng topic của bài, **unmount tự unsubscribe** (không giữ kết nối thừa — đúng nguyên tắc đã chốt); cập nhật con số TUYỆT ĐỐI từ server (không cộng dồn → không lệch với Optimistic UI). Tái dùng 100% hạ tầng WS sẵn có. **Lưu ý vận hành:** lỗi "tưởng không ăn" thực ra do backend cũ kẹt cổng 8080 (bản mới không start được) → phải tắt hẳn process cũ trước khi chạy. Verify: `mvn compile` PASS, ArchUnit PASS, FE 0 lỗi, test 2 trình duyệt OK. |
| 3.7 | Jun 2026 | **Phase 5 Notification — Sprint 5.1→5.3 + triggers 5.4 HOÀN THÀNH & TEST OK 🎉**: Module `notification` chuẩn Clean Architecture 4 lớp (entity/port/Mongo adapter/MapStruct/service/listener/controller). Event-driven: `NotificationEvent` (shared) + `@Async @TransactionalEventListener(AFTER_COMMIT)` (chỉ tạo sau commit, luồng nền); self-guard `actor==recipient`; Redis cache `notif:unread:<userId>`. Realtime push `/user/queue/notifications` + toast + badge (chuông & sidebar). **4 trigger:** LIKE (chỉ khi thả mới), COMMENT, FRIEND_REQUEST, FRIEND_ACCEPTED. **Fix kèm:** (1) tách port `ChatEventPublisher` → ArchUnit pass 100% (gỡ nợ Phase 4); (2) `webSocketService` tự re-subscribe khi reconnect (hết lỗi phải F5 sau restart); (3) MapStruct bỏ sót `isRead` (Lombok boolean+`@Builder`) → ép `@Mapping` + `@JsonProperty("isRead")` → fix bug đánh dấu đã đọc không lưu; (4) comment count đồng bộ optimistic giữa CommentSection↔PostCard. Verify: `mvn clean compile` PASS, ArchUnit PASS, FE 0 lỗi, test 2 trình duyệt OK. Còn lại 5.4: chat unread badge realtime; 5.3 sound; 5.5 email. |
| 3.6 | Jun 2026 | **Phân tích & tinh chỉnh Phase 5 (Notification) theo logic Facebook/Zalo (USER duyệt)**: Chốt **2 luồng riêng** — Chat unread → chấm đỏ trên nút Chats (KHÔNG vào notification center); Notification center (chuông) chỉ chứa LIKE/COMMENT/FRIEND_REQUEST/FRIEND_ACCEPTED. Sprint 5.1 bổ sung: **Event-driven decoupling** (`ApplicationEvent` + `@EventListener @Async`) giữ Clean Architecture (module Post/Friendship không gọi trực tiếp NotificationService); thêm `actorId`/`entityId` vào entity; self-guard; Redis unread cache; tái dùng realtime infra Phase 4. Sprint 5.4: NEW_MESSAGE → chuyển thành chat unread badge realtime thay vì notification. |
| 3.5 | Jun 2026 | **Sprint 4.5 đợt 2: Infinite Scroll HOÀN THÀNH → PHASE 4 CHAT 100% 🏆**: Backend `getMessages` sort DESC (page 0 = mới nhất), page size 15. FE load 15 tin mới → reverse hiển thị cũ→mới; cuộn lên đầu tự tải page kế → prepend; **giữ vị trí cuộn** bằng `useLayoutEffect` đo chênh lệch scrollHeight (không nháy/nhảy màn hình); spinner đầu khung, lọc trùng id, dừng khi hết. Phase 4 Realtime Chat hoàn thành toàn bộ (Sprint 4.1→4.5). |
| 3.4 | Jun 2026 | **Sprint 4.5 đợt 1: Delete + Edit Message HOÀN THÀNH 🎉**: Xóa tin 2 chế độ (xóa riêng qua `deletedFor` Set không báo người khác / thu hồi cho mọi người qua `deleted` flag, sender + 15 phút, realtime). Sửa tin TEXT trong 15 phút + nhãn "(đã chỉnh sửa)". Backend: `editMessage`/`deleteMessage`, `PUT/DELETE /messages/{id}`, `MessageUpdateEvent` Pub/Sub "UPDATE" → `/user/queue/updates`, 4 error code. FE: Optimistic UI, hover Pencil/Trash, menu xóa mở lên trên, banner sửa, placeholder thu hồi. **Perf fix:** tắt verbose STOMP debug logging (gây lag khi mở DevTools). Còn lại: Infinite Scroll (đợt 2). |
| 3.3 | Jun 2026 | **Sprint 4.4 ④ Media in Chat HOÀN THÀNH 🎉 → SPRINT 4.4 TRỌN VẸN**: Gửi ảnh qua REST `/conversations/{id}/messages/image` (multipart), reuse `MediaService` (Cloudinary+Tika) + `sendMessage` type=IMAGE. FE: preview tray giống Messenger (tối đa 4 ảnh, nút X/+, không auto-gửi), Optimistic blob preview (tránh "ảnh khác"), upload progress bar, nén thông minh (skip GIF/<1MB, preserveExif, WebP). Thêm click quote → nhảy tới tin gốc + highlight (giống Facebook). Fix race REST vs WS echo gây trùng ảnh (dedup theo id + match type). Sandbox fallback cho test không cần key. Phase 4 đạt 100%. |
| 3.2 | Jun 2026 | **Sprint 4.4 ③ Reply to Message HOÀN THÀNH 🎉**: Trả lời tin nhắn cụ thể. Backend: value object `ReplyPreview` (denormalized snapshot: messageId+senderName+contentPreview) + `replyTo` vào Message/Document/Response, `replyToMessageId` vào SendRequest, validate cùng conversation, helper `buildShortPreview`. Frontend: state `replyingTo`, banner "Đang trả lời" trên input, nút Reply hover, **quote tách phía trên bong bóng màu trung tính** (giống Messenger/Zalo, dễ đọc mọi nền). **Quyết định:** lưu snapshot thay ID → quote hiển thị không query thêm (tránh N+1), giữ nội dung tại thời điểm reply. Fix: optimistic giữ replyTo khi server không trả về. Verify: backend compile PASS, FE 0 lỗi. |
| 3.1 | Jun 2026 | **Sprint 4.4 ② Message Reactions HOÀN THÀNH 🎉**: React emoji (❤️👍😂😮😢😡) cho từng tin nhắn qua STOMP `/app/chat.react` + Redis Pub/Sub type "REACTION" → `/user/queue/reactions`. Backend: thêm `reactions` (embedded Map userId→emoji) vào Message/Document/Response, `ReactionRequest`/`MessageReactionEvent` DTO, `MessageService.reactToMessage()` (toggle + validate 6 emoji), ErrorCode `INVALID_REACTION` (3006). Frontend: Optimistic UI, nút hover 😊, picker popup, badge góc bong bóng, overlay click-outside. **Quyết định:** embedded Map thay collection riêng (chat 1-1 tối đa 2 react → không cần pagination như Post). Verify: backend compile PASS, FE 0 lỗi. |
| 3.0 | Jun 2026 | **Sprint 4.4 ① Typing Indicator HOÀN THÀNH 🎉**: Realtime "đang nhập" qua STOMP `/app/chat.typing` + Redis Pub/Sub `chat.room.*`. Backend: `TypingRequest`, `TypingEvent`, `TypingService` (Redis TTL self-healing), mapping controller, subscriber handle type "TYPING". Frontend: subscribe `/user/queue/typing`, throttle gửi 2s, hiển thị 3 nơi (header/bubble/list). **Cascade 4 mốc:** throttle 2s < stop 3s < Redis TTL 4s < auto-clear 5s (mỗi lớp dự phòng lớp trước). Điểm hay: Redis TTL đảm bảo indicator tự hết kẹt khi đóng tab (đồng bộ pattern Presence Sprint 4.1). Verify: backend compile PASS, FE 0 lỗi, test 2 trình duyệt OK. |
| 2.9 | Jun 2026 | **Sprint 4.4 Planning Refinement (USER duyệt)**: Sắp xếp lại thứ tự triển khai 4.4 theo độ phức tạp tăng dần — ① Typing Indicator → ② Message Reactions → ③ Reply → ④ Media (LÀM CUỐI). Bổ sung các cải tiến đã duyệt: (1) Typing Indicator dùng **Redis TTL key** (auto-clear khi đóng tab, đồng bộ pattern Presence Sprint 4.1); (2) Media — tái dùng **Apache Tika magic-bytes scan** (security), **Optimistic UI blob preview**, **upload progress bar**; (3) Lưu ý atomic cho `ConversationService` (đã bỏ `@Transactional`). Quy tắc: mỗi tính năng phải chạy & test thành công trước khi sang tính năng kế. Đã xóa spec tạm `chat-three-column-layout` (feature 3-cột đã hoàn thành & commit). |
| 2.8 | Jun 2026 | **Chat UI Refactor + Bug Fixes**: (1) Refactor ChatPage layout sang 2 cột mới với Stories carousel, Filter tabs (All/Unread/Groups/Requests), Search bar tròn, Input bar icons (Emoji/Image/Mic), Chat header icons (Search/Phone/Video/More). (2) Fix critical bug: MongoDB `participants_unique_idx` sai (unique trên multikey array → chặn user có >1 conversation) — đổi sang non-unique index. (3) Fix ConversationService WriteConflict: bỏ `@Transactional` trên 3 methods (concurrent requests conflict trên single-node replica set). (4) Fix frontend infinite loop: `onClearInitialRecipient` → `finally` block để không retry khi API fail. (5) Fix `filteredFriends` crash: thêm optional chaining `f.name?.toLowerCase()`. (6) Global UI compact: `html { font-size: 14px }` giảm toàn app ~12%. |
| 2.7 | Jun 2026 | Hoàn tất review Sprint 4.2 và chuẩn bị Sprint 4.3. Bổ sung 2 improvement vào Sprint 4.3: (1) Redis TTL cho unread count (tránh memory leak khi user offline lâu), (2) ContentPreview helper method (sanitize HTML + truncate 100 chars). Thêm Tech Debt #7: StompBrokerRelay (RabbitMQ) - ưu tiên thấp, chỉ cần khi > 10 servers. Nguồn: AI review + Senior Architect validation. |
| 2.6 | Jun 2026 | Hoàn thành Sprint 4.1 (WebSocket Foundation + Redis Presence + JWT Blacklist). Redis lần đầu được dùng thật trong dự án với 2 use case: Presence TTL Online/Offline (35s + heartbeat 25s) và JWT Blacklist Access Token (TTL = remaining token lifetime). Benchmark trên máy dev: Redis EXISTS 0.019ms/lần vs MongoDB findOne 0.75ms/lần → nhanh hơn ~40x. Áp dụng Port-Adapter (`TokenBlacklistPort` ở `shared/security`) tuân thủ Clean Architecture. Bug fix ProfilePage crash khi 401. Pub/Sub chưa làm — để dành khi scale 2+ server. |
| 2.5 | May 2026 | Hoàn thành Sprint 3.4 (Friend Suggestions - Mutual Friends algorithm + UI sidebar data thật). PHASE 3 trọn vẹn 100%. |
| 2.4 | May 2026 | Hoàn thành UI Phase 3: module `friends` (FriendsPage 4 tab - Tìm kiếm/Bạn bè/Lời mời/Đã gửi), nút động theo relationshipStatus + Optimistic UI. Phase 3 XONG 100%. |
| 2.3 | May 2026 | Sprint 3.3 backend: fix bug FE-BE `name` + API Search (`/friends/search`) với enrich relationship status, loại self, ẩn người chặn. Ghi nhận Tech Debt #6 (tối ưu phân trang search). |
| 2.2 | May 2026 | Hoàn thành Sprint 3.2 (Friend List, Unfriend, Block/Unblock) + tích hợp `sentByMe` & batch-load chống N+1 |
| 2.1 | May 2026 | Hoàn thành Sprint 3.1 (Friend Request System) + Việt hóa toàn bộ message lỗi & Swagger. Ghi nhận 5 Tech Debt/cải tiến cần theo dõi. |
| 2.0 | May 2026 | Restructure to 7 Phases: Swap Phase 3↔4, Add Phase 5 (Notifications), Enhance Chat features |
| 1.0 | Apr 2026 | Initial 6 Phases roadmap |
