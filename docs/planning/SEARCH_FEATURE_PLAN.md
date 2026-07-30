# 🔍 KẾ HOẠCH & THUẬT TOÁN TÌM KIẾM BÀI VIẾT & NGƯỜI DÙNG CHUẨN FACEBOOK (SEARCH FEATURE PLAN)

> **Dự án:** Monorepo MiniFaceBook (Hizo)  
> **Tệp tài liệu:** `docs/planning/SEARCH_FEATURE_PLAN.md`  
> **Mục tiêu:** Xây dựng tính năng Tìm kiếm đa năng thời gian thực (Real-time Instant Search Dropdown & Full Search Page) cho phép tìm kiếm cả **Bài viết (Posts)** và **Người dùng (Users)** chuẩn Facebook.

---

## 🎯 1. TỔNG QUAN VẤN ĐỀ & LUỒNG TRẢI NGHIỆM (UX FLOW)

### 🔴 Hiện trạng ô Tìm kiếm:
- Ô tìm kiếm trên Header hiện tại mới chỉ đóng vai trò làm Giao diện tĩnh (Placeholder), chưa được nối với API tìm kiếm thật ở Backend.

### 🟢 Giải pháp đề xuất (Chuẩn Facebook UX):
1. **Instant Search Dropdown ở Header (Sổ xuống tức thì):**
   - Khi người dùng gõ từ khóa vào ô Tìm kiếm trên Header $\rightarrow$ Kích hoạt cơ chế **Debounce 300ms** (chống bão request) $\rightarrow$ Tự động sổ xuống Popover Dropdown hiển thị 2 mục:
     - 👥 **Mọi người (Users):** Avatar, Tên người dùng và Nút Kết bạn/Nhắn tin.
     - 📝 **Bài viết (Posts):** Tên tác giả, đoạn trích nội dung bài viết khớp từ khóa và ngày đăng.
2. **Trang Tìm kiếm Toàn màn hình (`/search?q=...`):**
   - Khi bấm phím `Enter` hoặc chọn *"Xem tất cả kết quả"* $\rightarrow$ Chuyển sang Trang tìm kiếm toàn màn hình với **3 Tab phân loại**:
     - 🌐 **Tab Tất cả:** Tóm tắt người dùng liên quan + bài viết khớp từ khóa.
     - 📝 **Tab Bài viết:** Tất cả bài viết khớp từ khóa (có đầy đủ nút Thả tim, Bình luận, Chia sẻ).
     - 👥 **Tab Mọi người:** Danh sách người dùng khớp từ khóa (có nút Kết bạn / Nhắn tin / Xem profile).

---

## 🏛️ 2. THUẬT TOÁN & THIẾT KẾ BACKEND (JAVA SPRING BOOT 3 + MONGODB)

Theo đúng thiết kế đã chốt, hệ thống Backend sẽ tách làm **2 API tìm kiếm chuyên biệt**:

### A. API Tìm kiếm Bài viết (`GET /api/posts/search?q={keyword}&page=0&size=10`)
- **Thuật toán truy vấn MongoDB:**
  - Sử dụng phương thức Regex không phân biệt hoa thường (Case-Insensitive Regex) trên trường `content` của `posts` collection.
  - Lọc điều kiện bắt buộc: `deleted == false`.
- **Query MongoDB:**
  ```java
  Page<PostDocument> findByContentContainingIgnoreCaseAndDeletedFalse(String content, Pageable pageable);
  ```
- **Mapping DTO:** Biến đổi danh sách `PostDocument` thành `PostResponse` có thông tin Tác giả (Tên, Avatar), Số lượt Thả tim, Số lượng Bình luận.

### B. API Tìm kiếm Người dùng (`GET /api/users/search?q={keyword}&page=0&size=10`)
- **Thuật toán truy vấn MongoDB:**
  - Khớp từ khóa với trường `name` HOẶC `email` của `users` collection.
- **Query MongoDB:**
  ```java
  Page<UserDocument> findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(String name, String email, Pageable pageable);
  ```
- **Mapping DTO:** Biến đổi `UserDocument` thành `UserResponse` kèm trạng thái Online/Offline thời gian thực từ `PresenceService`.

---

## 🎨 3. THIẾT KẾ FRONTEND (REACT + TYPESCRIPT + TAILWIND CSS)

### A. Service Layer (`searchService.ts`)
- Khai báo 2 hàm gọi API Backend:
  - `searchPosts(query: string, page = 0, size = 10)`
  - `searchUsers(query: string, page = 0, size = 10)`

### B. Header Instant Search Dropdown (`MainLayout.tsx`)
- **Kỹ thuật Debounce 300ms:** Sử dụng `useDebounce` hook hoặc `setTimeout` để trì hoãn 300ms sau khi người dùng ngừng gõ phím mới phát request gọi 2 API `searchPosts` và `searchUsers`.
- **UI Popover Dropdown:** Mở bảng sổ xuống ngay bên dưới ô Input:
  ```tsx
  {showSearchDropdown && (
    <div className="absolute top-full left-0 mt-2 w-[420px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-[200] overflow-hidden">
      {/* Khung Mọi người */}
      {/* Khung Bài viết */}
    </div>
  )}
  ```

### C. Trang Tìm kiếm Toàn màn hình (`SearchPage.tsx`)
- Tạo tuyến đường `/search` trong `App.tsx`.
- Thiết kế 3 Tab chuyển đổi linh hoạt: **Tất cả**, **Bài viết**, **Mọi người**.
- Tích hợp trực tiếp các component bài viết `PostCard` để người dùng có thể Thả tim, Bình luận trực tiếp ngay trên trang kết quả tìm kiếm!

---

## 🧪 4. KẾ HOẠCH KIỂM THỬ VÀ XÁC MINH (VERIFICATION PLAN)

### 1. Automated Tests:
- Chạy `mvn test` ở Backend để đảm bảo API tìm kiếm không bị nổ lỗi hay vi phạm ArchUnit Clean Architecture.
- Chạy `npm run build` ở Frontend để kiểm tra biên dịch TypeScript.

### 2. Manual Verification:
- **Test Dropdown Header:** Gõ từ khóa `test` $\rightarrow$ Đợi 300ms $\rightarrow$ Kiểm tra xem Popover có hiện 2 mục Người dùng và Bài viết không.
- **Test Phím Enter:** Gõ `Nguyễn` và bấm phím `Enter` $\rightarrow$ Chuyển sang `/search?q=Nguy%E1%BB%85n`.
- **Test 3 Tab:** Bấm qua lại giữa Tab "Tất cả", "Bài viết", "Mọi người" để kiểm tra tính chính xác của dữ liệu.

---

## 📑 5. ĐỒNG BỘ TÀI LIỆU (DOCS PROTOCOL)
Cập nhật đầy đủ các file tài liệu sau khi hoàn thành:
1. `docs/planning/PROGRESS.md`
2. `docs/planning/ROADMAP.md`
3. `docs/session/SESSION_HANDOFF.md`
4. `docs/guidelines/CV_PORTFOLIO_HIGHLIGHTS.md`
5. `README.md`
