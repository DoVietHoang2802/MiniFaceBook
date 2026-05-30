# 👥 HƯỚNG DẪN KIỂM THỬ PHASE 3 - SOCIAL GRAPH & FRIENDS

> **Tài liệu hướng dẫn test chi tiết các API của Phase 3.** Dành cho cả người không chuyên - làm theo từng bước là chạy được.

---

## 📌 TRƯỚC KHI BẮT ĐẦU - 3 ĐIỀU CẦN BIẾT

### 1️⃣ Khởi động hệ thống
```bash
# Terminal 1: Hạ tầng (MongoDB, Redis, Mailpit)
docker-compose up -d

# Terminal 2: Backend
cd backend
mvn spring-boot:run
```
Đợi log hiện `Started BackendApplication` là xong.

### 2️⃣ Mở Swagger UI
Truy cập: **http://localhost:8080/api/docs**

### 3️⃣ ⚠️ HIỂU CƠ CHẾ ĐĂNG NHẬP (QUAN TRỌNG NHẤT!)
Hệ thống này dùng **HttpOnly Cookie** để xác thực, **KHÁC** với cách Bearer Token thông thường:

| ❌ KHÔNG làm | ✅ ĐÚNG cách |
|--------------|-------------|
| Bấm nút **Authorize** (ổ khóa xanh) | Bỏ qua nút Authorize hoàn toàn |
| Copy/dán token thủ công | Chỉ cần gọi `POST /auth/login` |

**Tại sao?** Khi bạn login thành công trên Swagger, trình duyệt **tự động lưu cookie** và **tự động đính kèm** vào TẤT CẢ request sau đó (vì Swagger cùng domain `localhost:8080`).

**Muốn "đổi người dùng"?** → Chỉ cần gọi `POST /auth/login` bằng tài khoản khác. Cookie cũ sẽ bị ghi đè, giờ bạn "là" người mới.

---

## 🗺️ TỔNG QUAN CÁC API PHASE 3

### Sprint 3.1 - Friend Request (ĐÃ XONG ✅)
| # | Method | Endpoint | Chức năng |
|:-:|--------|----------|-----------|
| 1 | `POST` | `/friends/request/{userId}` | Gửi lời mời kết bạn |
| 2 | `DELETE` | `/friends/request/{friendshipId}` | Hủy lời mời đã gửi |
| 3 | `PUT` | `/friends/request/{friendshipId}/accept` | Chấp nhận lời mời |
| 4 | `PUT` | `/friends/request/{friendshipId}/reject` | Từ chối lời mời |

### Sprint 3.2 - Friend List & Management (ĐÃ XONG ✅)
| # | Method | Endpoint | Chức năng |
|:-:|--------|----------|-----------|
| 5 | `GET` | `/friends` | Danh sách bạn bè |
| 6 | `GET` | `/friends/requests/pending` | Lời mời đang chờ mình duyệt |
| 7 | `GET` | `/friends/requests/sent` | Lời mời mình đã gửi |
| 8 | `DELETE` | `/friends/{friendId}` | Hủy kết bạn (Unfriend) |
| 9 | `POST` | `/friends/block/{userId}` | Chặn người dùng |
| 10 | `DELETE` | `/friends/block/{userId}` | Bỏ chặn người dùng |

### Sprint 3.3 - User Search & Discovery (ĐÃ XONG ✅)
| # | Method | Endpoint | Chức năng |
|:-:|--------|----------|-----------|
| 11 | `GET` | `/friends/search?q=&page=&size=` | Tìm kiếm người dùng theo tên (kèm trạng thái quan hệ) |

> 📌 **Lưu ý:** Đăng ký giờ BẮT BUỘC nhập `name` (họ tên, 2-50 ký tự). Search dựa trên field `name` này.

---

# 🧪 KỊCH BẢN TEST SPRINT 3.1

## 🔧 BƯỚC 0: Tạo 2 tài khoản test (Alice & Bob)

Kết bạn cần 2 người, nên ta tạo 2 tài khoản.

**0.1.** Trên Swagger, mở **Auth → `POST /auth/register`** → bấm **Try it out**.

**0.2.** Tạo Alice - nhập body này rồi bấm **Execute**:
```json
{ "email": "alice@test.com", "password": "123456", "bio": "Alice" }
```

