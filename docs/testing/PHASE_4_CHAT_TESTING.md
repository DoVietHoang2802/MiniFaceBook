# 🧪 PHASE 4: REALTIME CHAT - HƯỚNG DẪN KIỂM THỬ

> **Last Updated:** June 2026 | **Sprint hiện tại:** 4.2 (Chat Infrastructure)

---

## 📋 MỤC LỤC

- [Sprint 4.1: WebSocket Foundation + Redis](#sprint-41-websocket-foundation--redis)
  - [Điều kiện tiên quyết](#điều-kiện-tiên-quyết)
  - [Test 1: Presence Heartbeat](#test-1-presence-heartbeat)
  - [Test 2: JWT Blacklist (Logout vô hiệu token)](#test-2-jwt-blacklist-logout-vô-hiệu-token)
  - [Test 3: Check Online Status](#test-3-check-online-status)
  - [Test 4: WebSocket kết nối](#test-4-websocket-kết-nối)
  - [Verify Redis trực tiếp](#verify-redis-trực-tiếp)
- [Sprint 4.2: Chat Infrastructure](#sprint-42-chat-infrastructure)
  - [Test 1: Tạo hoặc lấy cuộc trò chuyện (POST /conversations)](#test-1-tạo-hoặc-lấy-cuộc-trò chuyện-post-conversations)
  - [Test 2: Lấy danh sách cuộc trò chuyện (GET /conversations)](#test-2-lấy-danh-sách-cuộc-trò chuyện-get-conversations)
  - [Test 3: Lấy tin nhắn của cuộc trò chuyện (GET /conversationsidmessages)](#test-3-lấy-tin-nhắn-của-cuộc-trò chuyện-get-conversationsidmessages)
  - [Test 4: Đánh dấu đã xem cuộc trò chuyện (PUT /conversationsidseen)](#test-4-đánh-dấu-đã-xem-cuộc-trò-chuyện-put-conversationsidseen)
  - [Test 5: Xác nhận đã nhận tin nhắn (PUT /messagesiddelivered)](#test-5-xác-nhận-đã-nhận-tin-nhắn-put-messagesiddelivered)
  - [Verify Redis cho Unread Count](#verify-redis-cho-unread-count)

---

## Sprint 4.1: WebSocket Foundation + Redis

### Điều kiện tiên quyết

```bash
# Terminal 1: Hạ tầng (MongoDB, Redis, Mailpit)
docker-compose up -d

# Verify Redis chạy
docker exec miniface-redis redis-cli PING
# Kết quả mong đợi: PONG

# Terminal 2: Backend
cd backend
mvn spring-boot:run

# Chờ ~30s cho app khởi động xong
# Swagger: http://localhost:8080/api/docs
```

---

### Test 1: Presence Heartbeat

**Mục đích:** Kiểm tra API heartbeat ghi trạng thái Online vào Redis.

**Bước thực hiện trên Swagger:**

1. **Login** — `POST /auth/login`
```json
{
  "email": "your_email@test.com",
  "password": "Password123!"
}
```
> ⚠️ Swagger tự lưu Cookie `accessToken` (HttpOnly). Các API sau sẽ tự gửi kèm.

2. **Gọi Heartbeat** — `POST /presence/heartbeat`
   - Không cần body
   - Kết quả mong đợi: `200 OK`
```json
{
  "status": 200,
  "message": "Heartbeat nhận thành công",
  "data": null
}
```

3. **Verify Redis** (mở terminal):
```bash
docker exec miniface-redis redis-cli KEYS "presence:*"
```
> Kết quả: `presence:<userId>` — userId của bạn xuất hiện.

```bash
docker exec miniface-redis redis-cli TTL "presence:<a1a8f652139cd5e56c6987d>"
```
> Kết quả: số giây còn lại (khoảng 30-35s). Sau 35s không heartbeat → key tự xóa → OFFLINE.

---

### Test 2: JWT Blacklist (Logout vô hiệu token)

**Mục đích:** Kiểm tra sau khi logout, token cũ bị từ chối ngay lập tức (không cần chờ hết hạn).

**Bước thực hiện:**

1. **Login** — `POST /auth/login` (lấy cookie)

2. **Gọi API bất kỳ** — `GET /auth/me`
   - Kết quả: `200 OK` + thông tin user
   - → Chứng minh token đang hoạt động

3. **Logout** — `POST /auth/logout`
   - Kết quả: `200 OK`

4. **Gọi lại `GET /auth/me`** (dùng token cũ)
   - Kết quả mong đợi: **`401 Unauthorized`**
```json
{
  "status": 1006,
  "message": "Chưa đăng nhập hoặc phiên đã hết hạn"
}
```

5. **Verify Redis:**
```bash
docker exec miniface-redis redis-cli KEYS "blacklist:*"
```
> Kết quả: `blacklist:<jwtId>` — UUID của token đã bị thu hồi.

```bash
docker exec miniface-redis redis-cli TTL "blacklist:<jwtId>"
```
> Kết quả: số giây còn lại (bằng thời gian còn lại của token, tối đa 3600s). Sau khi hết → Redis tự xóa.

---

### Test 3: Check Online Status

**Mục đích:** Kiểm tra API batch check ai đang online.

**Bước thực hiện:**

1. **Login user A** → gọi `POST /presence/heartbeat` (user A online)

2. **Gọi Check** — `POST /presence/check`
```json
["userId_A", "userId_B_random"]
```
   - Kết quả mong đợi: `200 OK`
```json
{
  "status": 200,
  "message": "Lấy trạng thái online thành công",
  "data": ["userId_A"]
}
```
> Chỉ userId_A có trong kết quả (đang online). userId_B không có (offline/không tồn tại).

---

### Test 4: WebSocket kết nối

**Mục đích:** Kiểm tra WebSocket handshake + STOMP connect hoạt động.

**Cách 1: Browser Console (đơn giản nhất)**

1. Mở `http://localhost:5173` (frontend), login
2. Mở DevTools → Console, paste:
```javascript
const sock = new WebSocket('http://localhost:8080/api/ws');
sock.onopen = () => console.log('WS Connected!');
sock.onerror = (e) => console.log('WS Error:', e);
sock.onclose = (e) => console.log('WS Closed:', e.code, e.reason);
```
> Nếu đã login (có cookie) → "WS Connected!"
> Nếu chưa login → bị reject (close ngay)

**Cách 2: Kiểm tra SockJS endpoint**

Mở browser: `http://localhost:8080/api/ws/info`
> Kết quả: JSON chứa `{"entropy":...,"origins":["*:*"],"cookie_needed":true,"websocket":true}`
> Chứng minh SockJS endpoint đã sẵn sàng.

---

### Verify Redis trực tiếp

Các lệnh hữu ích để kiểm tra Redis:

```bash
# Xem tất cả key
docker exec miniface-redis redis-cli KEYS "*"

# Xem chỉ presence keys
docker exec miniface-redis redis-cli KEYS "presence:*"

# Xem chỉ blacklist keys
docker exec miniface-redis redis-cli KEYS "blacklist:*"

# Xem giá trị 1 key
docker exec miniface-redis redis-cli GET "presence:<userId>"

# Xem TTL còn lại
docker exec miniface-redis redis-cli TTL "presence:<userId>"

# Xóa sạch Redis (reset test)
docker exec miniface-redis redis-cli FLUSHALL
```

---

## Sprint 4.2: Chat Infrastructure

### Test 1: Tạo hoặc lấy cuộc trò chuyện (POST /conversations)
**Mục đích:** Đảm bảo có thể tạo cuộc trò chuyện 1-1 mới hoặc lấy cuộc trò chuyện đã tồn tại với bạn bè.

**Bước thực hiện trên Swagger:**
1. Đăng nhập tài khoản A (`POST /auth/login`).
2. Gọi `POST /conversations` với body chứa `recipientId` (ID của tài khoản B - phải là bạn bè và có status `ACCEPTED` trong Friendship):
```json
{
  "recipientId": "userId_B"
}
```
3. Kết quả mong đợi: `200 OK`
```json
{
  "status": 200,
  "message": "Lấy thông tin hội thoại thành công",
  "data": {
    "id": "conversationId",
    "participants": [
      { "id": "userId_A", "name": "User A", "avatar": "avatar_A" },
      { "id": "userId_B", "name": "User B", "avatar": "avatar_B" }
    ],
    "lastMessage": null,
    "lastMessageAt": "2026-06-05T02:00:00Z",
    "createdAt": "2026-06-05T02:00:00Z",
    "unreadCount": 0
  }
}
```
*Lưu ý validation:*
* Thử chat với chính mình (`recipientId` = `userId_A`) -> Báo lỗi `1403 - CANNOT_CHAT_SELF` (HTTP 400).
* Thử chat với người chưa kết bạn/chưa accept -> Báo lỗi `1302 - NOT_FRIENDS` (HTTP 400).
* Thử chat với người đã bị block -> Báo lỗi `1305 - USER_BLOCKED` (HTTP 400).

---

### Test 2: Lấy danh sách cuộc trò chuyện (GET /conversations)
**Mục đích:** Lấy toàn bộ danh sách chat của người dùng hiện tại, sắp xếp theo tin nhắn mới nhất giảm dần (`lastMessageAt DESC`).

**Bước thực hiện:**
1. Đăng nhập tài khoản A.
2. Gọi `GET /conversations?page=0&size=20`.
3. Kết quả mong đợi: Trả về trang phân trang các cuộc trò chuyện.
```json
{
  "status": 200,
  "message": "Lấy danh sách chat thành công",
  "data": {
    "content": [
      {
        "id": "conversationId",
        "participants": [...],
        "lastMessage": {
          "senderId": "userId_B",
          "contentPreview": "Chào bạn!",
          "type": "TEXT",
          "sentAt": "2026-06-05T02:05:00Z"
        },
        "lastMessageAt": "2026-06-05T02:05:00Z",
        "createdAt": "2026-06-05T02:00:00Z",
        "unreadCount": 1
      }
    ],
    "totalElements": 1,
    "totalPages": 1,
    "size": 20,
    "number": 0
  }
}
```

---

### Test 3: Lấy tin nhắn của cuộc trò chuyện (GET /conversations/{id}/messages)
**Mục đích:** Tải lịch sử tin nhắn của cuộc trò chuyện được chỉ định (tin nhắn cũ đến mới - `createdAt ASC`).

**Bước thực hiện:**
1. Đăng nhập tài khoản A.
2. Gọi `GET /conversations/{conversationId}/messages?page=0&size=50`.
3. Kết quả mong đợi: `200 OK` chứa danh sách tin nhắn.
```json
{
  "status": 200,
  "message": "Lấy danh sách tin nhắn thành công",
  "data": {
    "content": [
      {
        "id": "messageId",
        "conversationId": "conversationId",
        "sender": { "id": "userId_B", "name": "User B", "avatar": "avatar_B" },
        "content": "Chào bạn!",
        "type": "TEXT",
        "mediaUrl": null,
        "deliveredAt": "2026-06-05T02:05:01Z",
        "seenAt": null,
        "createdAt": "2026-06-05T02:05:00Z"
      }
    ],
    "totalElements": 1,
    "totalPages": 1,
    "size": 50,
    "number": 0
  }
}
```
*Lưu ý validation:*
* Nếu gọi với `conversationId` không tồn tại -> Lỗi `1401 - CONVERSATION_NOT_FOUND` (HTTP 404).
* Nếu gọi bởi một user không tham gia cuộc trò chuyện -> Lỗi `1402 - NOT_A_PARTICIPANT` (HTTP 403).

---

### Test 4: Đánh dấu đã xem cuộc trò chuyện (PUT /conversations/{id}/seen)
**Mục đích:** Cập nhật trạng thái `seenAt` cho tất cả tin nhắn đối phương gửi và reset cache số tin nhắn chưa đọc trong Redis.

**Bước thực hiện:**
1. Đăng nhập tài khoản A (người nhận tin nhắn).
2. Gọi `PUT /conversations/{conversationId}/seen`.
3. Kết quả mong đợi: `200 OK` và:
   - Redis key `unread:{conversationId}:{userId_A}` bị xóa.
   - User B (người gửi) nhận được sự kiện WebSocket thông báo trạng thái `SEEN` tại topic `/user/queue/status`.

---

### Test 5: Xác nhận đã nhận tin nhắn (PUT /messages/{id}/delivered)
**Mục đích:** Cập nhật trạng thái `deliveredAt` khi client nhận được tin nhắn realtime thông qua WebSocket.

**Bước thực hiện:**
1. Đăng nhập tài khoản A (người nhận tin nhắn).
2. Gọi `PUT /messages/{messageId}/delivered`.
3. Kết quả mong đợi: `200 OK` và:
   - Trường `deliveredAt` trong database được cập nhật thời gian hiện tại.
   - User B (người gửi) nhận được sự kiện WebSocket thông báo trạng thái `DELIVERED` tại topic `/user/queue/status`.

---

### Verify Redis cho Unread Count
Khi có tin nhắn mới chưa đọc, Redis sẽ lưu trữ đếm tin nhắn chưa xem để tối ưu hóa hiệu năng:
```bash
# Xem key đếm tin nhắn chưa đọc của userId_A trong cuộc hội thoại
docker exec miniface-redis redis-cli GET "unread:<conversationId>:<userId_A>"
# Kết quả mong đợi: "1" (hoặc số tin nhắn chưa đọc tương ứng)
```

---

## 📊 BẢNG MÃ LỖI LIÊN QUAN

| Mã | HTTP | Message | Khi nào |
|:--:|:----:|:--------|:--------|
| 1006 | 401 | Chưa đăng nhập hoặc phiên đã hết hạn | Token hết hạn hoặc đã bị blacklist |
| 1401 | 404 | Cuộc hội thoại không tồn tại | Khi truyền sai conversationId |
| 1402 | 403 | Bạn không phải là thành viên hội thoại | Khi user cố tình truy cập cuộc trò chuyện của người khác |
| 1403 | 400 | Không thể tự trò chuyện với chính mình | Khi gửi request chat với chính userId của mình |
| 1404 | 404 | Tin nhắn không tồn tại | Khi truyền sai messageId |
| 1302 | 400 | Chưa kết bạn | Khi hai người dùng chưa là bạn bè |
| 1305 | 400 | Người dùng đã bị chặn | Khi mối quan hệ ở trạng thái BLOCKED |

---

## ✅ CHECKLIST SPRINT 4.2

| # | Test case | Kết quả mong đợi |
|:-:|:----------|:-----------------|
| 1 | POST `/conversations` (Bạn bè) | ✅ Trả về hội thoại mới hoặc đã có |
| 2 | POST `/conversations` (Chính mình) | ❌ Lỗi 1403 |
| 3 | POST `/conversations` (Chưa kết bạn) | ❌ Lỗi 1302 |
| 4 | GET `/conversations` (Phân trang) | ✅ Danh sách sắp xếp theo `lastMessageAt` DESC |
| 5 | GET `/conversations/{id}/messages` | ✅ Danh sách tin nhắn theo `createdAt` ASC |
| 6 | PUT `/conversations/{id}/seen` | ✅ Reset unread count trên Redis & phát WS event |
| 7 | PUT `/messages/{id}/delivered` | ✅ Cập nhật `deliveredAt` & phát WS event |
| 8 | Mongock Migration | ✅ Tự động khởi tạo đầy đủ các index MongoDB |
