# 🗄️ DATABASE SCHEMA — MINIFACEBOOK

Tài liệu này đặc tả chi tiết lược đồ cơ sở dữ liệu của dự án **MiniFaceBook**, bao gồm MongoDB (database chính), Redis (cache & bảo mật) và Chiến lược di cư dữ liệu (Mongock Migration).

---

## 🍃 1. MongoDB Schema (Document Storage)

MongoDB được sử dụng làm cơ sở dữ liệu chính để lưu trữ các tài liệu động (Documents) như thông tin người dùng, bài viết, bình luận và token.

### A. Collection: `users`
Lưu trữ thông tin hồ sơ người dùng và trạng thái tài khoản.

*   **Indexes:**
    *   `email` (Unique Index, Hashed/Ascending) -> Đảm bảo không trùng lặp email và tăng tốc độ tìm kiếm khi đăng nhập.

| Trường | Kiểu dữ liệu | Đặc tả / Ràng buộc |
| :--- | :--- | :--- |
| `_id` | ObjectId (String) | Khóa chính tự động sinh. |
| `email` | String | Email duy nhất, định dạng chuẩn, bắt buộc. **(Unique Index)** |
| `password` | String | Mật khẩu băm Bcrypt, bắt buộc. |
| `name` | String | Tên hiển thị người dùng, bắt buộc. |
| `avatar` | String | URL ảnh đại diện (Lưu trên Cloudinary). Mặc định null. |
| `roles` | Array (String) | Danh sách vai trò: `["USER"]`, `["ADMIN"]`. |
| `verified` | Boolean | Trạng thái kích hoạt tài khoản qua email. Mặc định `false`. |
| `verificationToken`| String | Token dùng để gửi email xác thực tài khoản qua Resend. |
| `createdAt` | Instant (ISODate) | Ngày tạo tài khoản (Tự động điền bởi `@CreatedDate`). |
| `updatedAt` | Instant (ISODate) | Ngày cập nhật gần nhất (Tự động điền bởi `@LastModifiedDate`). |

---

### B. Collection: `refresh_tokens`
Quản lý vòng đời của Refresh Tokens phục vụ cho cơ chế xoay vòng chống Replay Attack (Refresh Token Rotation).

*   **Indexes:**
    *   `token` (Unique Index) -> Tăng tốc độ kiểm tra tính hợp lệ của token khi xoay vòng.

| Trường | Kiểu dữ liệu | Đặc tả / Ràng buộc |
| :--- | :--- | :--- |
| `_id` | ObjectId (String) | Khóa chính tự động sinh. |
| `token` | String | Refresh Token ngẫu nhiên (UUID), bắt buộc. **(Unique Index)** |
| `userId` | String | Liên kết tới `users._id` sở hữu token. |
| `expiryDate` | Instant (ISODate) | Thời điểm hết hạn token (Thường là 7 ngày kể từ khi tạo). |
| `revoked` | Boolean | Trạng thái thu hồi (Hủy kích hoạt). Mặc định `false`. |
| `createdAt` | Instant (ISODate) | Ngày tạo token. |

---

### C. Collection: `posts`
Lưu trữ thông tin bài viết của người dùng trên News Feed.

*   **Indexes:**
    *   `createdAt` (Descending) -> Tối ưu hóa truy vấn lấy News Feed theo thời gian mới nhất (Phân trang).
    *   `authorId` (Hashed/Ascending) -> Tối ưu hóa truy vấn lấy danh sách bài viết trên trang cá nhân (Profile Page).

