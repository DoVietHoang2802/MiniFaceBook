# 🤝 SESSION HANDOFF - MiniFaceBook Project

## 📅 Cập nhật ngày: 19/05/2026
## 🏁 Trạng thái hiện tại: Đã hoàn thành 100% SPRINT 2.1 (Post System - Giao diện 3 cột Premium, vi tương tác và Đồng bộ Tài liệu/Skill) và sẵn sàng bước vào SPRINT 2.2 (Reactions & Comments) của Phase 2

---

## 🛑 MANDATORY PROTOCOLS (BẮT BUỘC TUÂN THỦ)
1. **Docs Over Skills:** Nếu Skill mâu thuẫn với Docs, AI PHẢI dừng lại, báo cáo USER và sửa Skill theo Docs. Tuyệt đối không tự ý làm sai lệch cấu trúc dự án.
2. **Anomaly Reporting:** Bất kỳ dấu hiệu bất thường nào (Lỗi Build, xung đột thư viện, mâu thuẫn logic) đều phải báo cáo ngay cho USER trước khi can thiệp.
3. **Architecture Guard:** Cấm phá vỡ quy tắc Clean Architecture. Phải chạy `mvn test` để kiểm tra `ArchitectureTest.java` sau mỗi thay đổi lớn ở Backend.
4. **Default UI/UX Skill:** Mặc định tự động kích hoạt và tuân thủ 100% cẩm nang [ui-ux-pro-max](file:///d:/Project_MiniFace/.antigravity/skills/ui-ux-pro-max/SKILL.md) và cẩm nang thiết kế [docs/guidelines/UI_UX_DESIGN.md](file:///d:/Project_MiniFace/docs/guidelines/UI_UX_DESIGN.md) cho tất cả các tác vụ liên quan đến giao diện, thiết kế, Frontend và CSS.
5. **Session Bootstrap Verification (Bắt buộc Khởi động Phiên):** AI ở lượt trả lời đầu tiên của phiên mới **bắt buộc** phải tuân thủ nghiêm ngặt **Luật 9.6 (AI_GUIDELINES.md)**, chạy lệnh đọc 5 tệp tài liệu cốt lõi (`README.md`, `docs/session/SESSION_HANDOFF.md`, `docs/planning/ROADMAP.md`, `docs/planning/PROGRESS.md`, `docs/guidelines/AI_GUIDELINES.md`) và in ra bảng **Startup Verification Table** tóm tắt mục tiêu phiên để chứng minh đã đọc, trước khi được làm bất kỳ việc gì khác.

---

### ✅ Công việc đã hoàn thành (Sprint 1.1 -> Sprint 2.1)

#### A. Backend (Spring Boot 3.x)
- **Domain Modeling & Persistence:** Thiết kế domain model `User` độc lập framework, triển khai `UserRepositoryImpl` mapping qua `UserDocument` lưu trong MongoDB.
- **High-Security Cookies:** Lưu trữ tokens qua **HttpOnly Cookie** (`accessToken` và `refreshToken`) chống nguy cơ tấn công XSS/CSRF.
- **Refresh Token Rotation & Anti-Replay:** Triển khai xoay vòng refresh token, thu hồi token cũ ngay khi sử dụng lại. Nếu phát hiện Replay Attack, hệ thống xóa sạch toàn bộ active tokens của user.
- **Xác thực Email qua Resend:** Tích hợp Resend Email API gửi link xác thực kích hoạt tài khoản (`/auth/verify?token=...`), bắt buộc kích hoạt trước khi cho phép đăng nhập.
- **Swagger Documentation:** Cập nhật 100% Swagger OpenAPI cho các endpoint xác thực.
- **ArchUnit & Security Auditing:** Sắp xếp phân lớp Clean Architecture đạt chuẩn 100% test case ArchUnit. Vá thành công lỗ hổng bảo mật vô hiệu hóa token trong database (`revoked: true`) khi người dùng logout.
- **Media Upload Bảo mật (Sprint 1.4):** Tích hợp Cloudinary kết hợp bộ quét nhị phân **Apache Tika (Magic Bytes)** ngăn chặn hoàn toàn việc tải lên file độc hại giả dạng đuôi ảnh. Thiết lập xử lý ngoại lệ `MaxUploadSizeExceededException` mượt mà cho file >5MB.
- **Tái cấu trúc Sạch - Shared Core (Sprint 1.4):** Tránh phụ thuộc chéo khi bước sang Phase 2 bằng cách đưa `MediaService` (Domain Interface) và `CloudinaryService` (Adapter) ra phân vùng `shared` dùng chung. Được xác thực hoàn toàn qua ArchUnit với 0 lỗi vi phạm.
- **Hạ tầng bài viết & API (Sprint 2.1):** Tạo module `post` hoàn chỉnh chuẩn Clean Architecture. Hỗ trợ tạo bài viết (`POST /api/posts`) có nhiều ảnh qua Cloudinary và API lấy bảng tin phân trang (`GET /api/posts/newsfeed`).
- **Nâng cấp Cấu hình File Upload (Sprint 2.1 - Part 4):** Thiết lập `spring.servlet.multipart` trong `application.yml` cho phép file lên tới 5MB và request tối đa 25MB, ngăn ngừa triệt để lỗi Tomcat `ERR_CONNECTION_RESET`.

#### B. Frontend (React 19 + Vite + TypeScript)
- **Kiến trúc Modular Phân Lớp:** Tổ chức dự án theo chuẩn [docs/architecture/FRONTEND_ARCHITECTURE.md](file:///d:/Project_MiniFace/docs/architecture/FRONTEND_ARCHITECTURE.md) với core, components, và modules nghiệp vụ khép kín.
- **Form & Zod Validations:** Thiết kế `LoginForm`, `RegisterForm` và `authSchema` đảm bảo lọc và chuẩn hóa dữ liệu sạch từ Client-side.
- **Silent Refresh & Axios Mutex Lock:** Triển khai Axios Client có Interceptor tự động xoay vòng Access Token ngầm sử dụng cơ chế hàng chờ Promise Queue (`failedQueue`) và cờ hiệu `isRefreshing` để triệt tiêu lỗi Token Refresh Storm.
- **TS verbatimModuleSyntax Optimization:** Giải quyết triệt để lỗi biên dịch ES module runtime bằng cách phân tách độc lập import type.
- **Premium UI/UX Integration (Sprint 1.3 & 1.4):**
  - Khắc phục lỗi responsive tràn Viewport trên mọi dòng máy di động.
  - Trang cá nhân [ProfilePage.tsx](file:///d:/Project_MiniFace/frontend/src/modules/profile/components/ProfilePage.tsx) với các hiệu ứng Glassmorphic Glow, Avatar Ripple Pulse và uploader kéo thả trực quan.
- **Giao diện 3 Cột Premium & Vi Chuyển Động (Sprint 2.1 - Đã Tối Ưu Tối Thượng):**
  - Tái cấu trúc trang chủ `App.tsx` thành hệ lưới 3 cột hoàn chỉnh khớp 100% bản thiết kế `GiaoDienChinh.png` và `TrangChu4.png`.
  - Thiết kế **Responsive Collapsing Sidebar** trái: Tự động co dãn cực mịn sang **Icon-Only Mode (`w-[80px]`)** trên tablet/laptop và bung rộng đầy đủ nhãn chữ (`275px`) trên màn hình lớn với chuyển động 300ms.
  - Cố định hoàn hảo tầm mắt hai cột biên nhờ thuộc tính `sticky top-6 h-[calc(100vh-48px)]` giúp tăng tối đa khả năng tập trung thị giác vào feed chính.
  - Suggested Friends cột phải chứa 5 gương mặt từ mockup cùng vi chuyển động `Add Friend` giả lập loading và chuyển `Requested` viền lục bảo.
  - Tích hợp cơ chế **Placeholder Toast Alerts**: Bất kỳ nút bấm hoặc chức năng nào chưa liên kết API đều kích hoạt Floating Glassmorphic Toast lơ lửng thông báo lộ trình tinh tế, triệt tiêu mọi điểm chết UI.
- **Vizo Light Slate Aesthetics & Notion Theme (Sprint 2.1 - Part 3):**
  - Đồng bộ toàn bộ hệ màu sang sáng Notion cao cấp HSL (`bg-slate-50`, `bg-white`, `border-slate-200/80`).
  - Lược bỏ cấu trúc Story rườm rà tập trung 100% vào Feed tối giản.
  - Nút Like active đổi sắc hồng rực rỡ kèm uploader `CreatePostCard` có 4 biểu tượng màu Notion quyến rũ.
- **Client-side File Validation (Sprint 2.1 - Part 4):**
  - Viết logic kiểm định dung lượng ảnh tại máy khách trong `CreatePostCard.tsx`, lọc bỏ ảnh lớn hơn 5MB trước khi upload và kích hoạt Toast cảnh báo trực quan cho người dùng.

#### C. Đồng bộ hóa Tài liệu & Skills Thiết kế (Sprint 2.1 - Part 5 & 6)
- **Đồng bộ hóa 100% hệ thống Docs:** Đã thực hiện kiểm thử và cập nhật toàn bộ file tài liệu `.md` (gồm `UI_UX_DESIGN.md`, `STRUCTURE.md`, `FRONTEND_ARCHITECTURE.md`) để xóa sạch các từ khóa Sleek Dark Mode cũ, thay thế và thiết lập đồng bộ **Notion-inspired Light Slate Mode (Vizo Slate Light Theme)** làm ngôn ngữ thiết kế chính thức của dự án.
- **Tập hợp Thành tựu STAR:** Tự động hóa cập nhật và ghi nhận đầy đủ 15 Highlight kỹ thuật cao cấp vào CV/Portfolio Ledger (`CV_PORTFOLIO_HIGHLIGHTS.md`).
- **Nâng Cấp Kỹ Năng Spring Boot Mastery:** Tích hợp các hướng dẫn Tomcat limits (5MB/25MB), Magic Bytes nhị phân bằng Apache Tika, Testcontainers với `.withOptionalLayers(true)` và cấu trúc 4 phân lớp tối tân vào `spring-boot-mastery/SKILL.md`.
- **Cập Nhật Cẩm Nang AI:** Thống nhất các quy chuẩn an toàn file size và Client-side Size Guard vào `AI_GUIDELINES.md`.
- **Tư duy Senior 10 năm kinh nghiệm:** Biên soạn các hướng dẫn với lập luận chặt chẽ, mạch lạc, dễ hiểu, bảo toàn trọn vẹn giá trị kỹ thuật đã tích lũy từ các phiên làm việc trước.

#### D. Cuộc Đại Phẫu Thuật Kiến Trúc - Architectural Pivot (Cập nhật mới nhất)
- **Loại bỏ Over-Engineering:** Đã rà soát và xóa sổ **100%** các từ khóa, kế hoạch và thiết kế liên quan đến **Neo4j, ElasticSearch, Kafka, RabbitMQ, Prometheus, và Grafana** khỏi tất cả các tài liệu dự án (`ROADMAP.md`, `SYSTEM_DESIGN.md`, `DATABASE_SCHEMA.md`, `BACKEND_ARCHITECTURE.md`, `TESTING_GUIDE.md`).
- **Chốt Kiến trúc Thực dụng:** Hệ thống hiện tại và tương lai gần được chốt cứng ở mô hình **Modular Monolith** chạy trên 1 VPS duy nhất, sử dụng **MongoDB** làm cơ sở dữ liệu chính (bao gồm cả collection `friendships` thay cho Neo4j) và **Redis** để cache + rate limiting.
- **Xử lý Tác vụ nền:** Thay thế toàn bộ định hướng dùng Message Broker (Kafka) bằng **Spring `@Async`**.
- **Tiêu chuẩn Scale:** Đã thống nhất chỉ bổ sung công nghệ mới khi hệ thống thực sự vượt ngưỡng 5.000 users và có chỉ số đo lường nghẽn cổ chai cụ thể. Bắt buộc sử dụng **K6 Load Testing** trước khi go-live Production.
- **Docker Clean up:** Đã xóa container `neo4j` khỏi `docker-compose.yml` để tiết kiệm RAM cho môi trường dev.

---

### 🚀 Nhiệm vụ tiếp theo (Phase 2 - Content & News Feed)

1. **Sprint 2.2: Reactions & Comments (Tương tác bài viết):**
   * **Backend:**
     * Thiết kế thêm các trường `reactCount` hoặc bảng/collection `Reaction` lưu trữ trạng thái tương tác bài viết (Like, Love, Haha, Wow, Sad, Angry).
     * Xây dựng API Like/React bài viết (`POST /api/posts/{id}/react`) và API hủy react.
     * Thiết kế collection `Comment` lưu trữ các bình luận cấp 1 của người dùng (authorId, content, postId, createdAt, updatedAt).
     * Xây dựng API bình luận bài đăng (`POST /api/posts/{id}/comments`) và lấy bình luận phân trang (`GET /api/posts/{id}/comments`).
   * **Frontend:**
     * Bổ sung nút Like/React thông minh trên `PostCard.tsx`: Hover hiển thị thanh chọn biểu tượng cảm xúc nhấp nháy, click đổi màu biểu tượng theo đúng tương tác.
     * Thiết kế khu vực bình luận tích hợp dưới mỗi `PostCard.tsx`, hỗ trợ tải thêm bình luận mượt mờ và hiển thị Optimistic Update ngay khi nhấn Enter.
     * **Tự động nén ảnh (Client-side Image Compression):** Tích hợp `browser-image-compression` để nén tự động ảnh trước khi gửi đi, tối ưu hóa băng thông.

---
*Ghi chú: Luôn giữ file `TESTING_GUIDE.md` cập nhật để đảm bảo tính sẵn sàng kiểm thử của hệ thống.*