**0.3.** Tạo Bob - sửa lại body rồi bấm **Execute**:
```json
{ "email": "bob@test.com", "password": "123456", "bio": "Bob" }
```

**0.4.** Kích hoạt email cho cả 2 tài khoản. Chọn 1 trong 2 cách:

**Cách A - Qua Mailpit (giống thật):** Mở **http://localhost:8025** → mở từng email → bấm link kích hoạt.

**Cách B - Nhanh gọn qua DB (khuyên dùng khi test):**
```bash
docker exec miniface-mongodb mongosh miniface_db --quiet --eval "db.users.updateMany({}, {$set:{verified:true}})"
```

---

## 🔑 BƯỚC 1: Lấy `userId` của Bob (người nhận lời mời)

**1.1.** Mở **Auth → `POST /auth/login`** → **Try it out** → đăng nhập Bob:
```json
{ "email": "bob@test.com", "password": "123456" }
```

**1.2.** Bấm **Execute**. Nhìn **Response body**, tìm dòng `"id"` và **copy lại**:
```json
{
  "data": {
    "id": "6a193b9bb4b52b6b096a4e51",   ← 📋 COPY GIÁ TRỊ NÀY
    "email": "bob@test.com"
  }
}
```
👉 Đây là **userId của Bob**. Dán tạm ra Notepad.

---

## 🤝 BƯỚC 2: Alice gửi lời mời kết bạn cho Bob

**2.1.** Login lại bằng **Alice** (để "trở thành" Alice):
```json
{ "email": "alice@test.com", "password": "123456" }
```

**2.2.** Mở **Friendship → `POST /friends/request/{userId}`** → **Try it out**.

**2.3.** Dán **userId của Bob** (copy ở Bước 1) vào ô `userId` → **Execute**.

**2.4.** ✅ **Kỳ vọng:** `status: 200`, `data.status: "PENDING"`. **Copy lại `friendshipId`**:
```json
{
  "message": "Friend request sent successfully",
  "data": {
    "friendshipId": "6a193befb4b52b6b096a4e53",   ← 📋 COPY GIÁ TRỊ NÀY
    "status": "PENDING"
  }
}
```

---

## ✅ BƯỚC 3: Bob chấp nhận lời mời

**3.1.** Login lại bằng **Bob** (chỉ người NHẬN mới được accept):
```json
{ "email": "bob@test.com", "password": "123456" }
```

**3.2.** Mở **Friendship → `PUT /friends/request/{friendshipId}/accept`** → **Try it out**.

**3.3.** Dán **friendshipId** (copy ở Bước 2) vào ô → **Execute**.

**3.4.** ✅ **Kỳ vọng:** `status: 200`, `data.status: "ACCEPTED"`.
🎉 **Alice và Bob giờ đã là bạn bè!**

---

## 🔄 CÁC LUỒNG KHÁC (làm tương tự)

### Từ chối lời mời (thay vì chấp nhận)
- Bob login → gọi **`PUT /friends/request/{friendshipId}/reject`**
- Kỳ vọng: message "rejected successfully"

### Hủy lời mời đã gửi (Alice đổi ý)
- Khi lời mời còn **PENDING**, Alice login → gọi **`DELETE /friends/request/{friendshipId}`**
- Kỳ vọng: message "cancelled successfully" (record bị xóa khỏi DB)

---

# 🧪 KỊCH BẢN TEST SPRINT 3.2 (Friend List & Management)

> Phần này test 6 API quản lý: danh sách bạn bè, lời mời (đến/đã gửi), hủy kết bạn, chặn/bỏ chặn.

## 🔧 BƯỚC 3.2.0: Chuẩn bị 3 user + quan hệ mẫu

Để test đủ các luồng, ta cần 3 user và 2 loại quan hệ. Nếu đã có Alice/Bob từ Sprint 3.1, chỉ cần tạo thêm Charlie.

**1.** Tạo 3 user qua `POST /auth/register` (nếu chưa có):
```json
{ "email": "alice@test.com", "password": "123456", "bio": "Alice" }
```
```json
{ "email": "bob@test.com", "password": "123456", "bio": "Bob" }
```
```json
{ "email": "charlie@test.com", "password": "123456", "bio": "Charlie" }
```

