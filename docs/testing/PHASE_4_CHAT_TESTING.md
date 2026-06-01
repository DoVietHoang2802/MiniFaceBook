# 🧪 PHASE 4: REALTIME CHAT - HƯỚNG DẪN KIỂM THỬ

> **Last Updated:** June 2026 | **Sprint hiện tại:** 4.1 (WebSocket Foundation)

---

## 📋 MỤC LỤC

- [Sprint 4.1: WebSocket Foundation + Redis](#sprint-41-websocket-foundation--redis)
  - [Điều kiện tiên quyết](#điều-kiện-tiên-quyết)
  - [Test 1: Presence Heartbeat](#test-1-presence-heartbeat)
  - [Test 2: JWT Blacklist (Logout vô hiệu token)](#test-2-jwt-blacklist-logout-vô-hiệu-token)
  - [Test 3: Check Online Status](#test-3-check-online-status)
  - [Test 4: WebSocket kết nối](#test-4-websocket-kết-nối)
  - [Verify Redis trực tiếp](#verify-redis-trực-tiếp)

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
docker exec miniface-redis redis-cli TTL "presence:<userId>"
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

## 📊 BẢNG MÃ LỖI LIÊN QUAN

| Mã | HTTP | Message | Khi nào |
|:--:|:----:|:--------|:--------|
| 1006 | 401 | Chưa đăng nhập hoặc phiên đã hết hạn | Token hết hạn hoặc đã bị blacklist |

---

## ✅ CHECKLIST SPRINT 4.1

| # | Test case | Kết quả mong đợi |
|:-:|:----------|:-----------------|
| 1 | Redis PING | PONG |
| 2 | Heartbeat → Redis có key `presence:*` | ✅ |
| 3 | Logout → Redis có key `blacklist:*` | ✅ |
| 4 | Dùng token đã logout → 401 | ✅ |
| 5 | Check online status → trả đúng user online | ✅ |
| 6 | SockJS `/ws/info` trả JSON | ✅ |
