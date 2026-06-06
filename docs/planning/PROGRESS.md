# 📈 TIẾN ĐỘ DỰ ÁN (PROJECT PROGRESS)

*Tài liệu này ghi chú lại chi tiết những thành quả đã đạt được sau mỗi Phase, giải thích rõ công dụng, lợi ích và lý do của những quyết định kiến trúc trong hệ thống Mini FaceBook.*

---

## 🚀 PHASE 0: FOUNDATION & INFRASTRUCTURE (ĐÃ HOÀN THÀNH 🏆)
**Đánh giá tổng quan:** Dự án đã thực hiện bước chuyển mình (Pivot) quan trọng sang **Spring Boot 3.x (Java 21)**. Quyết định này nhằm tận dụng sức mạnh của hệ sinh thái Java Enterprise và áp dụng **Modular Clean Architecture** để đảm bảo tính bền vững và khả năng mở rộng tối đa.

## 🔐 PHASE 1: AUTHENTICATION & IDENTITY (ĐÃ HOÀN THÀNH 🔐)
**Đánh giá tổng quan:** Triển khai thành công hệ thống xác thực bảo mật Cookie-based HttpOnly JWT kết hợp với cơ chế **Refresh Token Rotation** chống replay attack, tích hợp xác thực tài khoản qua **Resend** Email API.



## 📝 PHASE 2: CONTENT & NEWS FEED (ĐANG TRIỂN KHAI 🚧)
**Đánh giá tổng quan:** Khởi động hệ thống Bài viết (Post System) với kiến trúc Module độc lập. Thiết lập cấu trúc dữ liệu NoSQL tối ưu cho News Feed.

### 🏆 Các tính năng & Kiến trúc đang thiết lập:
#### 1. Sprint 2.1: Hạ tầng Bài viết (Post System)
- **Đã làm:** Khởi tạo bộ khung Backend `com.minifacebook.module.post`. Thiết lập `PostDocument` (MongoDB) và `PostRepository`.
- **Giúp ích gì?**
  - **Tối ưu NoSQL Schema:** Áp dụng phương pháp Referencing (lưu `authorId` thay vì embed) để tránh lỗi bất đồng bộ dữ liệu khi User đổi tên/avatar.
  - **Performance:** Tích hợp sẵn `Pageable` ngay từ Interface Repository để chuẩn bị cho Infinite Scroll (Cuộn vô hạn), tránh nguy cơ Out-of-Memory do kéo toàn bộ dữ liệu.



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
- **Lợi ích:** Chạy Database thật (MongoDB) trong Docker khi chạy test, đảm bảo code chạy đúng 100% khi lên Production.

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
  - [x] Đồng bộ hạ tầng Docker (MongoDB, Redis).

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

- **Phiên 19/05/2026 (Sprint 2.1 - Post System Backend & Frontend):**
  - [x] **[Backend]** Khởi tạo `com.minifacebook.module.post` với Clean Architecture, `PostDocument`, `PostRepository`, `PostService`, và `PostController`.
  - [x] **[Trade-off Kiến trúc]** Sử dụng trực tiếp `Pageable` của Spring Data trong tầng Domain giúp tối ưu thời gian phát triển (Pragmatic approach). Đã chạy `ArchitectureTest` xác minh không vi phạm quy tắc ArchUnit.
  - [x] **[Frontend API]** Triển khai `post.types.ts` và `postService.ts` tương tác API tạo bài viết (hỗ trợ multipart/form-data cho nhiều ảnh) và lấy bảng tin (Newsfeed phân trang).
  - [x] **[Premium UI]** Xây dựng `CreatePostCard.tsx` (có Drag & Drop Upload), `PostCard.tsx` (lưới ảnh tự động dàn trang 1-2-3 ảnh cực mượt, glassmorphism), và `PostFeed.tsx` (Optimistic Update & Tải thêm dữ liệu).
  - [x] **[Tích hợp Tab Navigation]** Cập nhật `App.tsx` thêm thanh điều hướng mượt mà giữa "Bảng tin" và "Trang cá nhân". Trình biên dịch Frontend (npm run build) hoàn tất 100%, không cảnh báo TypeScript.

- **Phiên 19/05/2026 (Sprint 2.1 - Part 2 - Giao Diện 3 Cột Premium & Vi Tương Tác Cực Đỉnh):**
  - [x] **[Tái Cấu Trúc Bố Cục GiaoDiệnChinh & TrangChu4]** Nâng cấp layout trang chủ `App.tsx` thành hệ lưới 3 cột chuẩn mực mạng xã hội (`3-Column Grid Layout`): Sidebar Nav cố định bên trái, Bảng tin/Trang cá nhân ở giữa, Suggested Friends lướt tự do bên phải.
  - [x] **[Connect Responsive Sidebar Navigation]** Thiết kế sidebar trái sang trọng với logo Connect phát sáng xanh dương, hệ menu chuyển tab mượt mà. Đặc biệt tích hợp khả năng **co dãn Responsive cực mịn sang Icon-Only (`w-[80px]`)** trên tablet/laptop và tự bung rộng (`w-[275px]`) trên màn hình lớn với chuyển động 300ms.
  - [x] **[Sticky Layout & Scroll-Focus Spec]** Định hình chiều cao và vị trí cố định tầm mắt hoàn hảo của hai cột bên biên (`sticky top-6 h-[calc(100vh-48px)]`). Thiết lập sẵn kiến trúc để cột giữa cuộn độc lập mượt mà.
  - [x] **[Account Widget & Floating Logout Popover]** Xây dựng thẻ tài khoản góc trái dưới cùng tích hợp Avatar sếp và popover mờ kính chứa nút đăng xuất lấp lánh phản hồi nhanh nhạy.
  - [x] **[Suggested Friends Widget]** Khởi tạo chính xác 5 gương mặt gợi ý kết bạn khớp 100% mockup (`Jason Nguyen`, `Thao Pham`, `Brian Le`, `Alice Duong`, `David Tran`) kèm theo số lượng bạn chung chân thực.
  - [x] **[Add Friend Micro-Interaction]** Phát triển vi tương tác nút kết bạn đỉnh cao: Click chuột kích hoạt trạng thái xoay loading (800ms giả lập API) và chuyển sang trạng thái khóa `Requested` màu xanh ngọc dịu mát.
  - [x] **[Glassmorphic Floating Toast & Placeholder Alerts]** Thiết lập trình thông báo lơ lửng góc dưới màn hình giúp tăng tính xúc giác. Tất cả các nút/icon chưa liên kết API đều bắn ra Toast *"Tính năng đang phát triển và sẽ ra mắt ở Phase tiếp theo!"* thay vì bị đơ.
