# 🤝 SESSION HANDOFF - MiniFaceBook Project

## 📅 Cập nhật ngày: 18/05/2026
## 🏁 Trạng thái hiện tại: Đã hoàn thành PHASE 0 & Chuẩn bị bước vào PHASE 1

---

## 🛑 MANDATORY PROTOCOLS (BẮT BUỘC TUÂN THỦ)
1. **Docs Over Skills:** Nếu Skill mâu thuẫn với Docs, AI PHẢI dừng lại, báo cáo USER và sửa Skill theo Docs. Tuyệt đối không tự ý làm sai lệch cấu trúc dự án.
2. **Anomaly Reporting:** Bất kỳ dấu hiệu bất thường nào (Lỗi Build, xung đột thư viện, mâu thuẫn logic) đều phải báo cáo ngay cho USER trước khi can thiệp.
3. **Architecture Guard:** Cấm phá vỡ quy tắc Clean Architecture. Phải chạy `ArchitectureTest.java` sau mỗi thay đổi lớn.

---

### ✅ Công việc đã hoàn thành (Phase 0)
- **Architecture:** Thiết lập bộ khung Modular Clean Architecture chuẩn Senior.
- **Security:** Stateless JWT, BCrypt, Rate Limiting (Bucket4j), cùng bộ xử lý Unauthenticated toàn cục.
- **Quality:** ArchUnit, Checkstyle, Spotless đã kích hoạt và hoạt động hoàn hảo.
- **Docs:** Swagger UI hoạt động tại `/api/docs`.

### 🔧 Fix History (Lịch sử kỷ luật)
- **ArchUnit 1.3.0 Standardized:** Cấu hình thành công `.withOptionalLayers(true)` trong [ArchitectureTest.java](file:///d:/Project_MiniFace/backend/src/test/java/com/minifacebook/ArchitectureTest.java#L23) để hỗ trợ các tầng trống khi bootstrapping tính năng mới.
- **Global Unauthenticated Standardized:** Tạo [JwtAuthenticationEntryPoint.java](file:///d:/Project_MiniFace/backend/src/main/java/com/minifacebook/infrastructure/security/JwtAuthenticationEntryPoint.java) và cấu hình toàn cục trong [SecurityConfig.java](file:///d:/Project_MiniFace/backend/src/main/java/com/minifacebook/infrastructure/security/SecurityConfig.java#L70) giúp chặn đứng rò rỉ trang HTML mặc định của Tomcat và thay bằng JSON `{ "status": 1002, "message": "Unauthenticated" }` cho toàn bộ các request không truyền Token.
- **PowerShell Compatibility:** Đồng bộ toàn bộ tài liệu kiểm thử [TESTING_GUIDE.md](file:///d:/Project_MiniFace/docs/TESTING_GUIDE.md#L35) sử dụng lệnh `curl.exe` tương thích tuyệt đối với môi trường Windows PowerShell.

### 🚀 Nhiệm vụ tiếp theo (Sprint 1.1 - Phase 1: Authentication)
*   **Mở đầu:** Thiết kế **User Entity** (Domain Layer tại `com.minifacebook.module.auth.domain.model.User`) theo đúng chuẩn Domain-Driven Design (không chứa annotation JPA/Framework) và **UserRepository** interface.
*   **Tiếp theo:** Phát triển Service đăng ký (Register - mã hóa BCrypt) và đăng nhập (Login - phát sinh Access/Refresh Token).
*   **Bảo mật nâng cao:** Tích hợp RBAC (Role-Based Access Control) để phân quyền API.

---
*Ghi chú: Luôn giữ file `TESTING_GUIDE.md` cập nhật để đảm bảo tính sẵn sàng của hệ thống.*
