# 🤝 SESSION HANDOFF - MiniFaceBook Project

## 📅 Cập nhật ngày: 19/05/2026
## 🏁 Trạng thái hiện tại: Đã hoàn thành 100% SPRINT 1.4 (Profile & Media - Hoàn tất Task 1) và sẵn sàng bước vào SPRINT 2.1 (Post System) của Phase 2

---

## 🛑 MANDATORY PROTOCOLS (BẮT BUỘC TUÂN THỦ)
1. **Docs Over Skills:** Nếu Skill mâu thuẫn với Docs, AI PHẢI dừng lại, báo cáo USER và sửa Skill theo Docs. Tuyệt đối không tự ý làm sai lệch cấu trúc dự án.
2. **Anomaly Reporting:** Bất kỳ dấu hiệu bất thường nào (Lỗi Build, xung đột thư viện, mâu thuẫn logic) đều phải báo cáo ngay cho USER trước khi can thiệp.
3. **Architecture Guard:** Cấm phá vỡ quy tắc Clean Architecture. Phải chạy `mvn test` để kiểm tra `ArchitectureTest.java` sau mỗi thay đổi lớn ở Backend.
4. **Default UI/UX Skill:** Mặc định tự động kích hoạt và tuân thủ 100% cẩm nang [ui-ux-pro-max](file:///d:/Project_MiniFace/.antigravity/skills/ui-ux-pro-max/SKILL.md) và cẩm nang thiết kế [docs/guidelines/UI_UX_DESIGN.md](file:///d:/Project_MiniFace/docs/guidelines/UI_UX_DESIGN.md) cho tất cả các tác vụ liên quan đến giao diện, thiết kế, Frontend và CSS.
5. **Session Bootstrap Verification (Bắt buộc Khởi động Phiên):** AI ở lượt trả lời đầu tiên của phiên mới **bắt buộc** phải tuân thủ nghiêm ngặt **Luật 9.6 (AI_GUIDELINES.md)**, chạy lệnh đọc 5 tệp tài liệu cốt lõi (`README.md`, `docs/session/SESSION_HANDOFF.md`, `docs/planning/ROADMAP.md`, `docs/planning/PROGRESS.md`, `docs/guidelines/AI_GUIDELINES.md`) và in ra bảng **Startup Verification Table** tóm tắt mục tiêu phiên để chứng minh đã đọc, trước khi được làm bất kỳ việc gì khác.

---

### ✅ Công việc đã hoàn thành (Sprint 1.1 -> Sprint 1.3)

#### A. Backend (Spring Boot 3.x)
- **Domain Modeling & Persistence:** Thiết kế domain model `User` độc lập framework, triển khai `UserRepositoryImpl` mapping qua `UserDocument` lưu trong MongoDB.
- **High-Security Cookies:** Lưu trữ tokens qua **HttpOnly Cookie** (`accessToken` và `refreshToken`) chống nguy cơ tấn công XSS/CSRF.
- **Refresh Token Rotation & Anti-Replay:** Triển khai xoay vòng refresh token, thu hồi token cũ ngay khi sử dụng lại. Nếu phát hiện Replay Attack, hệ thống xóa sạch toàn bộ active tokens của user.
- **Xác thực Email qua Resend:** Tích hợp Resend Email API gửi link xác thực kích hoạt tài khoản (`/auth/verify?token=...`), bắt buộc kích hoạt trước khi cho phép đăng nhập.
- **Swagger Documentation:** Cập nhật 100% Swagger OpenAPI cho các endpoint xác thực.
- **ArchUnit & Security Auditing:** Sắp xếp phân lớp Clean Architecture đạt chuẩn 100% test case ArchUnit. Vá thành công lỗ hổng bảo mật vô hiệu hóa token trong database (`revoked: true`) khi người dùng logout.

#### B. Frontend (React 19 + Vite + TypeScript)
- **Kiến trúc Modular Phân Lớp:** Tổ chức dự án theo chuẩn [docs/architecture/FRONTEND_ARCHITECTURE.md](file:///d:/Project_MiniFace/docs/architecture/FRONTEND_ARCHITECTURE.md) với core, components, và modules nghiệp vụ khép kín.
- **Form & Zod Validations:** Thiết kế `LoginForm`, `RegisterForm` và `authSchema` đảm bảo lọc và chuẩn hóa dữ liệu sạch từ Client-side.
- **Silent Refresh & Axios Mutex Lock:** Triển khai Axios Client có Interceptor tự động xoay vòng Access Token ngầm sử dụng cơ chế hàng chờ Promise Queue (`failedQueue`) và cờ hiệu `isRefreshing` để triệt tiêu lỗi Token Refresh Storm.
- **TS verbatimModuleSyntax Optimization:** Giải quyết triệt để lỗi biên dịch ES module runtime bằng cách phân tách độc lập import type.
- **Premium UI/UX Integration (Sprint 1.3 - MỚI HOÀN THÀNH):**
  - **Khắc phục lỗi responsive tràn Viewport:** Sửa đổi cấu trúc layout container bên ngoài từ vị trí cố định (`h-screen overflow-hidden`) sang dạng linh động (`min-h-screen overflow-x-hidden overflow-y-auto w-full md:h-screen md:overflow-hidden`) kết hợp giảm padding trên mobile (`pt-4 pb-8 md:p-0`). Nhờ đó, tiêu đề *"Chào mừng trở lại"*, *"Tạo tài khoản mới"*, nút Google Login, và các thông tin pháp lý bên dưới đều hiển thị 100% rõ nét, không bị vỡ hay cắt xén trên mọi độ phân giải.
  - **Thanh đo mật khẩu Password Strength Meter:** Tích hợp bộ đo độ mạnh mật khẩu thời gian thực (5 mức độ: *Yếu, Trung bình, Tốt, Mạnh, Rất Mạnh*) với màu sắc progress bar sống động và thông điệp hướng dẫn rõ ràng.
  - **Hiệu ứng vi chuyển động cao cấp (Premium Animations):**
    - `animate-fade-in-up`: Xuất hiện mượt mà từ dưới lên khi tải trang hoặc đổi tab.
    - `animate-shake`: Rung lắc nhẹ phản hồi trực quan khi điền sai thông tin đầu vào.
    - `.glass-focus-glow`: Hộp nhập liệu phát sáng mờ ảo khi được active.
  - **Kiểm thử trực quan (Visual Verification):** Chạy kiểm thử thành công qua Browser Subagent và chụp lại ảnh màn hình thực tế, xác nhận LoginForm và RegisterForm hiển thị cực kỳ sang trọng, sắc nét, đúng chuẩn thiết kế premium.

---

### 🚀 Nhiệm vụ tiếp theo (Sprint 1.4 - Phase 1 Finalization & Phase 2 Outlook)
1. **Hoàn thành trọn vẹn Phase 1 (Sprint 1.4: Profile & Media) với Tiêu chuẩn Bảo mật & Tối ưu hóa:**
   * **Backend (Bảo mật Media nâng cao):**
     * Tích hợp Cloudinary Service vào Shared Module, xây dựng API Get Me (`GET /api/auth/me`) & Update Profile (`PUT /api/user/profile`), API Upload Avatar.
     * **Bảo mật Magic Bytes:** Tích hợp thư viện **Apache Tika** để kiểm tra Magic Bytes (chữ ký nhị phân) của file upload. **TUYỆT ĐỐI CẤM** chỉ kiểm tra đuôi file thủ công. Phải chặn đứng 100% các file thực thi nguy hiểm (.exe, .sh) giả dạng ảnh trước khi đẩy lên Cloudinary.
     * **Xử lý lỗi tập trung:** Viết Global Exception Handler xử lý triệt để ngoại lệ `MaxUploadSizeExceededException` để phản hồi mã lỗi mượt mà thay vì làm sập hoặc treo kết nối máy chủ khi người dùng cố ý gửi tệp dung lượng khủng.
   * **Frontend (Trang cá nhân & Tối ưu hóa băng thông):**
     * Tích hợp Cloudinary Client, xây dựng màn hình **Trang cá nhân (Profile Page - GiaoDienCaNhan.png)** Premium hỗ trợ xem thông tin, chỉnh sửa trang cá nhân và upload avatar.
     * **Zod File Validation:** Thiết lập schema Zod kiểm soát file chặt chẽ, kiểm tra trực tiếp kích thước (`file.size <= 5 * 1024 * 1024` - 5MB) và kiểm tra MIME type ảnh thật ngay tại trình duyệt trước khi gửi request, triệt tiêu 100% băng thông rác.
     * Áp dụng hiệu ứng vi tương tác Premium (Focus Glassmorphic Glow, Avatar Ripple Pulse và Upload Media trực quan).
2. **Chuẩn bị hạ tầng cho Phase 2 (Content & News Feed):**
   * **Sprint 2.1: Post System (Hạ tầng bài viết):** Thiết kế API đăng bài viết dạng Text/Image tích hợp với hạ tầng Cloudinary vừa hoàn thành ở Sprint 1.4, xây dựng cơ chế lấy News Feed thời gian thực.
   * **Sprint 2.2: Reactions & Comments (Tương tác bài viết):** Xây dựng logic Like/React và hệ thống Comment cấp 1 cho bài viết.

---
*Ghi chú: Luôn giữ file `TESTING_GUIDE.md` cập nhật để đảm bảo tính sẵn sàng kiểm thử của hệ thống.*