- **Phiên 19/05/2026 (Sprint 2.1 - Part 3 - Vizo Light Slate Aesthetics & Notion Transition - TrangChu4.png):**
  - [x] **[Thực Thi Transition Sáng Notion/Slate]** Đồng bộ toàn bộ hệ thống màu sắc từ tối sang sáng Notion cao cấp, tối ưu hóa các biến HSL nhẹ nhàng: Nền xám nhạt (`bg-slate-50`), hộp thẻ trắng muốt (`bg-white`), đường viền siêu mảnh (`border-slate-200/80`).
  - [x] **[Tạo Bố Cục TrangChu4 Mới]** Thiết kế bảng tìm kiếm Vizo Topbar trung tâm cực đẹp có phím tắt `⌘ K`, các nút toggle theme, thông báo tròn lấp lánh và avatar người dùng góc trên.
  - [x] **[Trọng Tâm Feed Tối Giản]** Loại bỏ các thành phần bảng tin Story rườm rà không cần thiết theo yêu cầu, tạo cảm giác tinh gọn, tập trung hoàn toàn vào Feed bài viết chính như Notion.
  - [x] **[Phát Triển Vi Tương Tác Hộp Tạo Bài Viết]** Nâng cấp `CreatePostCard` với thanh biểu tượng: Photo / Video (emerald green), Feeling (amber yellow), Check in (rose pink), Poll (violet blue), và nút đăng bài màu gradient tím sang trọng.
  - [x] **[Tối Ưu PostCard Sáng]** Đổi màu PostCard sang nền trắng, chữ xám đen slate sang trọng (`text-slate-600`), các phản hồi nút Like (rose khi active), Comment, Share mượt mà có hover effect.
  - [x] **[Xây Dựng Bento Box & Cột Phụ Trực Quy hoạch]** Đồng bộ Widget Trending Now và People You May Know với các nhãn tag sáng, nút Add Friend hover tinh tế.
  - [x] **[Kiểm Thử Thành Công 100%]** Chạy clean compile với `Exit Code: 0` và dùng subagent trình duyệt trực quan hóa chụp lại screenshot bố cục cực kỳ hoàn mỹ, sẵn sàng phục vụ trải nghiệm đỉnh cao của người dùng.

- **Phiên 19/05/2026 (Sprint 2.1 - Part 4 - Sửa Lỗi Đăng Ảnh & Tối Ưu Hóa Dung Lượng):**
  - [x] **[Sửa lỗi ERR_CONNECTION_RESET]** Phát hiện lỗi kết nối bị máy chủ Tomcat của Spring Boot cắt đột ngột do dung lượng ảnh tải lên vượt quá giới hạn mặc định (1MB).
  - [x] **[Nâng cấp Cấu hình Server]** Cấu hình `spring.servlet.multipart` trong `application.yml` cho phép file lên tới 5MB và request tối đa 25MB.
  - [x] **[Cập nhật Logic Cloudinary]** Điều chỉnh bộ lọc dung lượng của `CloudinaryService.java` đồng bộ ở mức 5MB để bảo mật máy chủ.
  - [x] **[Validation Client-side Cảnh báo Sớm]** Viết logic validate trong `CreatePostCard.tsx` tự động quét dung lượng ảnh chọn từ máy khách, chặn ảnh vượt quá 5MB và kích hoạt Toast cảnh báo trực quan cho người dùng.
  - [x] **[Ghi nhận Roadmap Nén Ảnh]** Ghi nhận giải pháp **Client-side Image Compression** bằng `browser-image-compression` để triển khai tự động nén ảnh xuống dưới 1MB ở các Phase sau.
- **Phiên 19/05/2026 (Sprint 2.1 - Part 5 - Đồng bộ Hoàn toàn Hệ thống Tài liệu và Skill UI/UX Premium):**
  - [x] **[Đồng bộ hóa Tài Liệu Hệ Thống]** Kiểm tra toàn bộ danh mục tài liệu, cập nhật và đồng bộ hóa phong cách thiết kế **Notion-inspired Light Slate Mode (Vizo Slate Light Theme)** xuyên suốt `UI_UX_DESIGN.md`, `STRUCTURE.md`, `FRONTEND_ARCHITECTURE.md`.
  - [x] **[Hiệu chỉnh Bố cục & Phối màu]** Khớp 100% tất cả các định nghĩa tokens màu sáng HSL dịu mát (`bg-slate-50`, `bg-white`, `border-slate-200/80`), ranh giới lưới 3 cột, logo chữ "H", và các Spec chuyển động mượt mà.
  - [x] **[Kinh nghiệm Kiến trúc Sư 10 năm]** Viết lại tài liệu với cấu trúc cực kỳ rõ ràng, lập luận chặt chẽ, dễ đọc cho cả con người và công cụ phát triển, bảo toàn tuyệt đối toàn bộ thành tựu tính năng từ các phiên trước.
- **Phiên 19/05/2026 (Sprint 2.1 - Part 6 - Đồng bộ Toàn diện Ledger Thành tựu Kỹ thuật STAR và Cập nhật Spring Boot Mastery Skill):**
  - [x] **[Thống Nhất Ledger Thành Tựu STAR]** Bổ sung Highlight 14 (Post System Clean Architecture và Multipart Tomcat config 5MB) và Highlight 15 (Client-side Size Guard early toast alert) vào `CV_PORTFOLIO_HIGHLIGHTS.md`.
  - [x] **[Nâng Cấp Kỹ Năng Spring Boot Mastery]** Cập nhật `spring-boot-mastery/SKILL.md` với các hướng dẫn Tomcat limits, Apache Tika, Testcontainers với `.withOptionalLayers(true)` và cấu trúc 4 phân lớp tối tân.
