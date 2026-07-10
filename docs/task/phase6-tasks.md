# 📝 DANH SÁCH NHIỆM VỤ & KẾ HOẠCH TRIỂN KHAI PHASE 6 (PHASE 6 MASTER TASKS)

Tài liệu này là nguồn thông tin duy nhất (Single Source of Truth) quản lý và theo dõi toàn bộ tiến độ triển khai các cải tiến và giải quyết nợ kỹ thuật của **Phase 6: Navigation, Performance & Testing**.

---

## 📊 TIẾN ĐỘ TỔNG THỂ (OVERALL PROGRESS)
*   **Trạng thái:** 🟢 HOÀN THÀNH (COMPLETED)
*   **Hoàn thành:** 4/4 Tasks

---

## 🛠️ CHI TIẾT CÁC NHIỆM VỤ (TASK SPECIFICATION)

### 📌 TASK 1: Tích hợp Infinite Scroll cho Bảng tin (News Feed)
*   **Trạng thái:** 🟢 Hoàn thành
*   **Mục tiêu:** Chuyển đổi nút "Tải thêm bài viết" thủ công thành cơ chế tự động tải khi cuộn dựa trên Intersection Observer API.
*   **Files cần sửa đổi:**
    *   `frontend/src/modules/post/components/PostFeed.tsx`
*   **Các bước thực hiện:**
    - [x] Thêm `useRef` tạo phần tử mốc ở cuối danh sách bài viết.
    - [x] Lắng nghe sự kiện giao cắt (Intersection) của phần tử mốc để tự động tăng `page` và gọi `fetchPosts`.
    - [x] Thay thế nút bấm thủ công bằng hiệu ứng Loading Spinner (`Loader2`) tự động.

---

### 📌 TASK 2: Trang Cài đặt & Đổi mật khẩu (Account Settings Page)
*   **Trạng thái:** 🟢 Hoàn thành
*   **Mục tiêu:** Cho phép người dùng đã đăng nhập đổi mật khẩu, đồng thời tăng tính bảo mật bằng cách thu hồi tất cả các phiên đăng nhập khác.
*   **Files cần sửa/thêm mới:**
    *   `backend/src/main/java/com/minifacebook/module/auth/presentation/UserController.java` (Sửa)
    *   `backend/src/main/java/com/minifacebook/module/auth/application/service/AuthService.java` (Sửa)
    *   `frontend/src/modules/profile/components/SettingsPage.tsx` (Thêm mới)
    *   `frontend/src/App.tsx` (Sửa)
    *   `frontend/src/components/layout/MainLayout.tsx` (Sửa)
*   **Các bước thực hiện:**
    - [x] **Backend:** Tạo `ChangePasswordRequest` DTO, thêm API `PUT /user/change-password` xác thực mật khẩu cũ, mã hóa mật khẩu mới và gọi `refreshTokenRepository.deleteByEmail(email)` để logout các thiết bị khác.
    - [x] **Frontend:** Xây dựng màn hình `SettingsPage.tsx` với giao diện Slate Premium, Zod validation, và tích hợp định tuyến `/settings`.

---

### 📌 TASK 3: Đồng bộ lỗi AppException cho Post module
*   **Trạng thái:** 🟢 Hoàn thành
*   **Mục tiêu:** Loại bỏ các lỗi Java `RuntimeException` thô trong Post module, chuyển sang sử dụng `AppException` chuẩn hóa để client nhận thông báo lỗi thân thiện.
*   **Files cần sửa đổi:**
    *   `backend/src/main/java/com/minifacebook/shared/exception/ErrorCode.java`
    *   `backend/src/main/java/com/minifacebook/module/post/application/service/PostService.java`
    *   `backend/src/main/java/com/minifacebook/module/post/application/service/CommentService.java`
    *   `backend/src/main/java/com/minifacebook/module/post/application/service/ReactionService.java`
*   **Các bước thực hiện:**
    - [x] Bổ sung mã lỗi `POST_NOT_FOUND` (5001), `COMMENT_NOT_FOUND` (5002), và `POST_UNAUTHORIZED` (5003) vào `ErrorCode.java`.
    - [x] Thay thế lệnh `throw new RuntimeException(...)` trong Post module bằng `throw new AppException(...)`.

---

### 📌 TASK 4: Vá lỗi đồng bộ cache Profile người dùng trên Redis
*   **Trạng thái:** 🟢 Hoàn thành
*   **Mục tiêu:** Khắc phục lỗi dữ liệu profile bị cũ khi truy cập bằng ID do API cập nhật chỉ xóa cache theo Email mà bỏ quên cache theo ID.
*   **Files cần sửa đổi:**
    *   `backend/src/main/java/com/minifacebook/module/auth/application/service/AuthService.java`
*   **Các bước thực hiện:**
    - [x] Cập nhật phương thức `updateProfile` và `uploadAvatar`.
    - [x] Bổ sung lệnh xóa khóa cache `user:profile:id:` + userId bên cạnh việc xóa cache email.

---

## 🧪 QUY TRÌNH KIỂM THỬ & BÀN GIAO (VERIFICATION)
1.  **Local Testing:** Khởi chạy Backend và Frontend local, chạy thử các luồng nghiệp vụ.
2.  **Playwright Tests:** Chạy `npx playwright test` để đảm bảo hệ thống không bị lỗi hồi quy (regression).
3.  **CI/CD Pipeline:** Push mã nguồn lên GitHub, kiểm tra build và SonarCloud Quality Gate chạy thành công.