**2.** Verify tất cả (terminal):
```bash
docker exec miniface-mongodb mongosh miniface_db --quiet --eval "db.users.updateMany({}, {$set:{verified:true}})"
```

**3.** Lấy & ghi ra giấy 3 userId (login từng người, copy `data.id`):
- Login Bob → **bobId** = `____`
- Login Charlie → **charlieId** = `____`
- Login Alice → **aliceId** = `____`

**4.** Thiết lập quan hệ mẫu:
- **Alice ↔ Bob = BẠN BÈ:** Login Alice → `POST /friends/request/{bobId}` (copy friendshipId) → Login Bob → `PUT /friends/request/{friendshipId}/accept`.
- **Alice → Charlie = ĐANG CHỜ:** Login Alice → `POST /friends/request/{charlieId}` (để nguyên, không accept).

> ✅ Sau bước này: Alice có 1 bạn (Bob) + 1 lời mời đã gửi (Charlie). Charlie có 1 lời mời đang chờ (từ Alice).

---

## ✅ BƯỚC 3.2.1: GET /friends — Danh sách bạn bè

1. Login **Alice** → mở **Bạn bè → `GET /friends`** → **Try it out** → **Execute**.
2. ✅ **Kỳ vọng:** `data` là mảng có **1 phần tử là Bob**:
```json
{
  "message": "Lấy danh sách bạn bè thành công",
  "data": [
    {
      "userId": "...bobId...",
      "email": "bob@test.com",
      "bio": "Bob",
      "status": "ACCEPTED",
      "sentByMe": true
    }
  ]
}
```

---

## ✅ BƯỚC 3.2.2: GET /friends/requests/sent — Lời mời ĐÃ GỬI

1. Vẫn là **Alice** → **`GET /friends/requests/sent`** → **Execute**.
2. ✅ **Kỳ vọng:** Mảng có **Charlie**, đặc biệt **`sentByMe: true`**:
```json
{
  "data": [
    { "email": "charlie@test.com", "status": "PENDING", "sentByMe": true }
  ]
}
```
3. 💡 **Ý nghĩa UI:** `sentByMe=true` → Frontend hiển thị nút **"Thu hồi"**.

---

## ✅ BƯỚC 3.2.3: GET /friends/requests/pending — Lời mời ĐANG CHỜ DUYỆT

1. **Login Charlie** (đổi sang người nhận) → **`GET /friends/requests/pending`** → **Execute**.
2. ✅ **Kỳ vọng:** Mảng có **Alice**, đặc biệt **`sentByMe: false`**:
```json
{
  "data": [
    { "email": "alice@test.com", "status": "PENDING", "sentByMe": false }
  ]
}
```
3. 💡 **Ý nghĩa UI:** `sentByMe=false` → Frontend hiển thị nút **"Chấp nhận" / "Từ chối"**.

---

## ✅ BƯỚC 3.2.4: DELETE /friends/{friendId} — Hủy kết bạn (Unfriend)

1. **Login Alice** → **`DELETE /friends/{friendId}`** → dán **bobId** vào ô → **Execute**.
2. ✅ **Kỳ vọng:** `"message": "Đã hủy kết bạn thành công"`.
3. **Kiểm chứng:** Gọi lại `GET /friends` → mảng **rỗng** (Bob đã bị gỡ).

---

## ✅ BƯỚC 3.2.5: POST /friends/block/{userId} — Chặn người dùng

1. **Login Alice** → **`POST /friends/block/{userId}`** → dán **charlieId** → **Execute**.
2. ✅ **Kỳ vọng:** `"message": "Đã chặn người dùng thành công"`.
3. **Cơ chế lưu DB:** `requesterId` = Alice (người chặn), `addresseeId` = Charlie (bị chặn), `status = BLOCKED`.

---

## ✅ BƯỚC 3.2.6: DELETE /friends/block/{userId} — Bỏ chặn (Unblock)

1. **Login Alice** (người đã chặn) → **`DELETE /friends/block/{userId}`** → dán **charlieId** → **Execute**.
2. ✅ **Kỳ vọng:** `"message": "Đã bỏ chặn người dùng thành công"`.

---

