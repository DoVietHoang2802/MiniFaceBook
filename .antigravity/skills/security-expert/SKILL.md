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
