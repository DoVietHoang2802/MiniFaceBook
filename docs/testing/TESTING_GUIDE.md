# 🧪 HƯỚNG DẪN KIỂM THỬ (TESTING & RUNNING GUIDE)

*Tài liệu này hướng dẫn cách vận hành và kiểm tra các tính năng nền tảng đã hoàn thành sau Phase 0.*

---

## 🏗️ 1. Khởi động hạ tầng (Infrastructure)

Dự án sử dụng Docker để quản lý Database. Hãy đảm bảo bạn đã cài đặt Docker Desktop.

```bash
# Khởi động MongoDB và Redis
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
2. **Xác thực Email qua Mailpit UI (Môi trường Dev):**
   * Mở trình duyệt và truy cập **Web UI của Mailpit** tại địa chỉ: `http://localhost:8025`
   * Bạn sẽ thấy một hộp thư thật vô cùng đẹp mắt. Nhấp vào email xác thực tài khoản gửi từ MiniFaceBook.
3. Nhấp trực tiếp vào nút hoặc đường link kích hoạt trong email có định dạng:
   `http://localhost:8080/api/auth/verify?token=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
4. **Kỳ vọng:** Trình duyệt mở tab mới và hiển thị thông báo xác thực thành công: `Email verified successfully! You can now log in.`

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

## 🌐 4. Kiểm thử Frontend & API Integration (Sprint 1.2 & 1.3)

### 4.1. Khởi chạy song song Backend và Frontend
1. Khởi chạy Docker hạ tầng và Backend Spring Boot (Xem mục 1 và 2).
2. Di chuyển vào thư mục `frontend` và khởi chạy máy chủ phát triển Vite:
   ```bash
   cd frontend
   npm run dev
   ```
3. Mở trình duyệt và truy cập: `http://localhost:5173`

### 4.2. Kịch bản test luồng Đăng ký & Đăng nhập trực quan
1. **Kiểm thử Đăng ký (Register Form):**
   * Chuyển sang Tab **Đăng ký** trên giao diện.
   * Nhập các thông tin hợp lệ (Zod Schema sẽ validate trực quan thời gian thực). Nhấp **Đăng ký**.
   * Hệ thống sẽ tự động gọi API `/auth/register` và gửi mail kích hoạt ảo về Mailpit.
   * Mở `http://localhost:8025` (Mailpit Web UI), nhấp vào email và nhấp link kích hoạt để kích hoạt tài khoản.
2. **Kiểm thử Đăng nhập (Login Form):**
   * Quay lại giao diện chính của app, nhập Email và Mật khẩu vừa kích hoạt. Nhấp **Đăng nhập**.
   * Hệ thống sẽ chuyển hướng mượt mà và hiển thị thông báo Đăng nhập thành công!
3. **Kiểm tra Cookie lưu trữ (HttpOnly Cookie):**
   * Nhấn chuột phải chọn **Inspect (Kiểm tra)** để mở Chrome DevTools.
   * Chuyển sang tab **Application (Ứng dụng)** -> Chọn **Cookies** ở thanh bên trái -> Chọn `http://localhost:5173` (hoặc `http://localhost:8080`).
   * Bạn sẽ thấy xuất hiện hai cookie **`accessToken`** và **`refreshToken`** có thuộc tính **`HttpOnly`** được tích chọn (Cookie này được bảo vệ tuyệt đối, mã Javascript Client không thể đọc/ghi được, chống hoàn toàn nguy cơ tấn công XSS).
4. **Kiểm thử Silent Refresh (Mutex Lock):**
   * Mở tab **Network (Mạng)** trong DevTools.
   * Chờ sau 1 tiếng (hoặc cấu hình thời gian sống Access Token ngắn lại để test).
   * Khi gọi các API tiếp theo, bạn sẽ thấy xuất hiện một request gọi ngầm `/api/auth/refresh` trả về 200, ngay sau đó các request chính ban đầu được tự động gửi lại thành công mượt mà không hề làm gián đoạn trải nghiệm của người dùng.

---

## 🛠️ 5. Lệnh hữu ích khác
- **Dọn dẹp code style:** `mvn spotless:apply`
- **Kiểm tra lỗi tiềm ẩn:** `mvn checkstyle:check`

---

## � 6. Hướng dẫn kiểm thử theo từng Phase

Để dễ đọc và dễ tra cứu, hướng dẫn test chi tiết của mỗi Phase được tách thành file riêng trong thư mục `docs/testing/`:

| Phase | File hướng dẫn | Nội dung |
|:-----:|----------------|----------|
| Phase 3 | **[PHASE_3_FRIENDS_TESTING.md](./PHASE_3_FRIENDS_TESTING.md)** | Friend Request, Friend List, Search |
| Phase 4 | **[PHASE_4_CHAT_TESTING.md](./PHASE_4_CHAT_TESTING.md)** | WebSocket, Redis Presence, JWT Blacklist |