| Trường | Kiểu dữ liệu | Đặc tả / Ràng buộc |
| :--- | :--- | :--- |
| `_id` | ObjectId (String) | Khóa chính tự động sinh. |
| `authorId` | String | Liên kết tới `users._id` của người đăng bài. |
| `content` | String | Nội dung văn bản của bài viết (có thể rỗng nếu chỉ đăng ảnh). |
| `imageUrls` | Array (String) | Danh sách link ảnh đã được mã hóa và tải lên Cloudinary. |
| `reactIds` | Array (String) | Danh sách `users._id` đã thả tương tác (Like) vào bài viết. |
| `createdAt` | Instant (ISODate) | Thời điểm đăng bài. **(Index Descending)** |
| `updatedAt` | Instant (ISODate) | Thời điểm chỉnh sửa bài viết gần nhất. |

---

## 🤝 2. MongoDB — Collection: `friendships`
Lưu trữ quan hệ kết bạn giữa người dùng. Sử dụng Compound Index để đảm bảo không có cặp bạn bè trùng lặp và tốc độ truy vấn nhanh.

*   **Indexes:**
    *   `(requesterId, recipientId)` — Compound Unique Index → Chặn duplicate request và tăng tốc kiểm tra trạng thái.
    *   `status` (Ascending) → Tối ưu truy vấn lọc bạn bè theo trạng thái.

| Trường | Kiểu dữ liệu | Đặc tả / Ràng buộc |
| :--- | :--- | :--- |
| `_id` | ObjectId (String) | Khóa chính tự động sinh. |
| `requesterId` | String | `users._id` của người gửi lời mời. |
| `recipientId` | String | `users._id` của người nhận lời mời. |
| `status` | String (Enum) | Trạng thái: `PENDING`, `ACCEPTED`, `REJECTED`. |
| `createdAt` | Instant (ISODate) | Thời điểm gửi lời mời. |
| `updatedAt` | Instant (ISODate) | Thời điểm cập nhật trạng thái gần nhất. |

---

## ⚡ 3. Redis — Chiến lược sử dụng (Cache & Security)

Redis được sử dụng với **3 mục đích rõ ràng**, không mở rộng thêm ngoài phạm vi này:

### Phạm vi sử dụng Redis
| Mục đích | Key Pattern | Kiểu dữ liệu | TTL |
| :--- | :--- | :--- | :--- |
| **JWT Blacklist** (Logout) | `auth:revoked-token:<token>` | String | Bằng thời gian hết hạn còn lại của JWT |
| **Cache Profile** người dùng | `user:profile:<userId>` | Hash | 3600s (1 giờ) |
| **Cache Newsfeed** | `feed:user:<userId>` | List | 1800s (30 phút) |

> **Lưu ý:** Redis trong dự án này **không** sử dụng Pub/Sub. Phạm vi sử dụng giới hạn ở Cache và JWT Blacklist.

---

## 🛠️ 4. Chiến lược di cư Schema (Mongock Migration)

Để đảm bảo tính đồng bộ dữ liệu và nhất quán môi trường giữa các Developer (và môi trường Production), chúng ta sử dụng **Mongock** thay thế cho việc viết script MongoDB thủ công.

### Quy trình chạy di cư (Migration Flow):
1.  Khi Spring Boot Backend khởi động, **Mongock Runner** tự động quét gói `com.minifacebook.infrastructure.persistence.migration`.
2.  Mongock kiểm tra trong collection lịch sử di cư (`mongockChangeLog`) để xem các ChangeSet nào chưa được thực thi.
3.  Thực thi các ChangeSet chưa chạy theo thứ tự phiên bản tăng dần trong môi trường Transaction bảo mật.

### Ví dụ về một ChangeSet khởi tạo Index cho Database:
```java
@ChangeUnit(id = "init-user-indexes", order = "001", author = "architect")
public class InitUserIndexesChange {

  @RollbackExecution
  public void rollback(MongoDatabase db) {
    db.getCollection("users").dropIndexes();
  }

  @Execution
  public void execution(MongoDatabase db) {
    MongoCollection<Document> collection = db.getCollection("users");
    // Tạo index unique cho email
    collection.createIndex(new Document("email", 1), new IndexOptions().unique(true));
  }
}
```