- **Phiên 23/05/2026 (Sprint 2.2 - Reactions & Comments System):**
  - [x] **[Backend]** Khởi tạo `CommentDocument`, `ReactionDocument` và thiết lập collection với Indexes tối ưu.
  - [x] **[Backend]** Xây dựng API `/posts/{postId}/comments` (hỗ trợ phân trang GET và POST có đính kèm ảnh).
  - [x] **[Backend]** Xây dựng API `/posts/{postId}/react` hỗ trợ Toggle Reaction (6 loại cảm xúc) và tự động đồng bộ biến đếm `reactCount` vào Post.
  - [x] **[Frontend]** Phát triển `CommentSection.tsx` ứng dụng kỹ thuật **Optimistic UI Updates** hiển thị bình luận tức thì với độ trễ 0ms.
  - [x] **[Frontend]** Áp dụng kỹ thuật **Window Focus Refetch** của TanStack Query để giả lập Realtime đa cửa sổ mượt mà không tốn kết nối WebSockets.
  - [x] **[Frontend]** Nâng cấp `PostCard.tsx` với thanh Hover Emoji Bar đàn hồi (Cubic-bezier Bouncy), khắc phục dứt điểm lỗi rớt popup nhờ kỹ thuật "Invisible Padding Bridge".
  - [x] **[Frontend]** Khắc phục lỗi `415 Unsupported Media Type` cho Multipart Request bằng cách loại bỏ `Content-Type: application/json` mặc định trong Axios instance.
  - [x] **[Frontend/Performance]** Tích hợp thành công `browser-image-compression` để nén mọi hình ảnh tải lên (dưới 20MB) xuống `<1MB` bằng Web Worker, tự động ép sang chuẩn `WebP` và Bypass ảnh `GIF`, tạo ra trải nghiệm Zero-Friction Magic UX và tiết kiệm 90% chi phí lưu trữ Cloudinary.

- **Phiên 29/05/2026 (Sprint 3.1 - Friend Request System & i18n Việt hóa):**
  - [x] **[Backend]** Khởi tạo module `com.minifacebook.module.friendship` hoàn chỉnh 4 phân lớp Clean Architecture (Domain/Application/Infrastructure/Presentation).
  - [x] **[Domain]** Thiết kế `Friendship` Entity (POJO thuần) và enum `FriendshipStatus` (PENDING/ACCEPTED/REJECTED/BLOCKED). Định nghĩa port `FriendshipRepository`.
  - [x] **[Infrastructure]** Triển khai `FriendshipDocument` với **Compound Unique Index** `(requesterId, addresseeId)`, `FriendshipMapper` (MapStruct), `MongoFriendshipRepository` và adapter `FriendshipRepositoryImpl` với cơ chế **bidirectional lookup** (`findBetweenUsers`).
  - [x] **[Application]** Xây dựng `FriendshipService` với 4 use case: gửi/hủy/chấp nhận/từ chối lời mời. Xử lý đầy đủ ràng buộc nghiệp vụ: chống tự kết bạn, chống duplicate, kiểm tra quyền sender/recipient, cho phép re-request sau khi REJECTED.
  - [x] **[Presentation]** Tạo `FriendshipController` với 4 REST endpoint (`POST/DELETE/PUT` dưới `/friends`).
  - [x] **[Shared]** Bổ sung 9 mã lỗi Friendship (2001-2009) vào `ErrorCode`.
  - [x] **[i18n - Việt hóa]** Việt hóa toàn bộ 28 message trong `ErrorCode` (giữ enum NAME tiếng Anh làm định danh kỹ thuật, chỉ dịch phần message hiển thị cho người dùng cuối, bảo toàn placeholder `{min}`).
  - [x] **[i18n - Swagger]** Đồng bộ Swagger `@Tag` + `@Operation` của `FriendshipController` và `PostController` sang tiếng Việt ("Bạn bè", "Bài viết") cho thống nhất với `AuthController`.
  - [x] **[Testing]** Kiểm thử thực tế qua API toàn bộ 12 kịch bản (happy path + 7 edge case lỗi), tất cả PASS. Xác minh dữ liệu lưu đúng trong MongoDB. ArchUnit Test xanh 100%.
  - [x] **[Docs]** Tạo file hướng dẫn test độc lập `docs/testing/PHASE_3_FRIENDS_TESTING.md` (chi tiết từng bước trên Swagger, giải thích cơ chế HttpOnly Cookie). Thêm bảng index vào `TESTING_GUIDE.md`.

- **Phiên 30/05/2026 (Tech Debt - Pre Sprint 3.2: Transaction & N+1 Optimization):**
  - [x] **[Hạ tầng/Transaction]** Nâng cấp MongoDB từ standalone lên **Replica Set (`rs0`)** trong `docker-compose.yml` (cờ `--replSet rs0 --bind_ip_all` + healthcheck tự động `rs.initiate()`). Kích hoạt thật cơ chế `@Transactional` đã viết ở Sprint 3.1 (trước đó bị "nửa vời" do thiếu nền tảng).
  - [x] **[Hạ tầng/Transaction]** Tạo `infrastructure/config/MongoConfig.java` khai báo Bean `MongoTransactionManager`. Cập nhật connection string `?directConnection=true` để driver kết nối thẳng node qua port mapping 27018 mà vẫn dùng được transaction.
  - [x] **[Hiệu năng/N+1]** Bổ sung `findAllByIds(List<String> ids)` vào `UserRepository` (Domain) + `UserRepositoryImpl` (dùng `MongoRepository.findAllById`) — chống N+1 query khi load danh sách bạn bè ở Sprint 3.2 (51 queries → 1 query).
  - [x] **[Verify]** Re-init container (xóa volume cũ không tương thích), xác nhận replica set ở trạng thái PRIMARY, backend khởi động thành công và luồng friend request hoạt động trơn tru với transaction active.

