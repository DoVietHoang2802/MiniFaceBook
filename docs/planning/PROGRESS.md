# 📈 TIẾN ĐỘ DỰ ÁN (PROJECT PROGRESS)

*Tài liệu này ghi chú lại chi tiết những thành quả đã đạt được sau mỗi Phase, giải thích rõ công dụng, lợi ích và lý do của những quyết định kiến trúc trong hệ thống Mini FaceBook.*

---

## 🚀 PHASE 0: FOUNDATION & INFRASTRUCTURE (ĐÃ HOÀN THÀNH 🏆)
**Đánh giá tổng quan:** Dự án đã thực hiện bước chuyển mình (Pivot) quan trọng sang **Spring Boot 3.x (Java 21)**. Quyết định này nhằm tận dụng sức mạnh của hệ sinh thái Java Enterprise và áp dụng **Modular Clean Architecture** để đảm bảo tính bền vững và khả năng mở rộng tối đa.

## 🔐 PHASE 1: AUTHENTICATION & IDENTITY (ĐÃ HOÀN THÀNH 🔐)
**Đánh giá tổng quan:** Triển khai thành công hệ thống xác thực bảo mật Cookie-based HttpOnly JWT kết hợp với cơ chế **Refresh Token Rotation** chống replay attack, tích hợp xác thực tài khoản qua **Resend** Email API.


### 🏆 Các tính năng & Kiến trúc đang thiết lập:

#### 1. Modular Clean Architecture (Chuẩn Senior Java)
- **Đã làm:** Định nghĩa cấu trúc dự án chia theo 4 lớp (Domain, Application, Infrastructure, Presentation).
  - 📁 Package Domain: `domain/` (Chứa Entities, Interfaces)
  - 📁 Package Application: `application/` (Chứa Use Cases, Services)
  - 📁 Package Infrastructure: `infrastructure/` (Chứa Persistence, Config)
  - 📁 Package Presentation: `presentation/` (Chứa Controllers, DTOs)
- **Giúp ích gì?**
  - Đảm bảo tính "Độc lập": Logic nghiệp vụ không bị dính chặt vào Framework hay Database.
  - Dễ bảo trì và Test: Mỗi lớp có một nhiệm vụ riêng biệt, giảm thiểu rủi ro khi thay đổi code.

#### 2. Jakarta Bean Validation (Dữ liệu sạch)
- **Đã làm:** Sử dụng `@Valid` và các Annotation chuẩn như `@NotNull`, `@Size`, `@Email`.
- **Giúp ích gì?**
  - **Chặn dữ liệu rác:** Tự động loại bỏ các request không hợp lệ ngay từ tầng Controller.
  - **Trải nghiệm Frontend tốt:** Trả về mã lỗi 400 kèm thông tin chi tiết các trường bị lỗi để Frontend hiển thị thông báo.

#### 3. Tập trung xử lý lỗi với `@RestControllerAdvice`
- **Đã làm:** Thiết lập bộ xử lý lỗi tập trung để bắt trọn mọi Exception toàn hệ thống.
- **Giúp ích gì?**
  - **Đồng nhất:** Mọi lỗi (400, 401, 403, 500) đều trả về một format JSON duy nhất: `{ "timestamp", "status", "error", "message", "path" }`.
  - **Bảo mật:** Giấu đi các chi tiết lỗi nhạy cảm của Server khi xảy ra lỗi 500, bảo vệ cấu trúc hệ thống khỏi hacker.

#### 4. Ghi Log chuyên nghiệp với `SLF4J + Logback`
- **Đã làm:** Cấu hình logging mặc định của Spring Boot.
- **Giúp ích gì?**
  - Giúp theo dõi "sức khỏe" hệ thống 24/7. Mọi hành động gọi API hay lỗi phát sinh đều được lưu lại để debug dễ dàng hơn.

#### 5. Rate Limiting với `Bucket4j` (Chống Spam/DDoS)
- **Đã làm:** Tích hợp bộ lọc giới hạn tần suất request cho từng địa chỉ IP.
- **Giúp ích gì?**
  - Ngăn chặn bot spam tin nhắn hoặc tạo hàng loạt tài khoản ảo làm sập Database.

#### 6. Tài liệu hóa API với `SpringDoc OpenAPI (Swagger)`
- **Đã làm:** Cấu hình Swagger UI để tự động tạo tài liệu từ code.
  - 📁 Endpoint tài liệu: `http://localhost:8080/api/docs`
- **Giúp ích gì?**
  - Giúp Team Frontend nắm bắt nhanh các Endpoint mà không cần trao đổi thủ công, tăng tốc độ phát triển cực nhanh.

