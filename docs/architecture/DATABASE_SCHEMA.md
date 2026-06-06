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
| `name` | String | Họ và tên hiển thị, bắt buộc (2-50 ký tự). **(Index thường - phục vụ tìm kiếm Sprint 3.3)** |
| `password` | String | Mật khẩu băm Bcrypt, bắt buộc. |
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

### D. Collection: `comments`
Lưu trữ các bình luận cấp 1 của người dùng trên bài viết.

*   **Indexes:**
    *   `postId` (Hashed/Ascending) -> Tối ưu lấy danh sách bình luận theo bài viết.
    *   `createdAt` (Ascending) -> Phân trang bình luận theo thời gian cũ nhất lên trước.

| Trường | Kiểu dữ liệu | Đặc tả / Ràng buộc |
| :--- | :--- | :--- |
| `_id` | ObjectId (String) | Khóa chính tự động sinh. |
| `postId` | String | Liên kết tới `posts._id`. |
| `authorId` | String | Liên kết tới `users._id`. |
| `authorName` | String | Tên người bình luận (Denormalized để truy vấn nhanh). |
| `authorAvatar`| String | Avatar người bình luận. |
| `content` | String | Nội dung văn bản của bình luận. |
| `imageUrl` | String | Link ảnh đính kèm (nếu có). |
| `createdAt` | Instant | Thời điểm bình luận. |
| `updatedAt` | Instant | Thời điểm sửa bình luận. |

---

### E. Collection: `reactions`
Lưu trữ cảm xúc của người dùng đối với bài viết.

*   **Indexes:**
    *   `(postId, userId)` (Compound Unique Index) -> Một user chỉ được thả 1 loại cảm xúc cho 1 bài viết.

| Trường | Kiểu dữ liệu | Đặc tả / Ràng buộc |
| :--- | :--- | :--- |
| `_id` | ObjectId (String) | Khóa chính tự động sinh. |
| `postId` | String | Liên kết tới `posts._id`. |
| `userId` | String | Liên kết tới `users._id`. |
| `type` | String (Enum) | Loại cảm xúc (`LIKE`, `LOVE`, `HAHA`, `WOW`, `SAD`, `ANGRY`). |
| `createdAt` | Instant | Thời điểm thả cảm xúc. |

---

## 🤝 2. MongoDB — Collection: `friendships`
Lưu trữ quan hệ kết bạn giữa người dùng. Sử dụng Compound Index để đảm bảo không có cặp bạn bè trùng lặp và tốc độ truy vấn nhanh.

*   **Indexes:**
    *   `(requesterId, addresseeId)` — Compound Unique Index (tên: `requester_addressee_idx`) → Chặn duplicate request theo một chiều và tăng tốc kiểm tra trạng thái.

| Trường | Kiểu dữ liệu | Đặc tả / Ràng buộc |
| :--- | :--- | :--- |
| `_id` | ObjectId (String) | Khóa chính tự động sinh. |
| `requesterId` | String | `users._id` của người gửi lời mời. |
| `addresseeId` | String | `users._id` của người nhận lời mời. |
| `status` | String (Enum) | Trạng thái: `PENDING`, `ACCEPTED`, `REJECTED`, `BLOCKED`. |
| `createdAt` | Instant (ISODate) | Thời điểm gửi lời mời (`@CreatedDate`). |
| `updatedAt` | Instant (ISODate) | Thời điểm cập nhật trạng thái gần nhất (`@LastModifiedDate`). |

> **Lưu ý nghiệp vụ (Sprint 3.1):** Việc kiểm tra quan hệ giữa 2 user dùng cơ chế **bidirectional lookup** (`findBetweenUsers`) — quét cả 2 chiều `(A→B)` và `(B→A)`. Trạng thái `REJECTED` cho phép tái sử dụng bản ghi để gửi lại lời mời.

---

## 💬 3. MongoDB — Collections: Chat System (Phase 4)

### F. Collection: `conversations`
Lưu trữ các cuộc hội thoại 1-1 giữa 2 người dùng. Mỗi cặp user chỉ có 1 conversation duy nhất.

*   **Indexes:**
    *   `participantIds` (Multikey Index) → Tìm conversations của 1 user.
    *   `lastMessageAt` (Descending) → Sort theo tin nhắn mới nhất (conversation list).
    *   `participantIds` (Compound Unique - sorted array) → Chặn duplicate conversation giữa 2 user.

| Trường | Kiểu dữ liệu | Đặc tả / Ràng buộc |
| :--- | :--- | :--- |
| `_id` | ObjectId (String) | Khóa chính tự động sinh. |
| `participantIds` | Array (String) | Mảng 2 phần tử chứa `users._id` (exactly 2 for 1-1 chat). |
| `lastMessageSummary` | Embedded Object | Summary của tin nhắn cuối (không embed full message để tiết kiệm). |
| `lastMessageSummary.senderId` | String | User gửi tin nhắn cuối. |
| `lastMessageSummary.contentPreview` | String | 100 ký tự đầu của content. |
| `lastMessageSummary.type` | String (Enum) | `TEXT`, `IMAGE`, `FILE`. |
| `lastMessageSummary.sentAt` | Instant | Thời điểm gửi. |
| `lastMessageAt` | Instant (ISODate) | Thời điểm tin nhắn cuối cùng (dùng để sort, denormalized). |
| `createdAt` | Instant (ISODate) | Thời điểm tạo conversation. |

