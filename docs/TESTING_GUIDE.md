# 🧪 HƯỚNG DẪN KIỂM THỬ (TESTING & RUNNING GUIDE)

*Tài liệu này hướng dẫn cách vận hành và kiểm tra các tính năng nền tảng đã hoàn thành sau Phase 0.*

---

## 🏗️ 1. Khởi động hạ tầng (Infrastructure)

Dự án sử dụng Docker để quản lý Database. Hãy đảm bảo bạn đã cài đặt Docker Desktop.

```bash
# Khởi động MongoDB, Redis, Neo4j
docker-compose up -d
```
*Lưu ý: MongoDB chạy tại port **27018** để tránh xung đột.*

---

## 🚀 2. Chạy ứng dụng Backend

Di chuyển vào thư mục `backend` và chạy lệnh:

```bash
mvn spring-boot:run
```
*Ứng dụng sẽ khởi chạy tại: http://localhost:8080*

---

## 🔍 3. Các kịch bản kiểm thử (Test Scenarios)

### 3.1. Kiểm tra API Documentation (Swagger)
- **Truy cập:** [http://localhost:8080/api/docs](http://localhost:8080/api/docs)
- **Kỳ vọng:** Thấy giao diện Swagger UI với tiêu đề "MiniFaceBook API Reference". Có nút **Authorize** để nhập mã JWT.

### 3.2. Kiểm tra Rate Limiting (Chống Spam)
Dùng Terminal (hoặc Postman) gọi liên tục API 11 lần trong 1 phút:
```bash
# Chạy lệnh này nhiều lần liên tục
curl.exe -i http://localhost:8080/api/any-endpoint
```
- **Kỳ vọng:** Từ lần thứ 11, bạn sẽ nhận được lỗi `429 Too Many Requests` kèm JSON:
  ```json
  {
    "status": 1009,
    "message": "Too many requests, please try again later"
  }
  ```

### 3.3. Kiểm tra Security (401 Unauthenticated)
Gọi một API bất kỳ không nằm trong danh sách cho phép (Public):
```bash
curl.exe -i http://localhost:8080/api/user/profile
```
- **Kỳ vọng:** Nhận được mã lỗi `401 Unauthorized` kèm JSON chuẩn `ApiResponse`.

### 3.4. Kiểm tra Kiến trúc (ArchUnit)
Đây là chốt chặn tự động kiểm tra xem code có tuân thủ **Clean Architecture** hay không:
```bash
# Di chuyển vào thư mục backend và chạy lệnh:
mvn test -Dtest=ArchitectureTest
```
- **Cách đọc kết quả:**
  - `BUILD SUCCESS`: Code của bạn sạch sẽ 100%, tuân thủ ranh giới Clean Architecture tuyệt đối.
  - `BUILD FAILURE`: Có sự vi phạm ranh giới (ví dụ: tầng Domain gọi tầng Infrastructure). Trình biên dịch sẽ in ra chi tiết file và dòng gây ra lỗi vi phạm.
  
- **Cấu hình Bootstrapping vs Strict Mode (Cần lưu ý):**
  - **Hiện tại (Phase 1 -> 4):** Bộ kiểm thử được cấu hình ở chế độ thoải mái **`.withOptionalLayers(true)`** trong [ArchitectureTest.java](file:///d:/Project_MiniFace/backend/src/test/java/com/minifacebook/ArchitectureTest.java#L23) để cho phép các thư mục layer trống hoạt động tốt mà không làm sập build trong quá trình phát triển tính năng.
  - **Bật Strict Mode (Phase 5 / Production Release):** Khi tất cả module đã hoàn thành, hãy mở file [ArchitectureTest.java](file:///d:/Project_MiniFace/backend/src/test/java/com/minifacebook/ArchitectureTest.java) và đổi giá trị thành **`.withOptionalLayers(false)`** (hoặc xóa hẳn dòng này đi). Chế độ nghiêm ngặt nhất sẽ được kích hoạt lại, ép buộc 100% mọi module mới đều phải có đầy đủ 4 tầng nghiêm túc.

### 3.5. Kiểm tra Authentication & Cookie Flow (Sprint 1.1)

#### Kịch bản 1: Đăng ký tài khoản và Xác thực email
1. Gửi request `POST /api/auth/register` với JSON body:
   ```json
   {
     "email": "user@example.com",
     "password": "Password123",
     "name": "Nguyen Van A"
   }
   ```
2. **Xác thực Email qua Console Log:** Hệ thống sẽ gọi giả lập/Resend API gửi thư. Mở log của Spring Boot Backend, bạn sẽ thấy dòng log in ra đường link xác thực dạng:
   `http://localhost:8080/api/auth/verify?token=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
3. Copy link đó dán vào trình duyệt (hoặc gửi request `GET`).
4. **Kỳ vọng:** Nhận phản hồi xác thực email thành công: `Email verified successfully! You can now log in.`

#### Kịch bản 2: Đăng nhập & Cookie-based Auth
1. Gửi request `POST /api/auth/login` với email và password đã đăng ký.
2. **Kỳ vọng:**
   * Response JSON trả về thông tin user (`id`, `email`, `name`, `roles`).
   * Header `Set-Cookie` chứa 2 cookie: `accessToken` (HttpOnly, hết hạn sau 1 giờ) và `refreshToken` (HttpOnly, hết hạn sau 7 ngày).
3. **Kiểm tra Cookie:** Kể từ thời điểm này, mọi request gửi lên cổng `/api/...` từ trình duyệt hoặc Postman sẽ tự động đính kèm 2 cookie này. Thử gọi API cần bảo vệ để kiểm chứng.

#### Kịch bản 3: Xoay vòng Token (Refresh Token Rotation)
1. Gửi request `POST /api/auth/refresh`.
2. **Kỳ vọng:**
   * Hệ thống tự động nhận diện `refreshToken` từ cookie, xoay vòng cấp phát 2 cookie `accessToken` và `refreshToken` mới.
   * Nếu bạn gửi lại đúng request đó lần thứ hai (kẻ gian dùng lại token cũ): Hệ thống ngay lập tức thu hồi toàn bộ token và trả về lỗi `401 Unauthorized`.

#### Kịch bản 4: Đăng xuất (Logout)
1. Gửi request `POST /api/auth/logout`.
2. **Kỳ vọng:** Cả hai Cookie `accessToken` và `refreshToken` đều được set thời gian sống về `0` (`Max-Age = 0`), xóa sạch dấu vết phiên đăng nhập khỏi trình duyệt.

---

## 🛠️ 4. Lệnh hữu ích khác
- **Dọn dẹp code style:** `mvn spotless:apply`
- **Kiểm tra lỗi tiềm ẩn:** `mvn checkstyle:check`