---

## 🛠️ CHIẾN LƯỢC CÔNG NGHỆ BỔ SUNG (STRATEGIC CHOICES)
*Dự án tích hợp các công cụ "Power-ups" để đạt chuẩn Senior 10 năm kinh nghiệm:*

#### 1. Lombok & MapStruct
- **Lý do:** Java truyền thống rất rườm rà. Lombok giúp xóa bỏ code thừa (Getter/Setter), còn MapStruct giúp tự động chuyển đổi Entity <-> DTO.
- **Lợi ích:** Code cực kỳ ngắn gọn, dễ đọc và hiệu năng cao.

#### 2. ArchUnit (Architecture Governance)
- **Lý do:** Con người có thể sai lầm khi code, phá vỡ quy tắc Clean Architecture.
- **Lợi ích:** Viết unit test để kiểm tra chính cấu trúc code, đảm bảo dự án luôn "sạch" theo đúng thiết kế ban đầu.

#### 3. Testcontainers
- **Lý do:** Mocking đôi khi không phản ánh đúng thực tế Database.
- **Lợi ích:** Chạy Database thật (MongoDB/Neo4j) trong Docker khi chạy test, đảm bảo code chạy đúng 100% khi lên Production.

---

## ✅ TỔNG KẾT
Dự án đã hoàn tất việc chuyển đổi tư duy và hạ tầng sang **Spring Boot**. Mọi tài liệu và quy chuẩn đã được đồng bộ hóa. Chúng ta đã có một bệ phóng chuyên nghiệp nhất để bắt đầu code các tính năng thực tế.

---

## 📝 NHẬT KÝ PHIÊN LÀM VIỆC (WORK LOG)

- **Phiên 16/05/2026 (Sprint 0.1 - Scaffolding):**
  - [x] Khởi tạo Monorepo: `backend/` và `frontend/`.
  - [x] Cấu hình `backend/pom.xml`: Spring Boot 3.3, Java 21, MapStruct, Lombok, Mongock.
  - [x] Tích hợp công cụ chất lượng code: Checkstyle, Spotless.
  - [x] Thiết lập cấu trúc **Modular Clean Architecture** cho module `auth`.
  - [x] Khởi tạo `frontend/` với Vite + React + TypeScript.
  - [x] Đồng bộ hạ tầng Docker (MongoDB, Redis, Neo4j).

- **Phiên 16/05/2026 (Sprint 0.2 - Part 1):**
  - [x] Thiết lập chuẩn phản hồi API (`ApiResponse`).
  - [x] Triển khai bộ mã lỗi tập trung (`ErrorCode`).
  - [x] Hoàn tất bộ xử lý lỗi toàn cục (`GlobalExceptionHandler`) hỗ trợ Validation và Security.

- **Phiên 16/05/2026 (Sprint 0.2 - Part 2):**
  - [x] Triển khai **Security Foundation** với Spring Security & JWT.
  - [x] Tích hợp **Nimbus JOSE + JWT** (Chuẩn Senior cho Java 21).
  - [x] Xây dựng `AuthenticationService` xử lý logic Access/Refresh Token.
  - [x] Cấu hình **SecurityConfig** hỗ trợ Stateless JWT và chuẩn hóa lỗi 401.
  - [x] Triển khai **Rate Limiting** với Bucket4j (Giới hạn 10 request/phút/IP).

- **Phiên 16/05/2026 (Sprint 0.3 - API Docs & QA):**
  - [x] Tích hợp **SpringDoc OpenAPI** tại `/api/docs`.
  - [x] Cấu hình **JWT Authorization** ngay trên giao diện Swagger UI.
  - [x] Viết bộ kiểm tra kiến trúc **ArchUnit** đảm bảo tuân thủ Clean Architecture.
- **Phiên 18/05/2026 (Sprint 1.1 - Core Auth & RBAC & Cookie-based HttpOnly JWT):**
  - [x] Thiết kế domain model User & UserRepository độc lập hoàn toàn với Spring Data.
  - [x] Triển khai `UserRepositoryImpl` và `UserDocument` mapping dữ liệu MongoDB.
  - [x] Triển khai **Xác thực Email qua Resend** sử dụng RestTemplate gửi email xác thực tài khoản.
  - [x] Triển khai **HttpOnly Cookies** cho cả Access Token và Refresh Token để bảo vệ chống XSS/CSRF.
  - [x] Triển khai **Refresh Token Rotation** chống replay attack, lưu trữ và thu hồi token trong MongoDB.
  - [x] Triển khai phân quyền **RBAC** ADMIN/USER qua JWT.
  - [x] Hoàn thiện tài liệu OpenAPI trên Swagger cho AuthController, bổ sung API `/verify`, `/refresh`, `/logout`.
  - [x] Vượt qua 100% kiểm thử kiến trúc ArchUnit sau khi di chuyển DTOs, Mappers và Security hạ tầng về đúng phân lớp Clean Architecture.
  - [x] **[Nâng cấp bảo mật]** Phát hiện, vá lỗi thành công lỗ hổng đăng xuất (Logout) không thu hồi token trong MongoDB, đồng thời tiến hành clean compile và kiểm thử thực tế thành công 100%.
