# Security & Auth Expert

## 🎯 Mục tiêu
Bảo vệ hệ thống khỏi các cuộc tấn công phổ biến và quản lý danh tính người dùng an toàn.

## 🛠 Quy tắc vàng
- **Authentication:** Sử dụng **Refresh Token Rotation** + HttpOnly Cookies.
- **Password:** Luôn băm mật khẩu bằng `bcrypt`. Tuyệt đối không trả về mật khẩu trong API.
- **Protection:** Cấu hình **Bucket4j** hoặc Spring Security Rate Limiting để chống Brute-force và Spam.
- **Validation:** Validate chặt chẽ dữ liệu đầu vào qua DTO và Zod.

## 🔄 Mandatory Post-Task Workflow (BẮT BUỘC)
Sau mỗi Task, phải tự động:
1. Cập nhật **PROGRESS.md** và **ROADMAP.md**.
2. **Cập nhật Internal Skills** nếu có kiến thức mới.
3. Kiểm tra tính đồng bộ của toàn bộ file tài liệu (.md).
4. Báo cáo các file đã cập nhật.

## 💡 Tư duy Senior
- Bảo mật là một quá trình, không phải là một tính năng.
- Luôn giả định rằng hacker có thể xâm nhập và thiết kế các lớp phòng thủ chiều sâu.

## 🔒 Thực tế triển khai tại MiniFaceBook (Sprint 1.1)

### 1. Cookie-based HttpOnly JWT
- Không trả về Token trong JSON response body để tránh rò rỉ qua LocalStorage (XSS).
- Cả `accessToken` và `refreshToken` đều được trả về qua Header `Set-Cookie`:
  - `accessToken`: Hạn dùng 1 giờ, `httpOnly = true`, `secure = false` (trong dev) / `true` (trong prod), `sameSite = "Strict"`, `path = "/api"`.
  - `refreshToken`: Hạn dùng 7 ngày, các thuộc tính bảo mật tương tự.

### 2. Refresh Token Rotation (Xoay vòng Token)
- Tận dụng thực thể `RefreshToken` lưu trữ trong MongoDB với các trường: `token`, `user`, `expiryDate`, `revoked`.
- Mỗi khi gọi `/auth/refresh`:
  - Thu hồi token cũ bằng cách set `revoked = true` trong cơ sở dữ liệu.
  - Cấp phát cặp `accessToken` và `refreshToken` mới.
  - **Phát hiện Replay Attack:** Nếu một token đã bị `revoked = true` được gửi lên, hệ thống sẽ xóa toàn bộ các token đang hoạt động của user đó, ép buộc đăng nhập lại để đảm bảo an toàn tuyệt đối.

### 3. Xác thực Email qua Resend
- Đăng ký mới sẽ tạo `verificationToken` và `verified = false`.
- Gọi email service (Resend REST Client) gửi link xác thực.
- Kích hoạt tài khoản thông qua `/auth/verify?token=...`.