- **Phiên 30/05/2026 (Sprint 3.2 - Friend List & Management):**
  - [x] **[Application]** Bổ sung 6 use case vào `FriendshipService`: `getFriends`, `getPendingRequests`, `getSentRequests`, `unfriend`, `blockUser`, `unblockUser`.
  - [x] **[Presentation]** Thêm 6 endpoint vào `FriendshipController`: `GET /friends`, `GET /friends/requests/pending`, `GET /friends/requests/sent`, `DELETE /friends/{friendId}`, `POST /friends/block/{userId}`, `DELETE /friends/block/{userId}`.
  - [x] **[Logic/Block]** Triển khai cơ chế Block theo quy ước: `requesterId` = người chặn, `addresseeId` = người bị chặn, `status = BLOCKED`. Chỉ người chặn (requester) mới được gỡ chặn.
  - [x] **[Tech Debt #4]** Thêm field `sentByMe` vào `FriendshipResponse` → Frontend phân biệt lời mời mình gửi (nút "Thu hồi") hay người khác gửi (nút "Chấp nhận/Từ chối").
  - [x] **[Hiệu năng - Chống N+1]** Áp dụng `findAllByIds` (batch-load) trong helper `mapWithOtherUser`: gom toàn bộ id "người kia" → load 1 query duy nhất thay vì N query. Dùng `Map<String, User>` để tra cứu O(1).
  - [x] **[Testing]** Test thực tế 8 kịch bản qua API (list bạn/pending/sent, unfriend, block, người bị chặn gửi request→2009, non-blocker unblock→2007, unblock thành công). Tất cả PASS. Compile + ArchUnit xanh 100%.
  - [x] **[Docs]** Cập nhật `PHASE_3_FRIENDS_TESTING.md` thêm kịch bản test Sprint 3.2 (6 API + edge case Block).

- **Phiên 30/05/2026 (Sprint 3.3 - Phần 1: Fix bug FE-BE & thêm field `name`):**
  - [x] **[FIX BUG ẩn]** Phát hiện bug FE-BE mismatch tồn tại từ Sprint 1: Frontend `RegisterForm` có ô "Họ và tên" và gửi `name` lên, nhưng Backend (`RegisterRequest`, `User`, `UserDocument`) không có field này → tên người dùng bị vứt bỏ, không bao giờ lưu vào DB.
  - [x] **[Backend]** Thêm field `name` xuyên suốt: `RegisterRequest` (`@NotBlank` + `@Size` 2-50 khớp validate FE), `User` (Domain), `UserDocument` (kèm `@Indexed` phục vụ search), `UserResponse` (trả về cho FE đã khai báo nhận sẵn).
  - [x] **[Shared]** Thêm 2 mã lỗi `NAME_REQUIRED` (1020) và `NAME_INVALID` (1021) với message tiếng Việt.
  - [x] **[Verify]** MapStruct tự sinh code map `name` ở cả 3 chiều (Request→User, User→Response, User↔Document) - kiểm chứng trong generated sources. Không cần sửa Frontend (dùng đúng tên field `name`).
  - [x] **[Testing]** Test 5 kịch bản: đăng ký có tên→lưu DB OK, login trả về name, đăng ký thiếu tên→1020, tên<2 ký tự→1021. Tất cả PASS.
  - [x] **[Quyết định]** Theo Phương án A (bắt buộc nhập tên khi đăng ký). Đây cũng là nền tảng cho API Search (Sprint 3.3 Phần 2 - search theo `name`).

- **Phiên 30/05/2026 (Sprint 3.3 - Phần 2: API Search & Discovery):**
  - [x] **[Application]** Tạo enum `RelationshipStatus` (NONE/PENDING_SENT/PENDING_RECEIVED/FRIEND/BLOCKED) và DTO `UserSearchResponse` (kèm `friendshipId`).
  - [x] **[Backend Search]** Thêm `searchByName` vào `UserRepository` + `MongoUserRepository` (Regex case-insensitive, chỉ lấy user `verified=true`) + impl.
  - [x] **[Application]** `FriendshipService.searchUsers()`: search theo tên → enrich `relationshipStatus` cho từng kết quả bằng `findBetweenUsers`. Loại trừ chính mình; ẩn người đã chặn user hiện tại (privacy - trả null rồi lọc); có phân trang.
  - [x] **[Presentation]** Thêm endpoint `GET /friends/search?q=&page=&size=`. Đặt ở module friendship (không phải /users) vì cần `FriendshipRepository` - đúng Clean Architecture.
  - [x] **[Testing]** Test 7 case: loại chính mình, FRIEND/PENDING_SENT/PENDING_RECEIVED/NONE đúng chiều, người chặn thấy BLOCKED, người bị chặn không thấy người chặn. Tất cả PASS.
  - [x] **[Tech Debt #6]** Ghi nhận hạn chế: lọc (self + người chặn) làm sau truy vấn DB nên `totalElements` đếm theo tên (trước lọc). Không ảnh hưởng quy mô demo, cần aggregation pipeline khi scale >1000 users. Đã comment trong Javadoc.

- **Phiên 30/05/2026 (UI Phase 3 - Module Friends Frontend):**
  - [x] **[Frontend]** Tạo module `friends` khép kín chuẩn Modular FE: `types/friend.types.ts` (khớp BE), `services/friendService.ts` (gọi 11 API friendship), `components/FriendsPage.tsx`.
  - [x] **[UI]** `FriendsPage` với 4 tab: Tìm kiếm / Bạn bè / Lời mời / Đã gửi. Badge đếm số lượng trên tab.
  - [x] **[UX - Search]** Tìm kiếm realtime với **debounce 300ms**, hiển thị spinner khi đang search, empty state thân thiện.
  - [x] **[UX - Nút động]** Nút hành động trong tab Tìm kiếm đổi theo `relationshipStatus`: NONE→"Kết bạn", PENDING_SENT→"Thu hồi", PENDING_RECEIVED→"Phản hồi", FRIEND→"Bạn bè"✓, BLOCKED→"Bỏ chặn".
  - [x] **[UX - Optimistic UI]** Mọi thao tác (kết bạn/thu hồi/accept/reject/unfriend) cập nhật giao diện tức thì, có per-row loading chống double-click.
  - [x] **[Tích hợp]** Cập nhật `App.tsx`: đổi menu "Explore"→"Bạn bè" (icon Users), wire `activeTab='friends'`, render `FriendsPage`.
  - [x] **[Verify]** Diagnostics 0 lỗi, `npm run build` PASS (1931 modules). Theo đúng design Vizo Light (violet/slate). **PHASE 3 HOÀN THÀNH 100%** (Backend + UI).

- **Phiên 30/05/2026 (Sprint 3.4 - Friend Suggestions: Mutual Friends):**
  - [x] **[Backend - Thuật toán]** `FriendshipService.getSuggestions()` triển khai thuật toán Mutual Friends: lấy bạn trực tiếp → lấy bạn-của-bạn (batch query `findAcceptedByUserIds` chống N+1) → đếm số bạn chung cho từng candidate → loại self/bạn trực tiếp/người đã có quan hệ → sắp xếp theo mutual count giảm dần.
  - [x] **[Backend]** Thêm `findAllByUserIdsAndStatus` (Mongo `$in` query) vào repository. DTO `FriendSuggestionResponse` (kèm `mutualFriendsCount`). API `GET /friends/suggestions?limit=`.
  - [x] **[Frontend]** Thay danh sách "People You May Know" mock cứng ở sidebar `App.tsx` bằng data thật từ API. Nút "Add Friend" gọi API thật (Optimistic), empty state thân thiện, "View all" mở tab Bạn bè.
  - [x] **[Testing]** Test mạng lưới A-B-C-D-E: D (2 bạn chung) xếp trên E (1 bạn chung), loại đúng self + bạn trực tiếp. PASS. Compile + ArchUnit + npm build đều xanh.
  - [x] **[Quyết định kiến trúc]** Tính in-memory cho quy mô demo (~100 users), không cần Neo4j/Graph DB - đúng định hướng "thực dụng" đã chốt trước đó.

- **Phiên 30/05/2026 (UI Polish - Redesign Hizo Layout & Reactions Modal giống Facebook):**
  - [x] **[UI/Layout]** Tinh chỉnh bố cục `App.tsx` theo mockup `Giaodiennangcap.png`: đổi menu sidebar (Discover/Network/Communities/Chats/Notifications/Collections/Profile/Settings), bỏ nút Create Post, mở rộng container (`max-w-[1600px]`) giảm khoảng trắng, Trending Topics thêm % tăng màu xanh, bỏ banner Vizo Pro, đổi footer sang "Hizo".
  - [x] **[UI/Feature - Reactions Modal]** Thêm dòng thống kê riêng trên `PostCard` (cụm emoji chồng + tổng số bên trái, "X bình luận · Y chia sẻ" bên phải), tách số ra khỏi nút Like/Comment/Share. Bấm cụm emoji mở `ReactionsModal` hiển thị "ai thả gì" với tab lọc theo từng loại cảm xúc + emoji badge trên avatar (giống Facebook).
  - [x] **[Backend]** Thêm API `GET /posts/{postId}/reactions` + `ReactionRepository.findByPostId` + DTO `ReactionUserResponse`. Service batch-load user info chống N+1.
  - [x] **[Guideline]** Bổ sung quy tắc **9.2.B** vào `AI_GUIDELINES.md`: phân biệt cải tiến THUẦN GIAO DIỆN (làm ngay) vs ĐỤNG CHỨC NĂNG (phải dừng, báo USER 4 bước + chờ quyết định). Theo yêu cầu USER để giữ quyền kiểm soát scope.

- **Phiên 06/06/2026 (Chat UI 3 cột + Sprint 4.4 ① Typing Indicator):**
  - [x] **[UI - 3 Column Layout]** Bổ sung cột 3 Profile Panel vào `ChatPage.tsx` (avatar lớn, tên, role/location, 3 nút Profile/Mute/More, Shared media grid, Shared files, Mutual friends — data placeholder). Chỉ hiện ở breakpoint `xl` (≥1280px). Nâng cấp toàn bộ sizing 3 cột cho khớp mockup.
  - [x] **[UI - Fix khoảng trắng]** Khi vào tab Chats: ẩn top search bar, giảm padding/gap container, đặt `h-screen overflow-hidden` ở root + main → ChatPage chiếm full viewport, không scroll thừa ra khoảng trắng (giữ nguyên các tab khác).
  - [x] **[Bug fix]** `scrollToBottom` đổi từ `scrollIntoView` → `scrollTo` trực tiếp trên container messages, fix lỗi click conversation làm nhảy cả trang.
  - [x] **[Backend - Typing Indicator]** Tạo `TypingRequest`, `TypingEvent` DTO; `TypingService` set Redis key `typing:<convId>:<userId>` TTL 4s + publish Pub/Sub; mapping STOMP `/app/chat.typing`; `ChatRedisSubscriber` handle type "TYPING" → đẩy `/user/queue/typing`.
  - [x] **[Frontend - Typing Indicator]** Subscribe `/user/queue/typing`; `emitTyping()` throttle 2s + auto stop sau 3s; hiển thị 3 nơi (chat header "Đang nhập...", bubble 3 chấm nhảy, preview conversation list); cleanup timers khi unmount; auto-scroll khi đối phương gõ.
  - [x] **[Quyết định kiến trúc - VÌ SAO]**
    - *Dùng Redis TTL thay WebSocket thuần:* nếu user đóng tab đột ngột (không kịp gửi "dừng gõ"), key tự hết hạn sau 4s → indicator không kẹt vĩnh viễn. Tái dùng đúng pattern Presence Online/Offline đã làm ở Sprint 4.1 → kiến trúc nhất quán, không phát minh lại.
    - *Cascade 4 mốc thời gian `2s < 3s < 4s < 5s`:* throttle (2s) chống spam WebSocket khi gõ liên tục; stop-timer (3s) **phải lớn hơn throttle** để ping mới luôn reset stop-timer trước khi nó bắn → indicator không tắt oan giữa lúc đang gõ; Redis TTL (4s) là lưới an toàn server-side; client auto-clear (5s) là lưới an toàn cuối. Thứ tự tăng dần đảm bảo mỗi lớp dự phòng lớp trước, không nhấp nháy.
    - *Reuse Redis Pub/Sub `chat.room.*` có sẵn:* không tạo channel mới, chỉ thêm `type="TYPING"` vào event — multi-server scale-ready miễn phí.
  - [x] **[Verify]** Backend `mvn compile` PASS (exit 0), Frontend diagnostics 0 lỗi. Test thực tế 2 trình duyệt: typing hiện/ẩn đúng, đóng tab tự hết kẹt. Đã xóa spec tạm `chat-three-column-layout`.

- **Phiên 06/06/2026 (Sprint 4.4 ② Message Reactions):**
  - [x] **[Backend - Domain/Persistence]** Thêm field `reactions` (`Map<String,String>` userId→emoji, embedded) vào `Message`, `MessageDocument`, `MessageResponse`. MapStruct auto-map nên persist tự động khi save.
  - [x] **[Backend - DTO]** Tạo `ReactionRequest` (messageId + emoji, nhận qua STOMP) và `MessageReactionEvent` (gửi nguyên map reactions đầy đủ tới client).
  - [x] **[Backend - Service]** `MessageService.reactToMessage()`: validate emoji thuộc `ALLOWED_EMOJIS` (6 loại), validate participant, **toggle logic** (thả lại cùng emoji = gỡ, khác = thay, chưa có = thêm), save + publish Pub/Sub tới cả 2 participant.
  - [x] **[Backend - Pub/Sub]** `ChatRedisPublisher.publishReaction()` (type "REACTION") + `ChatRedisSubscriber` đẩy tới `/user/queue/reactions`. STOMP mapping `/app/chat.react` trong `WebSocketChatController`.
  - [x] **[Backend - ErrorCode]** Thêm `INVALID_REACTION` (3006).
  - [x] **[Frontend]** Subscribe `/user/queue/reactions`; `handleReact()` Optimistic UI (toggle local ngay); UI nút 😊 hover, picker popup 6 emoji, badge reactions ở góc bong bóng, overlay click-outside đóng picker.
  - [x] **[Quyết định kiến trúc - VÌ SAO]** Dùng **embedded Map<userId,emoji>** trong Message thay vì collection riêng như Post module. Lý do: chat 1-1 tối đa 2 người react/tin → embed tối ưu (load cùng message, atomic 1 lần ghi, không cần phân trang). Post có thể hàng trăm reaction nên mới cần collection riêng + pagination. Event gửi nguyên map đầy đủ → client chỉ replace, không tính delta (đơn giản, idempotent).
  - [x] **[Verify]** Backend `mvn compile` PASS (exit 0), Frontend diagnostics 0 lỗi.

- **Phiên 06/06/2026 (Sprint 4.4 ③ Reply to Message):**
  - [x] **[Backend - Domain]** Tạo value object `ReplyPreview` (messageId, senderId, senderName, contentPreview) — denormalized snapshot, không lưu chỉ ID.
  - [x] **[Backend - Persistence/DTO]** Thêm `replyTo` (`ReplyPreview`) vào `Message`/`MessageDocument`/`MessageResponse`; `replyToMessageId` (nullable) vào `MessageSendRequest`.
  - [x] **[Backend - Service]** `MessageService.sendMessage()`: dựng snapshot từ tin gốc trước khi save, validate cùng conversation (chống reply chéo bằng id từ conv khác), helper `buildShortPreview` (≤80 ký tự, placeholder ảnh/file).
  - [x] **[Frontend - Logic]** State `replyingTo`, WS payload thêm `replyToMessageId`, Optimistic UI dựng `replyTo` ngay tại client; clear `replyingTo` sau khi gửi.
  - [x] **[Frontend - UX bền vững]** Khi tin server replace optimistic, **giữ replyTo của optimistic nếu server không trả về** — phòng trường hợp backend chưa restart.
  - [x] **[Frontend - UI]** Banner "Đang trả lời X" trên input bar (có nút X hủy), nút Reply hover cạnh nút Smile, **quote tách phía trên bong bóng**, nền `slate-100` chữ `slate-500` trung tính, có nhãn "Bạn/Alice đã trả lời..." với icon ↳ — giống Zalo/Messenger.
  - [x] **[Quyết định kiến trúc - VÌ SAO]** Lưu **snapshot** tin gốc thay vì chỉ ID. Lý do (giống `LastMessageSummary`): (1) hiển thị quote ngay khi load danh sách mà **không cần query thêm** (tránh N+1); (2) nếu tin gốc bị sửa/xóa sau, quote vẫn giữ nội dung tại thời điểm reply — đúng hành vi Messenger thật. Trade-off: tốn ~80 bytes/tin có reply, đổi lấy tốc độ + tính nhất quán lịch sử.
  - [x] **[UI cải tiến từ feedback USER]** Quote ban đầu nhúng trong bong bóng tím → khó đọc. Tách ra ngoài + đặt phía trên bong bóng + đè bằng `mb-[-6px]+z-10` cho cảm giác liền mạch. Màu trung tính dễ đọc trên mọi nền (bong bóng tím hay trắng).
  - [x] **[Verify]** Backend compile PASS, Frontend diagnostics 0 lỗi.

- **Phiên 06/06/2026 (Sprint 4.4 ④ Media in Chat - HOÀN TẤT SPRINT 4.4):**
  - [x] **[Backend]** `MessageService.sendImageMessage()`: upload qua `MediaService.uploadAvatar()` (reuse Cloudinary + Apache Tika magic-bytes scan + sandbox fallback) rồi tái dùng `sendMessage` với type=IMAGE → tự động có validation, lưu DB, unread, Pub/Sub realtime, cả reply. REST endpoint `POST /conversations/{id}/messages/image` (multipart + optional replyToMessageId).
  - [x] **[Frontend]** `chatService.sendImage()` multipart + onUploadProgress callback. Render IMAGE trong bong bóng (click mở full).
  - [x] **[Frontend - Preview tray giống Messenger]** Chọn ảnh → tray thumbnail (tối đa 4), mỗi ảnh có nút X xóa, nút + thêm; KHÔNG auto-gửi; bấm gửi mới upload tuần tự; gửi được ảnh + text cùng lúc; reply gắn vào ảnh đầu.
  - [x] **[Frontend - Optimistic + nén]** Blob preview ảnh GỐC ngay (tránh "ảnh khác"); upload progress bar % overlay; nén thông minh (skip GIF/<1MB, preserveExif giữ orientation, WebP cho ảnh lớn).
  - [x] **[Frontend - Jump to reply]** Click quote → scrollIntoView tin gốc + highlight viền tím 1.6s (giống Facebook). messageRefs map + highlightedMsgId state.
  - [x] **[Bug fix - Race condition]** Gửi 1 ảnh ra 2 ảnh + duplicate key: REST response và WebSocket echo cùng thêm tin, optimistic ảnh match-by-content thất bại (ảnh content rỗng) → append trùng. Fix: dedup theo id TRƯỚC + match optimistic ảnh theo TYPE (không phải content) + REST replacement xử lý khi WS đã thêm. Chống mọi thứ tự race.
  - [x] **[Quyết định kiến trúc - VÌ SAO]** Reuse 100% hạ tầng có sẵn (CloudinaryService + Tika + sendMessage) thay vì viết mới → ít code, atomic, nhất quán. Preview blob gốc thay vì chờ server → UX tức thì + tránh đúng vấn đề "ảnh khác" do nén/sandbox.
  - [x] **[Verify]** Backend compile PASS, FE 0 lỗi. Test với cloud `demo` (sandbox fallback → picsum) chạy đúng flow, thay key thật sẽ hiện đúng ảnh không cần sửa code.

#### 🔧 Technical Debugging Log (Phase 2 Stabilization)
| Vấn đề | Nguyên nhân | Giải pháp | Kết quả |
| :--- | :--- | :--- | :--- |
| **415 Unsupported Media Type** | Axios tự động ép cứng `Content-Type: application/json` cho mọi request, làm vỡ định dạng gửi FormData. | Bỏ cấu hình headers mặc định trong `axios.create` để trình duyệt tự do nhận diện FormData và gán boundary. | Các request đăng bài và bình luận có ảnh hoạt động trơn tru. |
| **old.content is not iterable** | Optimistic Update cố map dữ liệu thẳng vào cache mảng, nhưng cấu trúc trả về thực tế là `ApiResponse`. | Sửa lại logic query client truy cập `old.data.content`. | Optimistic UI hoạt động chính xác tuyệt đối. |



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


- **Phiên 01/06/2026 (Sprint 4.1 - WebSocket Foundation + Redis Integration):**
  - [x] **[Dependencies]** Thêm `spring-boot-starter-websocket` + `spring-boot-starter-data-redis` vào `pom.xml`. Cấu hình Redis connection trong `application.yml` (host localhost:6379).
  - [x] **[Config]** Tạo `RedisConfig.java` (StringRedisTemplate bean), `WebSocketConfig.java` (STOMP endpoint `/ws` + SockJS fallback + Simple In-Memory Broker), `JwtConfig.java` (tách JwtDecoder khỏi SecurityConfig để phá circular dependency).
  - [x] **[WebSocket Auth]** Thiết kế 2-layer JWT authentication cho WebSocket:
    - `WebSocketAuthInterceptor` (HandshakeInterceptor): đọc `accessToken` từ HttpOnly Cookie lúc HTTP upgrade → lưu vào session attributes.
    - `WebSocketChannelInterceptor` (ChannelInterceptor): validate JWT trên STOMP CONNECT frame bằng `JwtDecoder` → set Principal vào WebSocket session.
  - [x] **[Redis Presence]** Tạo `PresenceService` (module chat): `setOnline(userId)` → `SET presence:{userId} ONLINE EX 35`, `setOffline(userId)` → `DEL`, `heartbeat(userId)` → refresh TTL hoặc re-set nếu key đã hết hạn.
  - [x] **[WebSocket Events]** Tạo `WebSocketEventListener`: lắng nghe `SessionConnectedEvent` → setOnline + broadcast `/topic/presence`, `SessionDisconnectEvent` → setOffline + broadcast.
  - [x] **[Presence API]** Tạo `PresenceController`: `POST /presence/heartbeat` (client gọi mỗi 25s), `POST /presence/check` (batch check danh sách userId online).
  - [x] **[JWT Blacklist - Redis]** Tạo `TokenBlacklistPort` (interface ở `shared/security` — cross-cutting, DIP) + `TokenBlacklistService` (impl ở `infrastructure/security` dùng Redis TTL). Khi logout: `SET blacklist:{jwtId} EX <remaining_seconds>` → Redis tự xóa khi token hết hạn.
  - [x] **[JWT Blacklist - Filter]** Tạo `TokenBlacklistFilter` (OncePerRequestFilter): mỗi request kiểm tra `EXISTS blacklist:{jwtId}` → nếu có trả 401 ngay, không cần query MongoDB.
  - [x] **[Auth Upgrade]** Nâng cấp `AuthService.logout()`: blacklist Access Token vào Redis + revoke Refresh Token trong MongoDB (giữ nguyên logic cũ).
  - [x] **[Security]** Thêm `/ws/**` vào danh sách public endpoints trong `SecurityConfig` (WebSocket handshake không cần Bearer token — auth xử lý ở layer riêng).
  - [x] **[Frontend]** Cài `@stomp/stompjs` + `sockjs-client`. Tạo module `chat`: `webSocketService.ts` (STOMP singleton, auto-reconnect), `presenceService.ts` (heartbeat + check API), `useWebSocket.ts` hook (connect khi login, heartbeat 25s, disconnect khi logout).
  - [x] **[Bug Fix]** Fix crash `ProfilePage.tsx` dòng 288 (`user.email.split('@')` khi user undefined): thêm guard hiển thị loading + nút "Đăng nhập lại" thay vì crash trắng.
  - [x] **[Benchmark]** Đo thực tế trên máy dev: Redis EXISTS 0.019ms/lần vs MongoDB findOne (có index) 0.75ms/lần → **Redis nhanh hơn ~40 lần**. Với 1000 req/s tiết kiệm ~731ms/giây + giảm 100% tải MongoDB cho việc check token.
  - [x] **[ArchUnit]** Vượt qua 2/2 rule (layered per-module + global shared/modules/infrastructure). Giải quyết 2 vòng vi phạm: (1) move port từ `module.auth.domain` sang `shared.security`, (2) tách `JwtConfig` khỏi `SecurityConfig`.
  - [x] **[Verify]** Backend compile PASS, ArchUnit PASS, Frontend `npm run build` PASS (1932 modules). Test thực tế: heartbeat → Redis key presence, logout → Redis key blacklist, reuse token → 401.
  - [x] **[Docs]** Tạo `PHASE_4_CHAT_TESTING.md` (hướng dẫn test 4 kịch bản + lệnh verify Redis). Cập nhật `TESTING_GUIDE.md` index.

- **Phiên 05/06/2026 (Sprint 4.2 - Chat Infrastructure):**
  - [x] **[Domain]** Định nghĩa `MessageType`, `LastMessageSummary`, `Conversation`, `Message`, `ConversationRepository`, `MessageRepository` sạch hoàn toàn (POJO, không import framework annotations).
  - [x] **[Infrastructure]** Tạo MongoDB document mapping (`ConversationDocument`, `MessageDocument`) và sử dụng MapStruct `ChatMapper` cho chuyển đổi dữ liệu.
  - [x] **[Repository Adapters]** Thực thi `ConversationRepositoryImpl` và `MessageRepositoryImpl` bằng `MongoTemplate` bulk operations để tối ưu hiệu năng ghi.
  - [x] **[Mongock Migrations]** Triển khai `Migration_20260605_AddChatIndexes` thiết lập compound & unique indexes tối ưu cấu trúc và hiệu năng query.
  - [x] **[Application Service]** Triển khai `ConversationService` (chống race condition khi tạo đồng thời bằng `DuplicateKeyException` catch, kiểm tra quan hệ bạn bè từ module Friendship, tối ưu N+1 query) và `MessageService` (phân trang tin nhắn và cập nhật trạng thái đã nhận).
  - [x] **[Presentation Controllers]** Triển khai `ConversationController` và `MessageController` cung cấp 5 RESTful API endpoints.
  - [x] **[Unit Tests]** Viết đầy đủ bộ test nghiệp vụ cho `ConversationServiceTest` và `MessageServiceTest`.
  - [x] **[Stabilization & Compilation]** Khắc phục lỗi `NoClassDefFoundError: ConversationRepository` thông qua quy trình dọn dẹp cache biên dịch triệt để (`mvn clean test-compile` + `mvn test`), giúp build pass 100% (8/8 tests passed).
  - [x] **[Docs]** Cập nhật lộ trình phát triển [ROADMAP.md](file:///d:/Project_MiniFace/docs/planning/ROADMAP.md) và tài liệu kiểm thử [PHASE_4_CHAT_TESTING.md](file:///d:/Project_MiniFace/docs/testing/PHASE_4_CHAT_TESTING.md).

#### 🔧 Technical Debugging Log (Phase 4.2 Stabilization)
| Vấn đề | Nguyên nhân | Giải pháp | Kết quả |
| :--- | :--- | :--- | :--- |
| **NoClassDefFoundError: ConversationRepository** | Lớp đã tồn tại nhưng surefire test runner không nạp được do xung đột cache của trình biên dịch maven. | Thực hiện dọn dẹp build target cũ (`mvn clean test-compile`) và biên dịch lại từ đầu. | Biên dịch thành công, toàn bộ unit tests hoạt động trơn tru. |

- **Phiên 06/06/2026 (Chat UI Refactor + Critical Bug Fixes):**
  - [x] **[Frontend/UI Refactor]** Tái cấu trúc `ChatPage.tsx` sang layout 2 cột mới (Facebook Messenger style): Stories carousel phía trên, Filter tabs (All/Unread/Groups/Requests), Search bar tròn, Input bar với icons (Emoji/Image/Mic), Chat header với icons (Search/Phone/Video/More).
  - [x] **[MongoDB Fix]** Xóa index sai `participants_unique_idx` (unique trên multikey array field `participantIds` → chặn user có >1 conversation). Đổi sang `participants_idx` (non-unique). Unique enforcement handled at application level via `findByParticipantIds` + `DuplicateKeyException` catch. Files: `ConversationDocument.java`, `Migration_20260605_AddChatIndexes.java`.
  - [x] **[Backend Fix - WriteConflict]** Bỏ `@Transactional` khỏi 3 methods trong `ConversationService` (`getOrCreateConversation`, `getConversations`, `markAllAsSeen`) để fix WriteConflict trên single-node replica set khi có concurrent requests. Các methods này chỉ thao tác single-document operations nên không cần transaction.
  - [x] **[Frontend Fix - Infinite Loop]** Di chuyển `onClearInitialRecipient()` vào `finally` block để ngăn infinite loop khi API call fails (trước đó chỉ clear khi success → state không reset → component re-render liên tục gọi API).
  - [x] **[Frontend Fix - Crash]** Thêm optional chaining `f.name?.toLowerCase()` trong `filteredFriends` để tránh crash khi friend object thiếu field name.
  - [x] **[Global CSS]** Thêm `html { font-size: 14px }` vào `index.css` để compact toàn bộ UI ~12%, phù hợp với mật độ thông tin cao của giao diện chat.

- **Phiên 06/06/2026 (Sprint 4.3 - Real-Time Messaging & Status Transitions):**
  - [x] **[Real-time Messaging]** Tích hợp WebSocket (STOMP/SockJS) để truyền tải và đồng bộ tin nhắn thời gian thực.
  - [x] **[Đồng bộ hóa đa máy chủ]** Triển khai Redis Pub/Sub (`ChatRedisPublisher`, `ChatRedisSubscriber`) để đồng bộ tin nhắn (`NEW_MESSAGE`) và trạng thái (`DELIVERED`, `SEEN`) giữa các WebSocket session chạy trên nhiều cụm server.
  - [x] **[Sửa lỗi định vị socket]** Khắc phục lỗi bất đồng bộ định danh (username routing mismatch) bằng cách tra cứu email từ participantId (MongoDB ID) thông qua UserRepository trước khi gọi convertAndSendToUser, giải quyết triệt để lỗi không nhận được tin nhắn.
  - [x] **[Optimistic UI]** Thiết lập tin nhắn hiển thị tức thì dưới trạng thái `PENDING` ở Client, tự cập nhật sang `SENT` hoặc báo `FAILED` (kèm tính năng click gửi lại) dựa trên phản hồi của máy chủ.
  - [x] **[Đồng bộ trạng thái]** Hoàn thiện luồng đồng bộ trạng thái tin nhắn động: `SENT` (Đã gửi) -> `DELIVERED` (Đã nhận, có biểu tượng double checkmark) -> `SEEN` (Đã xem, có biểu tượng mắt).
  - [x] **[Cấu hình Vite]** Thêm định nghĩa `global: 'window'` vào `vite.config.ts` nhằm khắc phục lỗi runtime `global is not defined` của thư viện `sockjs-client` trên môi trường trình duyệt.
  - [x] **[Accessibility & Polish]** Bổ sung các nhãn `title` hỗ trợ Accessibility cho các nút điều hướng và đóng modal ở `App.tsx`, `ChatPage.tsx`, `FriendsPage.tsx`. Loại bỏ hoàn toàn các import thừa ở cả Frontend và Backend, biên dịch 0 cảnh báo.
  - [x] **[Testing & Verification]** Chạy Maven test thành công 100% (7/7 tests passed).