## 🧪 BƯỚC 3.2.7: Edge cases Block/Unfriend (kiểm chứng bảo mật)

> Thực hiện sau khi Alice đã chặn Charlie (làm lại Bước 3.2.5 nếu đã unblock).

| # | Tình huống | Cách thực hiện | Mã lỗi mong đợi |
|:-:|------------|----------------|:---------------:|
| 1 | **Người bị chặn gửi lời mời** | Login **Charlie** → `POST /friends/request/{aliceId}` | `2009` USER_BLOCKED |
| 2 | **Người KHÔNG chặn đòi unblock** | Login **Charlie** → `DELETE /friends/block/{aliceId}` | `2007` NOT_SENDER |
| 3 | **Unfriend người chưa là bạn** | Login Alice → `DELETE /friends/{id-người-lạ}` | `2005` FRIENDSHIP_NOT_FOUND |

**Cách đọc kết quả:** Mỗi case Swagger trả về HTTP 403/404 kèm JSON có `status` đúng mã ở trên là PASS.

---

# 🧪 KỊCH BẢN TEST SPRINT 3.3 (User Search & Discovery)

> Test API tìm kiếm người dùng theo tên, kèm trạng thái quan hệ. **Lưu ý:** Đăng ký giờ BẮT BUỘC nhập họ tên.

## 🔧 BƯỚC 3.3.0: Lưu ý về đăng ký có TÊN

Từ Sprint 3.3, body đăng ký BẮT BUỘC có `name`:
```json
{ "name": "Nguyễn Văn An", "email": "an@test.com", "password": "123456" }
```
- Thiếu `name` → lỗi `1020` "Vui lòng nhập họ và tên".
- `name` < 2 ký tự → lỗi `1021` "Họ và tên phải có ít nhất 2 ký tự".

## 🔧 BƯỚC 3.3.1: Chuẩn bị data test

Tạo vài user có tên chứa từ khóa chung (vd "Nguyen") để search ra nhiều kết quả:
```json
{ "name": "Nguyen Van A", "email": "na@test.com", "password": "123456" }
{ "name": "Nguyen Thi B", "email": "nb@test.com", "password": "123456" }
{ "name": "Nguyen Van C", "email": "nc@test.com", "password": "123456" }
```
Verify tất cả:
```bash
docker exec miniface-mongodb mongosh miniface_db --quiet --eval "db.users.updateMany({}, {$set:{verified:true}})"
```

## ✅ BƯỚC 3.3.2: Tìm kiếm người dùng

1. Login bằng "Nguyen Van A" → mở **Bạn bè → `GET /friends/search`** → **Try it out**.
2. Nhập `q` = `Nguyen`, `page` = `0`, `size` = `10` → **Execute**.
3. ✅ **Kỳ vọng:** Mảng kết quả KHÔNG chứa chính mình (Nguyen Van A), mỗi phần tử có `relationshipStatus`:
```json
{
  "message": "Tìm kiếm người dùng thành công",
  "data": {
    "content": [
      { "name": "Nguyen Thi B", "relationshipStatus": "NONE", "friendshipId": null },
      { "name": "Nguyen Van C", "relationshipStatus": "NONE", "friendshipId": null }
    ],
    "totalElements": 3
  }
}
```

## ✅ BƯỚC 3.3.3: Kiểm tra relationshipStatus thay đổi theo quan hệ

| Thiết lập quan hệ với người trong kết quả | `relationshipStatus` mong đợi |
|-------------------------------------------|:-----------------------------:|
| Chưa có gì | `NONE` |
| Mình đã gửi lời mời (chưa được duyệt) | `PENDING_SENT` |
| Người kia gửi lời mời cho mình | `PENDING_RECEIVED` |
| Đã là bạn bè | `FRIEND` |
| Mình đã chặn người kia | `BLOCKED` |

**Ví dụ test FRIEND:** Gửi + accept lời mời với "Nguyen Thi B" → search lại "Nguyen" → B hiện `relationshipStatus: "FRIEND"`.

## 🧪 BƯỚC 3.3.4: Edge cases Search

