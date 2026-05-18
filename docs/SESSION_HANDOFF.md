# 🤝 SESSION HANDOFF - MiniFaceBook Project

## 📅 Cập nhật ngày: 18/05/2026
## 🏁 Trạng thái hiện tại: Đã hoàn thành SPRINT 1.1 (Core Auth, RBAC, HttpOnly Cookie JWT & Refresh Token Rotation & Resend Email) & Chuẩn bị bước vào SPRINT 1.2

---

## 🛑 MANDATORY PROTOCOLS (BẮT BUỘC TUÂN THỦ)
1. **Docs Over Skills:** Nếu Skill mâu thuẫn với Docs, AI PHẢI dừng lại, báo cáo USER và sửa Skill theo Docs. Tuyệt đối không tự ý làm sai lệch cấu trúc dự án.
2. **Anomaly Reporting:** Bất kỳ dấu hiệu bất thường nào (Lỗi Build, xung đột thư viện, mâu thuẫn logic) đều phải báo cáo ngay cho USER trước khi can thiệp.
3. **Architecture Guard:** Cấm phá vỡ quy tắc Clean Architecture. Phải chạy `mvn test` để kiểm tra `ArchitectureTest.java` sau mỗi thay đổi lớn.

---

### ✅ Công việc đã hoàn thành (Sprint 1.1)
- **Domain Modeling & Persistence:** Thiết kế domain model `User` độc lập hoàn toàn với framework, triển khai `UserRepositoryImpl` mapping qua `UserDocument` lưu trong MongoDB.
- **High-Security Cookies:** Đổi toàn bộ luồng lưu token sang **HttpOnly Cookie** (chống XSS/CSRF) cho cả `accessToken` và `refreshToken`.
- **Refresh Token Rotation & Anti-Replay:** Triển khai xoay vòng refresh token, thu hồi token cũ ngay khi sử dụng lại. Nếu phát hiện token cũ đã bị sử dụng lại (kẻ gian replay attack), hệ thống lập tức xoá sạch toàn bộ active tokens của user đó để bảo vệ tài khoản.
- **Xác thực Email qua Resend:** Tích hợp Resend Email API gửi link xác thực kích hoạt tài khoản (`/auth/verify?token=...`), bắt buộc xác thực trước khi đăng nhập.
- **Swagger Documentation:** Cập nhật 100% Swagger OpenAPI cho các endpoint `/auth/register`, `/auth/login`, `/auth/verify`, `/auth/refresh`, `/auth/logout`.
- **ArchUnit Compliance:** Sắp xếp toàn bộ DTOs, Mappers, và các lớp hạ tầng bảo mật về đúng phân lớp Clean Architecture, đảm bảo kiểm thử kiến trúc pass 100%.

### 🔧 Lịch sử sửa đổi quan trọng
- Loại bỏ DTO thừa `AuthResponse.java` do token đã được tự động lưu trữ và quản lý qua HttpOnly Cookies ở tầng HTTP header.
- Thêm `RefreshToken` Entity ở Domain và `MongoRefreshTokenRepository` ở Infrastructure.

### 🚀 Nhiệm vụ tiếp theo (Sprint 1.2 - Phase 1: Frontend Foundation)
*   **Khởi tạo:** Thiết lập dự án React sử dụng Vite trong thư mục `frontend/`.
*   **Cài đặt UI Stack:** Tích hợp **Tailwind CSS v4**, **shadcn/ui**, và cấu hình các design tokens ban đầu.
*   **Client Core:** Cài đặt **TanStack Query** (React Query) để quản lý state và fetching API, **Zod** để validate form nhập liệu và Axios để gửi request kèm cookie bảo mật.
*   **Base Layout:** Xây dựng màn hình Đăng ký, Đăng nhập, và Trang chủ cơ bản tương thích với luồng Cookie-based Auth mới của Backend.

---
*Ghi chú: Luôn giữ file `TESTING_GUIDE.md` cập nhật để đảm bảo tính sẵn sàng của hệ thống.*
