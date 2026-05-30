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

### Sprint 3.3 - User Search & Discovery (CHƯA LÀM ⏳)

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

> Phần này test các API quản lý: xem danh sách bạn bè, lời mời, hủy kết bạn, chặn/bỏ chặn.
> **Chuẩn bị:** Cần ít nhất 2-3 user (Alice, Bob, Charlie) và một vài quan hệ đã thiết lập từ Sprint 3.1.

## 📋 BƯỚC A: Xem danh sách bạn bè
- Login → **`GET /friends`** → Execute.
- ✅ **Kỳ vọng:** Trả về mảng bạn bè (status ACCEPTED), mỗi phần tử có `email`, `avatar`, `bio`, `userId`.

## 📋 BƯỚC B: Xem lời mời đang chờ mình duyệt
- Login bằng người NHẬN lời mời → **`GET /friends/requests/pending`**.
- ✅ **Kỳ vọng:** Danh sách lời mời gửi đến, mỗi phần tử có **`sentByMe: false`** (người khác gửi cho mình).
- 💡 **Ý nghĩa UI:** `sentByMe=false` → hiển thị nút **"Chấp nhận" / "Từ chối"**.

## 📋 BƯỚC C: Xem lời mời mình đã gửi
- Login bằng người GỬI → **`GET /friends/requests/sent`**.
- ✅ **Kỳ vọng:** Danh sách lời mời mình gửi đi, mỗi phần tử có **`sentByMe: true`**.
- 💡 **Ý nghĩa UI:** `sentByMe=true` → hiển thị nút **"Thu hồi"**.

## 📋 BƯỚC D: Hủy kết bạn (Unfriend)
- Với 2 người ĐÃ là bạn (ACCEPTED), một bên login → **`DELETE /friends/{friendId}`** (dán userId của người kia).
- ✅ **Kỳ vọng:** message "Đã hủy kết bạn thành công". Gọi lại `GET /friends` thấy danh sách giảm.

## 📋 BƯỚC E: Chặn người dùng (Block)
- Login (người chặn) → **`POST /friends/block/{userId}`** (dán userId người muốn chặn).
- ✅ **Kỳ vọng:** message "Đã chặn người dùng thành công".
- **Cơ chế:** `requesterId` = người chặn, `addresseeId` = người bị chặn, `status = BLOCKED`.

## 📋 BƯỚC F: Bỏ chặn (Unblock)
- Người ĐÃ chặn login → **`DELETE /friends/block/{userId}`**.
- ✅ **Kỳ vọng:** message "Đã bỏ chặn người dùng thành công".

### 🧪 Edge cases của Block (quan trọng)

| Tình huống | Cách làm | Mã lỗi mong đợi |
|------------|----------|:---------------:|
| **Người bị chặn gửi lời mời** | B bị A chặn → B gửi friend request cho A | `2009` USER_BLOCKED |
| **Người KHÔNG chặn đòi unblock** | A chặn B → B gọi `DELETE /friends/block/{A}` | `2007` NOT_SENDER |
| **Unfriend người chưa là bạn** | Gọi unfriend với người chỉ mới PENDING | `2005` FRIENDSHIP_NOT_FOUND |

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