| # | Tình huống | Kỳ vọng |
|:-:|------------|---------|
| 1 | Search chính tên mình | Không có mình trong kết quả (đã loại) |
| 2 | A chặn B → B search tên A | A bị ẩn (privacy), 0 kết quả |
| 3 | A chặn B → A search tên B | B hiện với `relationshipStatus: BLOCKED` |
| 4 | Search từ khóa không khớp ai | Mảng `content` rỗng |
| 5 | Search chữ hoa/thường khác nhau (`nGuYeN`) | Vẫn ra kết quả (case-insensitive) |

---

# 🧪 BƯỚC 4: TEST CÁC TRƯỜNG HỢP LỖI (Edge Cases - Sprint 3.1)

> Đây là phần kiểm chứng độ "chắc chắn" của hệ thống. Mỗi case phải trả về đúng mã lỗi.

| # | Tình huống | Cách làm | Mã lỗi mong đợi |
|:-:|------------|----------|:---------------:|
| 1 | **Tự kết bạn với mình** | Alice gửi request tới chính userId Alice | `2001` |
| 2 | **Gửi trùng lời mời** | Alice gửi cho Bob 2 lần liên tiếp | `2002` |
| 3 | **Đã là bạn rồi** | Sau khi ACCEPTED, Alice gửi lại cho Bob | `2003` |
| 4 | **User không tồn tại** | Gửi tới id `000000000000000000000000` | `1005` |
| 5 | **Người gửi tự accept** | Alice (sender) tự accept request mình gửi | `2006` |
| 6 | **Người nhận đòi hủy** | Bob (recipient) gọi DELETE để hủy | `2007` |
| 7 | **Accept 2 lần** | Accept lại 1 request đã ACCEPTED | `2008` |

### 💡 Mẹo lấy userId của Alice (cho case #1)
Login Alice → response trả về `data.id` chính là userId Alice.

---

# 🗄️ BƯỚC 5: Kiểm tra dữ liệu thật trong MongoDB (Optional)

Muốn xem dữ liệu lưu xuống DB thế nào:
```bash
docker exec miniface-mongodb mongosh miniface_db --quiet --eval "db.friendships.find().pretty()"
```

Kết quả mẫu:
```json
{
  "_id": "6a193bef...",
  "requesterId": "6a193b9a...",   // Alice (người gửi)
  "addresseeId": "6a193b9b...",   // Bob (người nhận)
  "status": "ACCEPTED"
}
```

**Xóa sạch dữ liệu friendships để test lại từ đầu:**
```bash
docker exec miniface-mongodb mongosh miniface_db --quiet --eval "db.friendships.deleteMany({})"
```

---

# 📊 PHỤ LỤC: BẢNG MÃ LỖI PHASE 3

| Mã | Ý nghĩa | HTTP Status |
|:--:|---------|:-----------:|
| `2001` | Không thể tự kết bạn với chính mình | 400 |
| `2002` | Lời mời kết bạn đã tồn tại | 400 |
| `2003` | Hai người đã là bạn bè | 400 |
| `2004` | Không tìm thấy lời mời kết bạn | 404 |
| `2005` | Không tìm thấy mối quan hệ bạn bè | 404 |
| `2006` | Bạn không phải người nhận lời mời này | 403 |
| `2007` | Bạn không phải người gửi lời mời này | 403 |
| `2008` | Lời mời không còn ở trạng thái chờ (đã xử lý rồi) | 400 |
| `2009` | Không thực hiện được do có chặn giữa 2 user | 403 |

---

# 🧰 PHỤ LỤC: CÂU LỆNH HỮU ÍCH

```bash
# Xem tất cả user trong DB
docker exec miniface-mongodb mongosh miniface_db --quiet --eval "db.users.find({}, {email:1, verified:1}).pretty()"

# Verify tất cả user (bỏ qua bước email)
docker exec miniface-mongodb mongosh miniface_db --quiet --eval "db.users.updateMany({}, {$set:{verified:true}})"

# Xem tất cả friendship
docker exec miniface-mongodb mongosh miniface_db --quiet --eval "db.friendships.find().pretty()"

# Reset dữ liệu friendship
docker exec miniface-mongodb mongosh miniface_db --quiet --eval "db.friendships.deleteMany({})"
```

---

> **Cập nhật:** Tài liệu này sẽ được bổ sung khi hoàn thành Sprint 3.2 (Friend List) và Sprint 3.3 (Search).