> **Lưu ý thiết kế:**
> - `unreadCount` **KHÔNG lưu** trong collection — tính on-the-fly từ `messages` hoặc cache Redis để tránh desync.
> - `lastMessageSummary` denormalized để query conversation list nhanh (không cần join messages).
> - Validate: `participantIds` phải là bạn bè (Friendship status = ACCEPTED).

---

### G. Collection: `messages`
Lưu trữ toàn bộ tin nhắn trong conversations.

*   **Indexes:**
    *   `(conversationId, createdAt DESC)` — Compound Index → Query messages của conversation + sort theo thời gian.
    *   `senderId` (Optional) → Dùng cho analytics hoặc search messages của 1 user.

| Trường | Kiểu dữ liệu | Đặc tả / Ràng buộc |
| :--- | :--- | :--- |
| `_id` | ObjectId (String) | Khóa chính tự động sinh. |
| `conversationId` | String | Liên kết tới `conversations._id`. |
| `senderId` | String | Liên kết tới `users._id` (người gửi). |
| `content` | String | Nội dung tin nhắn (text, hoặc caption cho image/file). |
| `type` | String (Enum) | `TEXT`, `IMAGE`, `FILE`. |
| `mediaUrl` | String | URL ảnh/file (Cloudinary) nếu `type != TEXT`. Nullable. |
| `deliveredAt` | Instant (ISODate) | Thời điểm recipient nhận được tin nhắn (online + WebSocket ack). Nullable. |
| `seenAt` | Instant (ISODate) | Thời điểm recipient đọc tin nhắn (mở conversation). Nullable. |
| `createdAt` | Instant (ISODate) | Thời điểm gửi tin nhắn (SENT status). |

> **Message Status Logic (giống Facebook Messenger):**
> - **SENT** ✓: Message có `createdAt` (đã lưu DB thành công).
> - **DELIVERED** ✓✓: `deliveredAt != null` (recipient online và WebSocket ACK).
> - **SEEN** 👁️: `seenAt != null` (recipient mở conversation).
> 
> **Mark as Seen Trigger:** Frontend gọi `PUT /conversations/{id}/seen` khi user mở conversation → Backend batch update `seenAt` cho all messages chưa xem → Emit WebSocket event đến sender để update UI.

---

## ⚡ 4. Redis — Chiến lược sử dụng (Cache, Security & Realtime)

Redis được sử dụng với **5 mục đích rõ ràng**, đã được triển khai và kiểm chứng:

### Phạm vi sử dụng Redis (Cập nhật Phase 4.2)
| Mục đích | Key Pattern | Kiểu dữ liệu | TTL | Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| **Presence Online/Offline** | `presence:<userId>` | String (`"ONLINE"`) | 35s | Heartbeat mechanism, tự động expire khi mất kết nối |
| **Pub/Sub Chat** | `chat.room.<roomId>` | Pub/Sub Channel | N/A | Đồng bộ WebSocket đa server (scale-ready) |
| **JWT Blacklist** (Logout) | `blacklist:<jwtId>` | String (`"revoked"`) | Bằng thời gian hết hạn còn lại của Access Token | Sử dụng `jwtId` (UUID) thay vì toàn bộ token để tiết kiệm RAM |
| **Cache Unread Count** | `unread:<conversationId>:<userId>` | String (Counter) | 7 ngày (7 days) | Lưu số lượng tin nhắn chưa đọc của từng user trong hội thoại, tự động xóa khi seen |
| **Cache Profile** người dùng | `user:profile:<userId>` | Hash | 3600s (1 giờ) | Phase 6 (chưa triển khai) |
| **Cache Newsfeed** | `feed:user:<userId>` | List | 1800s (30 phút) | Phase 6 (chưa triển khai) |

> **Lưu ý quan trọng:**
> - Redis Pub/Sub được sử dụng **chính thức từ Phase 4.1** để đồng bộ tin nhắn realtime giữa các WebSocket sessions. Thiết kế này cho phép scale ngang (nhiều server) trong tương lai mà không cần refactor.
> - JWT Blacklist sử dụng `jwtId` (claim `jti` trong token) thay vì toàn bộ chuỗi token để tối ưu RAM (1 UUID = 36 bytes vs 1 JWT = ~200+ bytes).

---

## 🔄 5. Chế độ vận hành MongoDB: Replica Set (Hỗ trợ Transaction)

Kể từ 30/05/2026, MongoDB được vận hành ở chế độ **Replica Set (`rs0`)** thay vì standalone, nhằm hỗ trợ **Multi-document ACID Transactions** cho các nghiệp vụ ghi phức tạp (vd: Friendship, các thao tác liên collection ở Phase sau).

| Hạng mục | Cấu hình |
| :--- | :--- |
| **Chế độ** | Single-node Replica Set `rs0` (đủ cho dev/demo, vẫn bật được transaction) |
| **Docker** | `mongod --replSet rs0 --bind_ip_all` + healthcheck tự `rs.initiate()` |
| **Connection String** | `mongodb://localhost:27018/miniface_db?directConnection=true` |
| **Spring Bean** | `MongoTransactionManager` khai báo trong `infrastructure/config/MongoConfig.java` |
| **Kích hoạt** | Service đánh dấu `@Transactional` (vd: `FriendshipService`) sẽ rollback đúng khi có lỗi giữa chừng |

> **Lý do dùng `directConnection=true`:** Replica member khai báo host nội bộ `localhost:27017` (trong container), trong khi app kết nối qua port mapping `27018`. Cờ này giúp driver kết nối thẳng tới node mà không qua topology discovery (tránh lỗi mismatch host/port) nhưng transaction vẫn hoạt động bình thường.

---

## 🛠️ 6. Chiến lược di cư Schema (Mongock Migration)

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
