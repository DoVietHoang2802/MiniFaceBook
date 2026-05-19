# 🗄️ DATABASE SCHEMA & POLYGLOT PERSISTENCE SPECIFICATION

Tài liệu này đặc tả chi tiết kiến trúc lưu trữ đa cơ sở dữ liệu (Polyglot Persistence Layer) của dự án **MiniFaceBook**, bao gồm MongoDB, Neo4j, Redis và Chiến lược di cư cơ sở dữ liệu (Database Migration Strategy).

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

## 🕸️ 2. Neo4j Graph Model (Social Connections)

Neo4j được thiết kế chuyên biệt để quản lý mạng lưới kết nối bạn bè, giúp xử lý các truy vấn quan hệ có độ sâu lớn (như gợi ý kết bạn, bạn chung) với thời gian phản hồi cực nhanh.

### A. Graph Nodes: `(:User)`
Mỗi tài khoản người dùng tương ứng với một Node trong đồ thị.

```cypher
(:User {
  id: "664bdf6e4f3a8b27c5b19e21", // Trùng khớp hoàn toàn với users._id của MongoDB
  name: "Do Viet Hoang"
})
```

### B. Relationships: `[:FRIEND]`
Mối quan hệ bạn bè là quan hệ **Vô hướng (Undirected)** hoặc **Hai chiều (Bi-directional)**:

```cypher
(:User {id: "UserA_ID"}) -[:FRIEND {createdAt: timestamp()}]-> (:User {id: "UserB_ID"})
```

### C. Chiến lược truy vấn hiệu năng cao:
*   **Tìm Bạn Chung (Friends of Friends):**
    ```cypher
    MATCH (userA:User {id: $idA})-[:FRIEND]-(mutual:User)-[:FRIEND]-(userB:User {id: $idB})
    RETURN mutual.name
    ```
*   **Gợi ý kết bạn (Friend Recommendation):**
    ```cypher
    MATCH (me:User {id: $myId})-[:FRIEND*2]-(stranger:User)
    WHERE NOT (me)-[:FRIEND]-(stranger) AND stranger.id <> $myId
    RETURN stranger, count(stranger) AS MutualCount
    ORDER BY MutualCount DESC LIMIT 10
    ```

---

## ⚡ 3. Redis Key Patterns (Caching & Security Session)

Redis hoạt động như một InMemory Cache để tăng tốc độ phản hồi News Feed và quản lý danh sách đen các token bị lộ hoặc vô hiệu hóa.

| Tên Key Pattern | Kiểu dữ liệu Redis | Chức năng / Thời gian sống (TTL) |
| :--- | :--- | :--- |
| `auth:revoked-token:<token>` | String | Lưu trữ Access Token bị thu hồi (đăng xuất sớm). TTL = Thời gian hết hạn còn lại của JWT. |
| `user:profile:<userId>` | Hash | Caching hồ sơ cá nhân người dùng để giảm tải cho MongoDB. TTL = 3600s (1 giờ). |
| `feed:user:<userId>` | List | Lưu trữ danh sách IDs bài viết trên News Feed của từng người dùng. TTL = 1800s (30 phút). |

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
