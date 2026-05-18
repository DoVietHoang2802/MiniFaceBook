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

---

## 🛠️ 4. Lệnh hữu ích khác
- **Dọn dẹp code style:** `mvn spotless:apply`
- **Kiểm tra lỗi tiềm ẩn:** `mvn checkstyle:check`