- **Phiên 18/05/2026 (Sprint 1.2 - Frontend Initialization & UI/UX Pro Max Integration):**
  - [x] **[Tích hợp Kỹ năng mới]** Tải xuống, quy hoạch và tích hợp thành công Custom Skill [ui-ux-pro-max](file:///d:/Project_MiniFace/.antigravity/skills/ui-ux-pro-max/SKILL.md) (45KB cẩm nang thiết kế) vào thư mục nội bộ `.antigravity/skills/ui-ux-pro-max/`.
  - [x] **[Giao thức Bắt buộc]** Cập nhật [SESSION_HANDOFF.md](file:///d:/Project_MiniFace/docs/session/SESSION_HANDOFF.md) thiết lập quy tắc bắt buộc số 4: Mặc định tự động kích hoạt và tuân thủ 100% cẩm nang thiết kế cho mọi tác vụ liên quan đến giao diện, Frontend và CSS.
  - [x] **[Tài liệu hóa UI/UX Spec]** Tạo mới tệp [docs/guidelines/UI_UX_DESIGN.md](file:///d:/Project_MiniFace/docs/guidelines/UI_UX_DESIGN.md) lưu trữ toàn bộ triết lý thiết kế Sleek Dark Mode, Design Tokens màu HSL/Fonts, phân tích chi tiết và đề xuất cải tiến 3 màn hình cốt lõi dựa trên mockup của người dùng, cùng checklist kiểm định chất lượng nghiêm ngặt.

- **Phiên 18/05/2026 (Sprint 1.3 - Frontend Auth & API Integration):**
  - [x] **[Phát triển Form & Validate]** Xây dựng các form nhập liệu `LoginForm` và `RegisterForm` kết hợp validate đầu vào bằng Zod Schemas (`authSchema.ts`), đảm bảo lọc dữ liệu sạch ngay từ Client.
  - [x] **[Triển khai Axios Mutex Lock Interceptor]** Triển khai cơ chế xoay vòng token tự động ngầm (Silent Refresh) trong `axiosClient.ts` sử dụng Promise Queue (`failedQueue`) và biến cờ hiệu `isRefreshing` để triệt tiêu lỗi Token Refresh Storm.
  - [x] **[Tối ưu hóa Compile TS]** Khắc phục triệt để lỗi biên dịch ES module runtime bằng cách phân tách import type độc lập đáp ứng cờ `"verbatimModuleSyntax": true` của TypeScript Compiler.

- **Phiên 19/05/2026 (Sprint 1.4 - Profile & Media Completion):**
  - [x] **[Hạ tầng Cloudinary & Apache Tika]** Tích hợp dịch vụ lưu trữ media Cloudinary kết hợp Apache Tika kiểm tra chữ ký nhị phân Magic Bytes chống mã độc ngụy trang.
  - [x] **[Trình xử lý lỗi dung lượng]** Thiết lập `@ExceptionHandler` cho `MaxUploadSizeExceededException` trả về JSON ApiResponse chuẩn khi payload vượt quá 5MB.
  - [x] **[Phát triển Profile Page]** Xây dựng giao diện trang cá nhân người dùng [ProfilePage.tsx](file:///d:/Project_MiniFace/frontend/src/modules/profile/components/ProfilePage.tsx) với các hiệu ứng động cao cấp: Focus Glassmorphic Glow, Avatar Ripple Pulse và Drag-and-Drop Uploader.
  - [x] **[Validate cục bộ & Đồng bộ hóa]** Tích hợp Zod validate dung lượng tệp tin (<=5MB) và kiểm tra MIME định dạng ảnh ngay từ Client-side. Hook luồng kiểm tra trạng thái đăng nhập tự động ngầm khi tải trang bằng Cookie.
  - [x] **[Tái cấu trúc Sạch - Shared Media]** Nhận diện rủi ro phụ thuộc chéo khi bước sang Phase 2. Tái cấu trúc thành công, đưa `MediaService` (Domain Interface) và `CloudinaryService` (Infrastructure Adapter) ra phân vùng dùng chung `shared` độc lập. Đạt tiêu chuẩn **Clean Architecture 100%** kiểm định bởi ArchUnit.

#### 🔧 Technical Debugging Log (Phase 1 Stabilization)
| Vấn đề | Nguyên nhân | Giải pháp | Kết quả |
| :--- | :--- | :--- | :--- |
| **TypeScript Compile Error** | TypeScript yêu cầu tách biệt từ khóa `import type` khi dùng cờ `"verbatimModuleSyntax": true` trong `tsconfig.app.json` của Vite. | Cập nhật các file import schema và types ở Frontend, chuyển sang `import type { LoginFormInput }` để thỏa mãn ES module runtime. | Trình duyệt load mượt mà, compile thành công 100% không còn lỗi cảnh báo TypeScript. |
| **verbatimModuleSyntax import type** | TypeScript yêu cầu import type đối với các Type/Interface trong verbatimModuleSyntax mode. | Chuyển `UserProfileResponse` thành `import type { UserProfileResponse }` trong [ProfilePage.tsx](file:///d:/Project_MiniFace/frontend/src/modules/profile/components/ProfilePage.tsx). | Biên dịch TypeScript Vite thành công 100%. |
| **ZodError type property errors** | Truy cập `.errors` trên đối tượng ZodError gây ra lỗi kiểu TypeScript trong một số cấu hình. | Chuyển đổi sang truy cập `.issues[0].message` chuẩn tương tự LoginForm. | Lỗi TypeScript được khắc phục triệt để. |
| **ArchUnit Layer Violation** | Tầng Presentation (`presentation.dto`) bị Application sử dụng trực tiếp và Mapper nằm ở Infrastructure. | Di chuyển DTOs về `application.dto`, mapper về `application.mapper` và di chuyển Security về module của nó. | Kiến trúc sạch 100% đạt chuẩn ArchUnit. |
| **Lack of Cookie Auth & Rotation** | Thiếu cookie bảo mật và cơ chế chống replay attack cho Refresh Token. | Triển khai `RefreshToken` Entity ở Domain và Cookie-based HttpOnly JWT cho cả Access/Refresh token. | Hệ thống bảo mật tối đa chuẩn doanh nghiệp. |
| **Logout Security Leak** | Giao dịch logout chỉ xóa cookie ở client mà quên vô hiệu hóa token trong MongoDB. | Cập nhật Controller trích xuất `@CookieValue` và gọi `authService.logout()` để cập nhật `revoked: true` trong Database. | Token được vô hiệu hóa chính xác trong MongoDB khi logout, chặn đứng Replay Attack. |
| **Tight Modular Coupling** | MediaService và CloudinaryService ban đầu nằm trong Auth Module, gây rủi ro phụ thuộc chéo khi bước sang Phase 2. | Tái cấu trúc tách rời MediaService sang tầng Shared Domain, CloudinaryService sang Shared Infrastructure. | Độc lập module hoàn hảo, ArchUnit vượt qua 100% không phát sinh cảnh báo phụ thuộc chéo. |


#### 🔧 Technical Debugging Log (Phase 0 Stabilization)
| Vấn đề | Nguyên nhân | Giải pháp | Kết quả |
| :--- | :--- | :--- | :--- |
| **DuplicateKeyException** | Lặp key `springdoc` trong `application.yml`. | Gộp và chuẩn hóa cấu hình Swagger. | App khởi động thành công. |
| **ArchUnit Syntax Error** | Dùng hàm không tồn tại trong v1.3.0. | Chuyển sang `mayOnlyBeAccessedByLayers`. | Bộ quét kiến trúc hoạt động chính xác. |
| **Swagger 401 Error** | Sai cấu hình path so với `context-path`. | Bỏ tiền tố `/api` trong `SecurityConfig`. | Truy cập tài liệu công khai OK. |
| **Pom Conflict** | Trùng lặp dependency trong `pom.xml`. | Dọn dẹp và thống nhất phiên bản. | Tối ưu hóa quá trình Build. |
| **ArchUnit Strictness & Empty Layer Error** | ArchUnit mặc định không cho phép layer trống và thiếu khai báo tầng `GlobalInfrastructure` truy cập `Shared` DTOs. | Định nghĩa rõ lớp `GlobalInfrastructure`, cấu hình cho phép tầng trống `.withOptionalLayers(true)` trong thời gian bootstrapping. | Vượt qua kiểm thử kiến trúc (ArchitectureTest) 100% xanh. |
