# 🧪 HƯỚNG DẪN KIỂM THỬ PHASE 6 - CẢI TIẾN & VÁ LỖI ĐỒNG BỘ

> **Tài liệu hướng dẫn test chi tiết cho Phase 6.** Bao gồm hướng dẫn kiểm thử tự động (Automated tests) và kiểm thử thủ công (Manual tests).

---

## 📌 1. CHẠY THỬ NGHIỆM KIỂM THỬ TỰ ĐỘNG (AUTOMATED TESTING)

Dự án đã tích hợp đầy đủ test tự động cho các chức năng của Phase 6.

### 1.1. Backend Integration Tests (JUnit 5)
Chạy test tích hợp đổi mật khẩu và cache:
```bash
cd backend
mvn test -Dtest=AuthIntegrationTest
```
*   **Kỳ vọng:** `BUILD SUCCESS`. Cả 2 test case `testRegisterVerifyProfileAndCachingFlow` (test cache profile) và `testChangePasswordFlow` (test đổi mật khẩu) đều vượt qua.

### 1.2. Frontend E2E Tests (Playwright)
Chạy test kịch bản đổi mật khẩu tự động trên trình duyệt:
```bash
cd frontend
npx playwright test tests/settings.spec.ts
```
*   **Kỳ vọng:** `settings.spec.ts` chạy thành công 100%, thực hiện đúng luồng đăng ký -> kích hoạt -> đăng nhập -> đổi mật khẩu -> tự động logout -> đăng nhập lại bằng mật khẩu mới.

---

## 📌 2. KỊCH BẢN KIỂM THỬ THỦ CÔNG (MANUAL TEST SCENARIOS)

### 2.1. Sprint 6.1 - Cuộn vô hạn (Infinite Scroll) cho Bảng tin
1. Đăng nhập vào hệ thống.
2. Chuẩn bị khoảng 15-20 bài viết trong database (hoặc bấm tạo bài viết liên tục).
3. Truy cập Bảng tin (Trang chủ).
4. Cuộn màn hình xuống dưới cùng.
5. **Kỳ vọng:**
   - Hệ thống tự động gọi API lấy trang tiếp theo (`page = 1, page = 2...`).
   - Hiển thị biểu tượng Loading xoay tròn khi đang tải bài viết mới.
   - Khi đã cuộn hết dữ liệu, xuất hiện thông báo: `"✨ Bạn đã xem hết bài viết"`.

### 2.2. Sprint 6.2 - Đổi mật khẩu trong Trang Cài đặt
1. Click mục **Cài đặt** ở sidebar bên trái hoặc menu góc avatar.
2. Điền sai Mật khẩu hiện tại -> Bấm Đổi mật khẩu.
   - **Kỳ vọng:** Xuất hiện thông báo lỗi `"Email hoặc mật khẩu không chính xác"`.
3. Điền Mật khẩu mới dưới 6 ký tự.
   - **Kỳ vọng:** Giao diện hiển thị cảnh báo đỏ `"Mật khẩu mới phải có ít nhất 6 ký tự"`.
4. Điền Mật khẩu xác nhận không trùng khớp.
   - **Kỳ vọng:** Cảnh báo `"Mật khẩu xác nhận không khớp"`.
5. Điền đúng và đầy đủ thông tin -> Bấm Đổi mật khẩu.
   - **Kỳ vọng:** 
     - Toast thông báo đổi mật khẩu thành công.
     - Hệ thống tự động xóa toàn bộ Access / Refresh token và đưa người dùng về trang đăng nhập `/login`.
     - Bạn phải dùng mật khẩu mới để đăng nhập lại.

### 2.3. Sprint 6.3 - Đồng bộ lỗi AppException cho Post module
1. Mở Postman hoặc Swagger tại `http://localhost:8080/api/docs`.
2. Đăng nhập để lấy quyền thực thi.
3. Gọi API xóa bài viết không tồn tại: `DELETE /api/posts/000000000000000000000000`.
   - **Kỳ vọng:** HTTP Status `404 Not Found`, JSON trả về chứa mã lỗi `5001` (POST_NOT_FOUND).
4. Gọi API xóa bình luận không tồn tại: `DELETE /api/comments/000000000000000000000000`.
   - **Kỳ vọng:** HTTP Status `404 Not Found`, JSON trả về chứa mã lỗi `5002` (COMMENT_NOT_FOUND).
5. Đăng nhập tài khoản A, tạo một bài viết. Đăng nhập tài khoản B, cố tình gọi API xóa bài viết của A.
   - **Kỳ vọng:** HTTP Status `403 Forbidden`, JSON trả về chứa mã lỗi `5003` (POST_UNAUTHORIZED).

### 2.4. Sprint 6.4 - Vá lỗi đồng bộ cache Profile người dùng trên Redis
1. Sử dụng công cụ Redis CLI hoặc Redis Desktop Manager để giám sát các key trong Redis.
2. Đăng nhập và truy cập trang cá nhân của bạn bằng ID (ví dụ: `/profile/6a193b9bb4b52b6b096a4e51`).
   - Kiểm tra Redis: Đã sinh ra cache key `user:profile:id:6a193b9bb4b52b6b096a4e51`.
3. Vào trang cài đặt thông tin cá nhân hoặc đổi ảnh đại diện -> Nhấn cập nhật.
4. **Kỳ vọng:**
   - Cả 2 cache key `user:profile:email:<email>` và `user:profile:id:<id>` đều biến mất khỏi Redis (đã bị Evict thành công).
   - Truy cập lại trang cá nhân của bạn -> Dữ liệu mới cập nhật hiển thị ngay lập tức (không hiển thị avatar/bio cũ).
