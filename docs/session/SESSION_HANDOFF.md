# 🤝 SESSION HANDOFF - MiniFaceBook Project

## 📅 Cập nhật ngày: 05/08/2026
## 🏁 Trạng thái hiện tại: 🟡 Production topology đang vận hành; source hiện có auth cookie, REST/SSE/STOMP, chat/media/post sharing, WebRTC global PiP, social notifications/deep links, comment image/reply và mobile touch UX.

> ⚠️ **Release gates:** GitHub Actions là CI-only, không phải CD. Trước release rộng rãi phải deny `/dev/**` ở prod, quyết định CSRF/Origin policy, xoay toàn bộ credential từng lộ, xác minh SHA deployed, backup/restore + rollback drill, browser smoke hai account cho realtime/call/media/OAuth/email và load test. Không commit `.env.production`, key AWS, URI Atlas hoặc bất kỳ secret nào.

---

## 📋 TÓM TẮT PHIÊN LÀM VIỆC (30/07/2026 - MOBILE RESPONSIVE UX HARDENING)

### Cloudinary Local Integration tiếp nối:

- `backend/config/application-local.yml` dùng Cloudinary credential local và `verify-on-startup: true`; startup phải log `Cloudinary credentials verified successfully` trước khi test upload.
- Cloudinary API key phải có quyền `create/upload` asset. Credential hợp lệ nhưng thiếu permission sẽ báo `Request forbidden due to missing permissions (actions=["create"])`.
- Sandbox random/Picsum fallback đã bị loại bỏ: config không đúng phải trả `UPLOAD_FAILED`, không tạo post/profile với ảnh giả.
- MongoDB chỉ lưu media URL; file mới nằm Cloudinary folders `miniface/avatars`, `miniface/covers`, `miniface/posts`. Seed/Picsum/Unsplash URLs cũ không tự migrate.

### Google OAuth Local Core tiếp nối:

- Google OAuth bật qua `app.oauth.google.enabled=true` trong `backend/config/application-local.yml`; redirect URI local là `http://localhost:8080/api/login/oauth2/code/google`.
- OAuth state dùng JSESSIONID tạm trong single backend instance, hủy sau callback; JWT HttpOnly cookie vẫn là application session.
- Google user mới xác nhận display name trước khi persist; verified email trùng local verified account auto-link; Google-only account không có password và hidden Change/Forgot Password.
- Chưa production-ready: optional create-password after Google reauthentication, OAuth test coverage, AWS custom HTTPS domains/cookies, production Google consent configuration.

### Post Image Upload Validation Hardening tiếp nối:

- Post upload hiện enforce 10 ảnh, raw FE 20MB/ảnh, final BE 10MB/ảnh và tổng 30MB/post; client nén WebP theo aggregate budget và giữ GIF theo policy final payload.
- Backend có DTO/service validation chống bypass multipart, `MediaService.uploadPostImage` dùng folder post riêng; avatar/cover vẫn giữ 5MB policy.
- `PostServiceTest` 7/7 và frontend build pass.
- Direct Signed Cloudinary Upload chưa bật. Cloudinary server-proxy local credential đã xác thực; kiến trúc ticket/ownership policy và account checklist: [`IMAGE_UPLOAD_VALIDATION_PLAN.md`](../planning/IMAGE_UPLOAD_VALIDATION_PLAN.md).

### Profile Privacy Controls tiếp nối:

- Backend thêm `ProfileFieldVisibility` cho city/hometown/work/relationship: `PUBLIC`, `FRIENDS`, `ONLY_ME`; mặc định an toàn là `FRIENDS`.
- API visitor `/user/{id}` lọc email, role, created/updated time tuyệt đối; chỉ trả field cá nhân theo friendship `ACCEPTED` và policy.
- Friends/Search/Suggestions không còn map email. UI Profile owner có privacy selector; visitor chỉ thấy trường được phép hoặc empty state.
- Xác minh: frontend build pass; `AuthServiceTest` + `FriendshipServiceTest` 8/8 pass sau clean rebuild.
- Policy chi tiết và contract API: [`docs/guidelines/PROFILE_PRIVACY_POLICY.md`](../guidelines/PROFILE_PRIVACY_POLICY.md).

### P0 Redesign tiếp nối:

- Profile: Logout đã chuyển vào overflow menu; Edit Profile là compact action; tabs là Posts/Friends/About.
- Feed: Create Post dùng compact composer và portal dialog; Check-in/Poll nằm trong More menu; PostCard có text clamp/media cap/zero-counter hiding.
- Xác minh: `npm run build` pass, mobile P0 E2E 3/3, feed E2E 3/3. Profile full test 4/5 do auth/session 401 flake đã biết.
- Route scroll reset: đã sửa lỗi Friends scroll offset làm Chat bị che phần đầu; mobile P0 E2E hiện 4/4 pass.

### Công việc đã thực hiện:

1. **Responsive Foundation & Navigation Shell:**
   - Thêm `viewport-fit=cover`, safe-area tokens, `100dvh`, reduced motion và focus-visible.
   - Tạo `MobileHeader.tsx`, `MobileBottomNav.tsx`; loại bỏ mobile header trùng trong `MainLayout`.
   - Bottom Navigation gồm Trang chủ, Bạn bè, Trò chuyện, Thông báo, Cá nhân với unread badges và active state theo URL.

2. **Notification, Chat & Touch-first Feed:**
   - Notification dùng Bottom Sheet trên mobile, floating panel trên desktop; hỗ trợ backdrop, Escape và body scroll lock.
   - Chat list full-width single-pane; Back điều hướng về `/chats`; composer, emoji picker và profile panel được tối ưu mobile/safe-area.
   - PostCard/CreatePostCard có spacing responsive, action 44px, long-press Reaction Picker và không còn horizontal overflow.

3. **Profile, Admin & Automated Verification:**
   - Profile avatar/cover/action/tab hỗ trợ touch; Admin topbar/search/action responsive.
   - Thêm Playwright `mobile-chromium` 360×800 và `mobile-responsive.spec.ts`.
   - `npm run build`: PASS. Mobile E2E: 2/2 PASS. Responsive regression chọn lọc: PASS.
   - Full Chromium suite: 12/17 PASS; 5 failure bắt đầu từ login/session trả 401 trong suite dài, không tái hiện trong các test responsive chạy riêng.

### Files chính:

- `frontend/src/components/layout/MobileHeader.tsx`
- `frontend/src/components/layout/MobileBottomNav.tsx`
- `frontend/src/components/layout/MainLayout.tsx`
- `frontend/src/modules/chat/components/ChatPage.tsx`
- `frontend/src/modules/post/components/PostCard.tsx`
- `frontend/src/modules/post/components/CreatePostCard.tsx`
- `frontend/src/modules/profile/components/ProfilePage.tsx`
- `frontend/src/modules/admin/pages/AdminDashboardPage.tsx`
- `frontend/tests/mobile-responsive.spec.ts`
- `frontend/playwright.config.ts`

---

## 📋 TÓM TẮT PHIÊN LÀM VIỆC (29/07/2026 - ADMIN USER DETAILS MODAL & PAGINATION SYNC)

### Công việc đã thực hiện:

1. **Admin Control Center User Details Preview Modal**:
   - Bổ sung Modal xem chi tiết hồ sơ người dùng trong bảng Quản lý Người dùng ([AdminDashboardPage.tsx](file:///d:/Project/Web%20MiniFace/frontend/src/modules/admin/pages/AdminDashboardPage.tsx)).
   - Hiển thị đầy đủ: Avatar phóng to, Tên người dùng, Email, User ID, Vai trò (Super Admin / User), Trạng thái tài khoản (Hoạt động / Banned), Trạng thái xác thực Email, Trạng thái Online Realtime, Ngày đăng ký tài khoản.
   - Bổ sung nút bấm trực tiếp thay đổi vai trò (Role Swap) và Khóa/Mở khóa (Ban/Unban) ngay trong Modal.

2. **Server-side Pagination & UI Controls (Phân trang người dùng & bài viết)**:
   - Tích hợp phân trang Server-side linh hoạt cho cả 2 tab **Quản lý Người dùng** và **Kiểm duyệt Bài viết** với `page`, `size`, `totalPages`, `totalElements`.
   - Bổ sung thanh điều hướng phân trang UI chuyên nghiệp (`Trang trước`, `1, 2, 3...`, `Trang sau`) giúp xem toàn bộ người dùng và bài viết trong hệ thống mà không lo dữ liệu bị giới hạn.

1. **Fix System Broadcast Notification & Missing Enum Value**:
   - Thêm `SYSTEM_ANNOUNCEMENT` và `SYSTEM_MODERATION` vào `NotificationType` enum ở cả Backend (Java) & Frontend (TypeScript), sửa lỗi `IllegalArgumentException` làm nuốt thông báo.
   - Gỡ bỏ bộ lọc `isVerified` trong `AdminService.java` để 100% người dùng hệ thống (kể cả seed users) nhận thông báo vào Database MongoDB.
   - Loại bỏ hoàn toàn thẻ `<img>` hỏng và hiển thị Icon Khiên Admin tím dạ quang (`Shield 🛡️`) chuẩn Vector Lucide với tên người gửi **Ban Quản Trị (Admin)**.

2. **Kênh kép Realtime Notification Badge (WebSocket STOMP + SSE)**:
   - Cấu hình `useNotifications.ts` lắng nghe song song kênh WebSocket STOMP (`/topic/notifications`) và SSE (`/api/events/notifications`).
3. **Nâng cấp Profile UI/UX & Khắc phục nạp bạn bè**:
   - Ẩn dòng "Quyền hạn hệ thống: USER/ADMIN" khỏi Tab Giới thiệu để bảo mật và giữ thẩm mỹ tinh tế.
   - Loại bỏ các nút "Chỉnh sửa" trùng lặp dư thừa; chuẩn hóa 1 nút duy nhất **Chỉnh sửa trang cá nhân** ở Header.
   - Nâng cấp nút "Bạn bè (Hủy kết bạn)" thô cứng thành **Dropdown Menu `✓ Bạn bè` 🔽** với lựa chọn "Hủy kết bạn" chuẩn 100% Facebook UI/UX.
   - Khắc phục triệt để lỗi bạn bè bị nảy về 0 khi tải ảnh đại diện/ảnh bìa bằng cách bảo lưu dữ liệu hiện có trong `ProfilePage.tsx`.

1. **Backend Spring Security JWT Role Fix (Spring Boot 3 + Java 21)**:
   - Cập nhật `AuthenticationService.java` & `AuthService.java` đưa danh sách `roles` (`ADMIN`, `USER`) vào JWT Claim.
   - Cấu hình `JwtAuthenticationConverter` với `JwtGrantedAuthoritiesConverter` (Set prefix `"ROLE_"`, claim `"roles"`) trong `SecurityConfig.java`.
   - Loại bỏ triệt để lỗi `403 Forbidden` do thiếu Granted Authority `ROLE_ADMIN`, giúp 4 thẻ KPI nạp số liệu thật từ MongoDB tức thì.

2. **Frontend Standalone Admin Layout & Cyberpunk Redesign (React + TypeScript)**:
   - Tạo mới `AdminLayout.tsx` độc lập 100% tràn viền màn hình: Topbar Admin chuyên dụng (Hizo Admin Logo, ICT Live Clock, Super Admin Badge, Nút "Về trang chủ MiniFaceBook", Logout).
   - Tái thiết kế `AdminDashboardPage.tsx` theo phong cách **Sleek Dark Mode Cyberpunk** (`#090d16` / `#0f172a`), thẻ KPI Glassmorphism viền dạ quang (Purple/Indigo/Pink/Emerald).
   - Đưa route `/admin` ra ngoài `MainLayout` trong `App.tsx`, bọc bởi `ProtectedRoute` $\rightarrow$ `AdminRoute` $\rightarrow$ `AdminLayout`.

1. **Admin Portal Backend (Spring Boot 3 + Java 21)**:
   - Thêm trường `banned` vào `UserDocument` & `User`. Chặn đăng nhập tức khắc trong `AuthService` với mã lỗi `USER_BANNED` (1029).
   - Tạo các DTOs: `AdminStatsResponse`, `AdminUserResponse`, `AdminPostResponse`, `AdminBroadcastRequest`.
   - Tạo `AdminService.java` & `AdminController.java` (`@PreAuthorize("hasRole('ADMIN')")`) xử lý 4 use-cases: Thống kê KPI, Quản lý User (Ban/Unban & Role Swap), Kiểm duyệt Bài viết (Xóa bài vi phạm), và Phát thông báo toàn hệ thống (System Broadcast).

2. **Admin Portal Frontend (React + TypeScript + TailwindCSS)**:
   - Component `AdminDashboardPage.tsx` đa tab: 4 Thẻ KPI Analytics, Bảng danh sách User (Ban/Unban, Role Swap, Search), Grid Kiểm duyệt bài viết (Delete), Form Phát thông báo hệ thống.
   - `AdminRoute.tsx` bảo vệ route `/admin` (Redirect nếu không phải Admin).
   - Bổ sung nút "Trang Quản trị (Admin)" trong Sidebar trái và Dropdown Menu góc phải.

3. **Playwright E2E WebRTC Test & Full Docs Sync**:
   - Viết mới test case `should handle 1-1 WebRTC voice call flow and end call cleanly` trong `chat.spec.ts`.
   - Thực thi "Update Full Protocol" đồng bộ 6 file tài liệu kiến trúc (`ROADMAP`, `SESSION_HANDOFF`, `PROGRESS`, `CV_PORTFOLIO_HIGHLIGHTS`, `README`, `implementation_plan`).

1. **Backend Call Signaling (Spring Boot 3 + WebSocket STOMP)**:
   - Tạo DTO `CallSignalMessage.java` chứa các tín hiệu SDP (`OFFER`, `ANSWER`, `ICE_CANDIDATE`, `REJECT`, `END`, `CANCEL`).
   - Tạo Controller `CallSignalingController.java` xử lý định tuyến tín hiệu realtime qua STOMP destination `/app/call.signal` $\rightarrow$ rơ-le về kênh `/topic/call/{calleeId}`.

2. **Frontend WebRTC Engine & Modals (React + TypeScript)**:
   - Tạo Custom Hook `useWebRTCCall.ts` khởi tạo `RTCPeerConnection` P2P, kết nối Google STUN (`stun:stun.l.google.com:19302`), quản lý audio/video tracks.
   - Component `IncomingCallModal.tsx`: Nhạc chuông reo tự tổng hợp, avatar người gọi, sóng hiệu ứng animation, nút Nghe (Xanh) & Từ chối (Đỏ).
   - Component `ActiveCallModal.tsx`: Xem Stream Video / Voice Avatar realtime, nút Mute Mic và Kết thúc cuộc gọi màu đỏ.
   - Kết nối nút Gọi thoại & Gọi video ở header `ChatPage.tsx`.

3. **Giao thức Quản trị AI (.agents/AGENTS.md)**:
   - Tạo mới tệp hiến pháp `.agents/AGENTS.md` thiết lập quy định phân lớp Clean Architecture, Update Full Protocol, cấm tự động mở browser ngầm và cấm tự động push code Git khi chưa xin phép.

### Files chính:
- `backend/src/main/java/com/minifacebook/module/chat/application/dto/CallSignalMessage.java`
- `backend/src/main/java/com/minifacebook/module/chat/presentation/CallSignalingController.java`
- `frontend/src/modules/chat/types/call.types.ts`
- `frontend/src/modules/chat/hooks/useWebRTCCall.ts`
- `frontend/src/modules/chat/components/IncomingCallModal.tsx`
- `frontend/src/modules/chat/components/ActiveCallModal.tsx`
- `frontend/src/modules/chat/components/ChatPage.tsx`
- `.agents/AGENTS.md`
- `docs/planning/ROADMAP.md`
- `docs/planning/PROGRESS.md`
- `docs/guidelines/CV_PORTFOLIO_HIGHLIGHTS.md`

---

## 📋 TÓM TẮT PHIÊN LÀM VIỆC (27/07/2026 - SPRINT 8.5: NESTED COMMENT REPLY & REALTIME COUNT SYNC)

### Công việc đã thực hiện:

1. **Nested Comment Reply (Trả lời bình luận đa cấp)**:
   - **Backend**: Thêm trường `parentId` trong Entity, Document, DTOs và Service của `Comment` module. Cập nhật `CommentService.addComment` để kiểm tra tồn tại comment gốc và map `parentId` vào response.
   - **Frontend**: Cập nhật `CommentResponse` type & `postService.addComment`. Triển khai full UI/UX reply chuẩn Facebook trong `CommentSection.tsx`:
     - Nút **"Phản hồi"** hoạt động → set state `replyTo` & auto-focus textarea.
     - Badge tím **"Đang trả lời [Tên]..."** kèm nút hủy `[x]`.
     - Placeholder ô nhập đổi động theo đối tượng trả lời.
     - Tách top-level comments & replies, render lùi lề (`ml-10` + `border-l-2`) với avatar nhỏ hơn (`h-7 w-7`).

2. **Phân quyền Xóa Bình luận chuẩn Facebook**:
   - Tác giả viết bình luận (`comment.authorId === currentUser.id`) HOẶC Chủ sở hữu bài viết (`postAuthorId === currentUser.id`) đều có quyền xóa bình luận.

3. **Vá lỗi Realtime Count Sync & Race Condition**:
   - Loại bỏ xung đột trừ đôi số đếm bình luận khi xóa comment.
   - Bổ sung SSE `postCounts` listener trong `PostDetailModal.tsx` để nhận số đếm realtime từ backend một cách nhất quán trên cả Feed lẫn Modal.
   - Biên dịch thành công 100% qua `npm run build` (giai đoạn Vite & TypeScript compilation).

### Files chính:
- `backend/src/main/java/com/minifacebook/module/post/domain/entity/Comment.java`
- `backend/src/main/java/com/minifacebook/module/post/infrastructure/persistence/document/CommentDocument.java`
- `backend/src/main/java/com/minifacebook/module/post/application/dto/CommentRequest.java`
- `backend/src/main/java/com/minifacebook/module/post/application/dto/CommentResponse.java`
- `backend/src/main/java/com/minifacebook/module/post/application/service/CommentService.java`
- `frontend/src/modules/post/types/post.types.ts`
- `frontend/src/modules/post/services/postService.ts`
- `frontend/src/modules/post/components/CommentSection.tsx`
- `frontend/src/modules/post/components/PostDetailModal.tsx`
- `docs/architecture/DATABASE_SCHEMA.md`
- `docs/planning/ROADMAP.md`
- `docs/guidelines/CV_PORTFOLIO_HIGHLIGHTS.md`

---

## 📋 TÓM TẮT PHIÊN LÀM VIỆC (10/07/2026 - SPRINT 6.5: UI REFINEMENTS, PROFILEPAGE SIDEBAR & E2E TEST COVERAGE)

### Công việc đã thực hiện:

1. **ChatPage UI Cleanup**:
   - Xóa nút tìm kiếm tròn (standalone search button) trong khung chat header theo yêu cầu người dùng.
   - Xóa nút "Tùy chọn hội thoại" (SlidersHorizontal icon) trong chat header để đơn giản hóa UI.
   - Sửa lỗi biến `msgSearchQuery` chưa được khai báo gây crash `ReferenceError`.

2. **ProfilePage Sidebar — Hiển thị Dữ liệu Thật**:
   - Sidebar "Giới thiệu" đọc đúng field `name`, `work`, `city`, `hometown` từ API/state.
   - Khu vực "Hình ảnh" giữ nguyên label + nút "Xem tất cả" dù trống — hiển thị "Chưa có hình ảnh đăng tải" thay vì xóa section.
   - "Bạn bè" hiển thị dạng grid tối đa 6 avatar với tên thật; nút "Xem tất cả bạn bè" điều hướng đến tab Bạn bè.

3. **Playwright E2E Test Coverage (Đầy đủ)**:
   - **Mới:** `frontend/tests/profile.spec.ts` — 6 test cases: hiển thị tên thật, lưu/hiển thị work+city, Photos box, Friends box (kết bạn rồi kiểm tra), điều hướng tab, xem profile người khác.
   - **Cập nhật:** `frontend/tests/chat.spec.ts` — 6 test cases: không có search/options button, gửi/nhận tin, typing indicator, infinite scroll, xóa thu hồi tin nhắn.

4. **Update Full Protocol (9.7):**
   - Đồng bộ 7 file tài liệu: `DATABASE_SCHEMA.md` (thêm trường user mở rộng bio/city/hometown/work/relationship), `PROGRESS.md`, `ROADMAP.md`, `SESSION_HANDOFF.md`, `CV_PORTFOLIO_HIGHLIGHTS.md` (Highlight 51), `README.md`.

### Files chính:
- `frontend/src/modules/chat/components/ChatPage.tsx`
- `frontend/src/modules/profile/components/ProfilePage.tsx`
- `frontend/tests/profile.spec.ts` *(mới)*
- `frontend/tests/chat.spec.ts` *(cập nhật)*
- `docs/planning/PROGRESS.md`, `docs/planning/ROADMAP.md`
- `docs/guidelines/CV_PORTFOLIO_HIGHLIGHTS.md`
- `docs/architecture/DATABASE_SCHEMA.md`

---

## 📋 TÓM TẮT PHIÊN LÀM VIỆC (10/07/2026 - SPRINT 6.4: INFINITE SCROLL, SETTINGS PAGE & CACHING ENHANCEMENTS)

### Công việc đã thực hiện:

1. **Cuộn vô hạn (Infinite Scroll)**:
   - Chuyển đổi nút "Xem thêm" cũ ở News Feed sang cơ chế cuộn trang tự động bằng `IntersectionObserver`.
   - Frontend tự nhận diện vị trí cuộn và load tiếp các trang bài viết, Backend hỗ trợ phân trang hiệu quả.

2. **Trang Cài đặt & Đổi mật khẩu (Settings & Change Password)**:
   - Tạo mới trang Settings tại `/settings` để người dùng đổi mật khẩu với giao diện mượt mà, validate trường thông tin đầy đủ.
   - Khi đổi mật khẩu thành công, hệ thống tự động thu hồi (evict) toàn bộ session và token cũ trong DB lẫn Redis và đăng xuất người dùng để bảo mật.

3. **Vá lỗi Redis Cache Sync**:
   - Khắc phục lỗi cache stale khi cập nhật Profile/Avatar bằng cách xóa cache đồng thời cả hai key `user:profile:id:<userId>` và `user:profile:email:<email>`.

4. **Đồng bộ AppException & JUnit 5 / Playwright Test**:
   - Chuyển đổi các Exception của Post, Comment, Reaction sang AppException với ErrorCode và mã lỗi JSON chuẩn.
   - Thêm các bộ test integration (Backend JUnit 5) và E2E (Frontend Playwright) để kiểm chứng tự động toàn bộ luồng hoạt động.

5. **Vá lỗi kiểm thử trên CI/CD**:
   - Khắc phục lỗi bất khớp thông điệp lỗi tiếng Anh vs tiếng Việt trong `PostServiceTest` và `CommentServiceTest` bằng cách sử dụng `ErrorCode.POST_UNAUTHORIZED.getMessage()`.
   - Khắc phục lỗi `DuplicateKeyException` trong `PostIntegrationTest.testPostErrorScenarios` bằng cách dọn dẹp email `other@example.com` vào `setUp()`.
   - Cập nhật tài liệu `ROADMAP.md` phản ánh chính xác trạng thái hoàn thành của Sprint 6.4.

### Files chính:
- `frontend/src/modules/post/components/PostFeed.tsx`
- `frontend/src/modules/profile/components/SettingsPage.tsx`
- `backend/src/main/java/com/minifacebook/module/auth/application/service/AuthService.java`
- `backend/src/main/java/com/minifacebook/module/post/application/service/PostService.java`
- `backend/src/test/java/com/minifacebook/module/post/application/service/PostServiceTest.java`
- `backend/src/test/java/com/minifacebook/module/post/application/service/CommentServiceTest.java`
- `backend/src/test/java/com/minifacebook/module/post/presentation/PostIntegrationTest.java`
- `frontend/tests/settings.spec.ts`

---

## 📋 TÓM TẮT PHIÊN LÀM VIỆC (29/06/2026 - SPRINT 6.3 - PART 4: SONARCLOUD QUALITY GATE INTEGRATION & LINTER FIX)

### Công việc đã thực hiện:

1. **Tích hợp SonarCloud & Quality Gate**:
   * Cấu hình dự án `sonar-project.properties` cho Monorepo.
   * Xây dựng workflow `.github/workflows/sonar-quality-gate.yml` và tích hợp bước chạy `sonar-scanner` tự động trong `.github/workflows/ci.yml`.
   * Cấu hình test coverage với **JaCoCo** cho Backend và **Vitest (V8)** cho Frontend.

2. **Khắc phục lỗi VS Code Linter (Lombok & MapStruct)**:
   * Bổ sung `lombok-mapstruct-binding` trong `backend/pom.xml` để đảm bảo thứ tự biên dịch chính xác của Lombok và MapStruct trên IDE Java Language Server, xóa bỏ toàn bộ lỗi đỏ giả lập.

### Files chính:
- `sonar-project.properties`
- `.github/workflows/sonar-quality-gate.yml`
- `.github/workflows/ci.yml`
- `backend/pom.xml`
- `frontend/package.json`
- `frontend/vite.config.ts`

---

## 📋 TÓM TẮT PHIÊN LÀM VIỆC (27/06/2026 - SPRINT 6.3 - PART 3: PROFILE NAVIGATIONS & EMPTY CHAT SYNCHRONIZATION)

### Công việc đã thực hiện:

1. **Điều hướng Trang cá nhân (Profile Navigations)**:
   * Cho phép người dùng nhấp vào avatar hoặc tên hiển thị của tác giả trong phần bình luận (`CommentSection.tsx`) để chuyển hướng sang trang cá nhân của họ `/profile/:userId`.
   * Tích hợp sự kiện nhấp điều hướng sang trang cá nhân cho bạn chat khi nhấp vào tên/avatar ở thanh tiêu đề chat và nút hành động "Profile" ở khung chi tiết bên phải (`ChatPage.tsx`).

2. **Khắc phục lỗi Chat rỗng (Empty Chat Synchronization)**:
   * Giải quyết triệt để lỗi khi người dùng mới (chưa có bất kỳ cuộc hội thoại nào) bấm nút "Nhắn tin" từ danh sách bạn bè thì giao diện bị kẹt ở trạng thái loading do danh sách hội thoại rỗng (`conversations.length === 0`).
   * Bổ sung cờ `hasLoadedConvs` để theo dõi chính xác trạng thái tải danh sách hội thoại từ API và bảo đảm quá trình khởi tạo cuộc trò chuyện diễn ra chuẩn xác.

3. **E2E & Build Verification**:
   * Chạy `npm run build` biên dịch dự án thành công hoàn hảo.
   * Chạy Playwright E2E tests (`npx playwright test`) vượt qua 9/9 tests thành công 100% trên cả 3 trình duyệt Chromium, Firefox, Webkit.

### Files chính:
- `frontend/src/modules/post/components/CommentSection.tsx`
- `frontend/src/modules/chat/components/ChatPage.tsx`
- `frontend/src/modules/friends/components/FriendsPage.tsx`

---

## 📋 TÓM TẮT PHIÊN LÀM VIỆC (27/06/2026 - SPRINT 6.3 - PART 2: GITHUB ACTIONS SETUP)

### Công việc đã thực hiện:

1. **Thiết lập GitHub Actions Workflow**:
   * Tạo tệp cấu hình `.github/workflows/ci.yml` tại thư mục gốc.
   * Thiết lập môi trường chạy bao gồm JDK 21 (Temurin) và Node.js (20) kèm cơ chế cache Maven và npm dependencies.
   * Cấu hình khởi chạy tự động cụm dịch vụ MongoDB Replica Set (rs0), Redis, và Mailpit thông qua `docker-compose up -d`.
   * Thêm bước Healthcheck chờ MongoDB khởi động hoàn toàn và replica set hoạt động trước khi chạy test.
   * Cấu hình chạy toàn bộ Unit/Integration Tests của Backend (`mvn clean test`).
   * Cấu hình chạy ngầm Backend server (`mvn spring-boot:run`) và loop healthcheck port 8080.
   * Cấu hình cài đặt frontend dependencies, playwright browsers và chạy E2E Playwright Tests.
   * Hỗ trợ lưu trữ báo cáo kết quả kiểm thử (Playwright HTML report) lên Artifacts của GitHub Action khi build thất bại.

2. **Cập nhật Lộ trình & Nhật ký tiến độ**:
   * Đồng bộ và đánh dấu hoàn thành mục thiết lập GitHub Actions trong `ROADMAP.md` và `PROGRESS.md`.

### Files chính:
- `.github/workflows/ci.yml`
- `docs/planning/ROADMAP.md`
- `docs/planning/PROGRESS.md`
- `docs/session/SESSION_HANDOFF.md`

---

## 📋 TÓM TẮT PHIÊN LÀM VIỆC (27/06/2026 - INTEGRATION TESTING, REDIS CACHE & SOFT DELETE AUDIT)

### Công việc đã thực hiện:

1. **MockMvc Integration Testing**:
   * Phát triển `PostIntegrationTest.java` bao phủ toàn bộ vòng đời của Bài viết: Tạo bài viết -> Thả cảm xúc -> Thêm bình luận -> Xóa mềm bình luận -> Xóa mềm bài viết.
   * Phát triển `MessageIntegrationTest.java` bao phủ luồng Chat: Gửi tin nhắn -> Đánh dấu delivered -> Sửa nội dung tin nhắn -> Thu hồi/xóa mềm tin nhắn.
   * Cả 2 kiểm thử tích hợp sử dụng `MockMvc` chạy hoàn chỉnh trên cơ sở dữ liệu MongoDB và Redis.
   * Toàn bộ test suite backend đạt kết quả **34/34 tests PASS (100%)**.

2. **Audit và Verify Caching & Soft Delete**:
   * Kiểm chứng cơ chế Soft Delete bài viết (Phase 2) và tin nhắn (Sprint 4.5) hoạt động chính xác ở cả tầng Service và Database.
   * Kiểm chứng Redis Caching cho Profile người dùng (`AuthService`) và danh sách bạn bè (`FriendshipService`) chạy ổn định, tự động làm sạch (evict) khi cập nhật dữ liệu.

3. **Cập nhật Tài liệu & STAR Highlights**:
   * Đồng bộ và đánh dấu hoàn thành Sprint 6.2 trong `ROADMAP.md` và `PROGRESS.md`.
   * Thêm Highlight 45 (STAR format) vào tệp tin `CV_PORTFOLIO_HIGHLIGHTS.md`.

### Files chính:
- `backend/src/test/java/com/minifacebook/module/post/presentation/PostIntegrationTest.java`
- `backend/src/test/java/com/minifacebook/module/chat/presentation/MessageIntegrationTest.java`
- `docs/planning/ROADMAP.md`
- `docs/planning/PROGRESS.md`
- `docs/guidelines/CV_PORTFOLIO_HIGHLIGHTS.md`
- `docs/session/SESSION_HANDOFF.md`

---

## 📋 TÓM TẮT PHIÊN LÀM VIỆC (26/06/2026 - MODAL REDESIGN & SSE & UX FIXES & COMMENT DELETION)

### Công việc đã thực hiện:

1. **Split-Pane Post Detail Modal (Facebook-style Viewer):**
   * Thay vì hiển thị bình luận ngay dưới bài viết ở trang chủ gây giật khung hình, khi nhấn "Bình luận", hệ thống mở một Modal chia đôi màn hình (Split-pane) hiện đại.
   * **Bài viết có ảnh:** Cột trái hiển thị ảnh rộng căn giữa với nền đen, hỗ trợ chuyển slide ảnh mượt mà. Cột phải là bình luận và thông tin tác giả.
   * **Bài viết không ảnh:** Cột trái hiển thị khung màu tím khói thanh lịch thương hiệu Hizo (`bg-[#F4F0FD]`), chữ trích dẫn tím sẫm (`text-[#3F2E60]`) kèm ký tự trích dẫn nghệ thuật (`“`/`”`). Cột phải là bình luận.
   * **Responsive:** Cột trang trí bên trái tự động ẩn trên thiết bị di động (`hidden md:flex`) để tối ưu hóa diện tích hiển thị.
   * **Độ mờ nền (Backdrop Blur):** Tinh chỉnh độ mờ nền vừa phải (`backdrop-blur-[6px] bg-slate-950/50`) giúp nhìn nhẹ nhàng bố cục trang chủ bên dưới.

2. **Gia cố & Tối ưu hóa Real-time SSE:**
   * Khắc phục lỗi trình duyệt bị giới hạn kết nối (SSE Connection Limit) khi mở nhiều bài viết. Tích hợp cơ chế đăng ký SSE linh hoạt trên Backend và tối ưu hóa việc quản lý luồng ngầm trên Frontend.

3. **Sửa lỗi lọt sự kiện Hover cảm xúc (Reaction Scoping UX Fix):**
   * Di chuyển sự kiện `onMouseEnter`/`onMouseLeave` của bảng chọn cảm xúc ra khỏi khung chứa lớn. Bây giờ chỉ khi rê chuột trực tiếp vào **nút "Thích" (Like)** thì bảng chọn cảm xúc mới hiển thị, không bị hiện nhầm khi rê chuột qua nút "Bình luận" hay "Chia sẻ". Sửa đồng bộ ở cả `PostCard.tsx` và `PostDetailModal.tsx`.

4. **Xóa bình luận Realtime qua SSE:**
   * Triển khai sự kiện truyền thông tin xóa bình luận realtime qua SSE. Khi một bình luận bị xóa, Backend sẽ phát sự kiện kèm cờ `deleted: true`. Client bắt được sự kiện này sẽ tự động loại bỏ bình luận khỏi cache dữ liệu hiển thị (React Query) của bài viết tương ứng mà không cần tải lại toàn trang.

5. **Khắc phục hoàn toàn lỗi Accessibility (A11y):**
   * Bổ sung đầy đủ các thuộc tính `title` và `aria-label` cho tất cả các nút đóng modal (`X`), nút điều hướng ảnh, giúp giải quyết triệt để cảnh báo khả năng tiếp cận và đảm bảo dự án build thành công 100% không lỗi lầm.

### Files chính:
- `frontend/src/modules/post/components/PostDetailModal.tsx`
- `frontend/src/modules/post/components/PostCard.tsx`
- `frontend/src/modules/post/components/CommentSection.tsx`
- `backend/src/main/java/com/minifacebook/module/post/application/service/CommentService.java`
- `docs/session/SESSION_HANDOFF.md`

---

## 📋 TÓM TẮT PHIÊN LÀM VIỆC (12/06/2026 - CHAT HARDENING & ACCESSIBILITY FIXES)

### Công việc đã thực hiện:

1. **Review 1 - Frontend Rollback Optimistic UI:** Gia cố ChatPage.tsx để tự khôi phục trạng thái cũ khi edit message, delete me, hoặc delete everyone thất bại. Tránh tình trạng UI báo đã xóa/sửa nhưng backend reject do hết hạn 15 phút, mất mạng hoặc hết phiên.
2. **Review 2 - Backend Unit Tests:** Mở rộng MessageServiceTest.java thêm các kịch bản: owner-only, text-only, cửa sổ 15 phút, deletedFor, soft delete cho mọi người, và lọc tin nhắn đã xóa riêng.
3. **Accessibility (A11y) Linter Fixes:** Bổ sung thuộc tính `title` mô tả hành động cho các thẻ `<input type="file" className="hidden" />` trong `CreatePostCard.tsx` (dòng 163) và `ProfilePage.tsx` (dòng 300), giải quyết triệt để lỗi đỏ của A11y Linter.
4. **Dọn dẹp Warnings Backend:** Xóa bỏ các `import` thư viện thừa không sử dụng tại `ConversationService.java`, `NotificationEventListener.java`, và `MessageServiceTest.java`.
5. **Verify:** Chạy `mvn test` PASS 18/18 tests thành công trên Backend.

### Files chính:
- `frontend/src/modules/chat/components/ChatPage.tsx`
- `frontend/src/modules/post/components/CreatePostCard.tsx`
- `frontend/src/modules/profile/components/ProfilePage.tsx`
- `backend/src/main/java/com/minifacebook/module/chat/application/service/ConversationService.java`
- `backend/src/main/java/com/minifacebook/module/notification/application/listener/NotificationEventListener.java`
- `backend/src/test/java/com/minifacebook/module/chat/application/service/MessageServiceTest.java`
- `docs/planning/PROGRESS.md`
- `docs/planning/ROADMAP.md`

---
## 📋 TÓM TẮT PHIÊN LÀM VIỆC (08/06/2026 - SPRINT 5.7)

### Công việc đã thực hiện:

1. **Dashboard Localization (Việt hóa toàn diện):**
   * Sidebar bên trái: Dịch toàn bộ sang tiếng Việt (Khám phá, Bạn bè, Cộng đồng, Trò chuyện, Thông báo, Bộ sưu tập, Trang cá nhân, Cài đặt).
   * Thanh tìm kiếm: Placeholder đổi thành "Tìm kiếm bạn bè, bài viết, cộng đồng...".
   * Widgets bên phải: Việt hóa "Chủ đề xu hướng", "Gợi ý kết bạn", nút "Xem tất cả", "Kết bạn", "Xem thêm".
   * Khung tạo bài viết (`CreatePostCard`): Đổi placeholder "Bạn đang nghĩ gì thế...?" và dịch các nút "Ảnh / Video", "Cảm xúc", "Check-in", "Bình chọn", "Đăng bài".
   * Landing & Footer: Việt hóa các nhãn tính năng nổi bật của Vizo cùng dòng bản quyền ở footer.
2. **Sửa lỗi độ tương phản (Contrast Fix) trên ProfilePage:**
   * Thay đổi class tiêu đề "Kéo & Thả ảnh đại diện" từ `text-white` sang `text-slate-800` để tránh bị ẩn trên nền sáng.
   * Tái thiết kế vùng kéo thả ảnh (Drag & Drop box) từ theme dark-mode cũ sang phong cách Slate Light đồng nhất (`border-slate-200`, `bg-slate-50/50`, `text-slate-600`), nâng cao trải nghiệm A11y.

### Files chính:
- `frontend/src/App.tsx`
- `frontend/src/modules/post/components/CreatePostCard.tsx`
- `frontend/src/modules/profile/components/ProfilePage.tsx`
- `docs/planning/PROGRESS.md`
- `docs/planning/ROADMAP.md`

---

## 📋 TÓM TẮT PHIÊN LÀM VIỆC (08/06/2026 - SPRINT 5.6)

### Công việc đã thực hiện:

1. **Authentication Form UI Refactoring:** Chuyển đổi LoginForm, RegisterForm, ForgotPasswordForm từ phong cách xám đậm cũ sang theme sáng Slate Light đồng nhất với thiết kế của News Feed.
2. **Accessibility (A11y) Compliance:** Liên kết label và input bằng `htmlFor`/`id` trên toàn bộ các trường, bổ sung đầy đủ `aria-label`, `title`, và `placeholder` cho mảng 6 ô nhập OTP.
3. **Phân tách mã lỗi đăng nhập (Error Code Segregation):** Thêm mã lỗi `INVALID_CREDENTIALS` (1028) trong `ErrorCode.java` và throw đúng mã này trong `AuthService.java` khi đăng nhập sai mật khẩu, giúp hiển thị chuẩn xác thông báo lỗi thay vì "Phiên hết hạn".
4. **Cơ chế ghi nhớ phong cách giao tiếp:** Ghi trực tiếp quy tắc phản hồi 3 phần (Phân tích, Phương án, Hành động) vào file `AI_GUIDELINES.md` để lưu dấu vĩnh viễn cho các phiên làm việc sau.

### Files chính:
- `backend/src/main/java/com/minifacebook/shared/exception/ErrorCode.java`
- `backend/src/main/java/com/minifacebook/module/auth/application/service/AuthService.java`
- `frontend/src/modules/auth/components/{LoginForm.tsx, RegisterForm.tsx, ForgotPasswordForm.tsx}`
- `docs/guidelines/AI_GUIDELINES.md`


### Công việc đã thực hiện (Phase 5 Notification — Sprint 5.1→5.3 + triggers 5.4):

1. **Module Notification (Clean Architecture 4 lớp):** entity + `NotificationType` enum, port `NotificationRepository`, Mongo adapter (Document index `(recipientId, createdAt DESC)`), MapStruct mapper, `NotificationService`, listener, `NotificationController`.

2. **Event-driven decoupling:** `NotificationEvent` (shared) + `ApplicationEventPublisher`. Listener `@Async @TransactionalEventListener(AFTER_COMMIT)` — tạo thông báo sau commit, luồng nền. Self-guard `actorId==recipientId`. Redis cache `notif:unread:<userId>`.

3. **Realtime + UI:** push `/user/queue/notifications` qua `SimpMessagingTemplate`; `NotificationBell` (badge + dropdown + toast + Optimistic UI), badge sidebar đồng bộ.

4. **4 trigger:** LIKE (chỉ thả mới), COMMENT, FRIEND_REQUEST, FRIEND_ACCEPTED.

5. **Fix nợ kiến trúc Phase 4:** tách port `ChatEventPublisher` cho `ChatRedisPublisher` → ArchUnit pass 100%.

6. **Fix bug khi test:** (a) `webSocketService` tự re-subscribe khi reconnect (hết lỗi phải F5 sau restart); (b) MapStruct bỏ sót `isRead` (Lombok boolean+`@Builder`) → `@Mapping` + `@JsonProperty("isRead")` (fix đánh dấu đã đọc không lưu); (c) comment count đồng bộ optimistic CommentSection↔PostCard.

### Files chính:
- `backend/.../module/notification/**` (toàn bộ module mới)
- `backend/.../shared/event/NotificationEvent.java`, `infrastructure/config/AsyncConfig.java`
- `backend/.../module/chat/application/port/ChatEventPublisher.java` (+ publisher implement)
- `backend/.../module/{friendship,post}/application/service/*` (publish events)
- `frontend/src/modules/notification/**`, `frontend/src/App.tsx`, `frontend/src/modules/chat/services/webSocketService.ts`, `frontend/src/modules/post/components/{PostCard,CommentSection}.tsx`

### Known Issues / Chưa làm:
- **Chat unread badge realtime** (Sprint 5.4 cuối): tin nhắn mới → chấm đỏ trên nút Chats sidebar. Chưa wire.
- **Sound notification** (5.3 optional), **Email notification** (5.5) — chưa làm.
- **Feed/comment KHÔNG realtime** (đúng thiết kế): user B phải F5 để thấy comment/like count mới. Dự kiến làm realtime feed (topic `/topic/post.<id>`, chỉ subscribe bài đang mở) ở phiên sau.

### Bước tiếp theo (đã chốt với USER):
- ✅ **Realtime like/comment count cho feed** — ĐÃ XONG.
- ✅ **Chat unread badge realtime** (trigger 5/5 của 5.4) — ĐÃ XONG (chấm đỏ nút Chats sidebar, logic 2 luồng riêng).
- Còn lại Phase 5 (optional, làm khi cần): **sound notification** (5.3), **email notification** (5.5).
- Gợi ý tiếp theo: Phase 6 (Optimization, Testing coverage, CI/CD, Deployment).

---

## 📋 PHIÊN TRƯỚC (06/06/2026 — Phase 4 Chat)

### Công việc đã thực hiện (6 thay đổi):

1. **Chat UI Refactor** (`ChatPage.tsx`): Tái cấu trúc layout sang 2 cột mới với Stories carousel, Filter tabs (All/Unread/Groups/Requests), Search bar tròn, Input bar với icons (Emoji/Image/Mic), Chat header với icons (Search/Phone/Video/More).

2. **MongoDB Fix**: Xóa index sai `participants_unique_idx` (unique trên multikey array field `participantIds` → chặn user có >1 conversation). Đổi sang `participants_idx` (non-unique). Files: `ConversationDocument.java`, `Migration_20260605_AddChatIndexes.java`.

3. **Backend Fix**: Bỏ `@Transactional` khỏi 3 methods trong `ConversationService` (`getOrCreateConversation`, `getConversations`, `markAllAsSeen`) để fix WriteConflict trên single-node replica set khi có concurrent requests.

4. **Frontend Fix**: Di chuyển `onClearInitialRecipient()` vào `finally` block để ngăn infinite loop khi API call fails.

5. **Frontend Fix**: Thêm optional chaining `f.name?.toLowerCase()` trong `filteredFriends` để tránh crash khi friend object thiếu field name.

6. **Global CSS**: Thêm `html { font-size: 14px }` vào `index.css` để compact toàn bộ UI ~12%.

### Files đã sửa:
- `frontend/src/modules/chat/components/ChatPage.tsx`
- `backend/src/main/java/com/minifacebook/module/chat/application/service/ConversationService.java`
- `backend/src/main/java/com/minifacebook/module/chat/infrastructure/persistence/document/ConversationDocument.java`
- `backend/src/main/java/com/minifacebook/infrastructure/persistence/migration/Migration_20260605_AddChatIndexes.java`
- `frontend/src/index.css`

### Known Issues:
- **Duplicate conversation** (extremely rare): Race condition khi 2 user tạo conversation đồng thời. Code-level prevention đã có (DuplicateKeyException catch + retry). Khuyến nghị production: thêm field `participantKey` (sorted concat of IDs) với unique index.

### Bước tiếp theo (Phase 5 - Notification System):
- Notification Entity + Service (LIKE, COMMENT, FRIEND_REQUEST, FRIEND_ACCEPTED, NEW_MESSAGE)
- In-app notifications (bell + badge + dropdown)
- Realtime push qua WebSocket (tái dùng hạ tầng STOMP + Redis Pub/Sub đã có ở Phase 4)

---

## 🛑 MANDATORY PROTOCOLS (BẮT BUỘC TUÂN THỦ)
1. **Docs Over Skills:** Nếu Skill mâu thuẫn với Docs, AI PHẢI dừng lại, báo cáo USER và sửa Skill theo Docs. Tuyệt đối không tự ý làm sai lệch cấu trúc dự án.
2. **Anomaly Reporting:** Bất kỳ dấu hiệu bất thường nào (Lỗi Build, xung đột thư viện, mâu thuẫn logic) đều phải báo cáo ngay cho USER trước khi can thiệp.
3. **Architecture Guard:** Cấm phá vỡ quy tắc Clean Architecture. Phải chạy `mvn test` để kiểm tra `ArchitectureTest.java` sau mỗi thay đổi lớn ở Backend.
4. **UI/UX Guidance:** Tuân thủ `.agents/AGENTS.md`, cấu hình `.kilo/` và [UI_UX_DESIGN.md](../guidelines/UI_UX_DESIGN.md) cho mọi tác vụ giao diện, frontend và CSS.
5. **Session Bootstrap Verification (Bắt buộc Khởi động Phiên):** AI ở lượt trả lời đầu tiên của phiên mới **bắt buộc** phải tuân thủ nghiêm ngặt **Luật 9.6 (AI_GUIDELINES.md)**, chạy lệnh đọc 5 tệp tài liệu cốt lõi (`README.md`, `docs/session/SESSION_HANDOFF.md`, `docs/planning/ROADMAP.md`, `docs/planning/PROGRESS.md`, `docs/guidelines/AI_GUIDELINES.md`) và in ra bảng **Startup Verification Table** tóm tắt mục tiêu phiên để chứng minh đã đọc, trước khi được làm bất kỳ việc gì khác.

---

### ✅ Công việc đã hoàn thành (Sprint 1.1 -> Sprint 4.5)

#### A. Backend (Spring Boot 3.x)
- **Domain Modeling & Persistence:** Thiết kế domain model `User` độc lập framework, triển khai `UserRepositoryImpl` mapping qua `UserDocument` lưu trong MongoDB.
- **High-Security Cookies:** Lưu trữ tokens qua **HttpOnly Cookie** (`accessToken` và `refreshToken`) chống nguy cơ tấn công XSS/CSRF.
- **Refresh Token Rotation & Anti-Replay:** Triển khai xoay vòng refresh token, thu hồi token cũ ngay khi sử dụng lại. Nếu phát hiện Replay Attack, hệ thống xóa sạch toàn bộ active tokens của user.
- **Xác thực Email qua Resend:** Tích hợp Resend Email API gửi link xác thực kích hoạt tài khoản (`/auth/verify?token=...`), bắt buộc kích hoạt trước khi cho phép đăng nhập.
- **Swagger Documentation:** Cập nhật 100% Swagger OpenAPI cho các endpoint xác thực.
- **ArchUnit & Security Auditing:** Sắp xếp phân lớp Clean Architecture đạt chuẩn 100% test case ArchUnit. Vá thành công lỗ hổng bảo mật vô hiệu hóa token trong database (`revoked: true`) khi người dùng logout.
- **Media Upload Bảo mật (Sprint 1.4):** Tích hợp Cloudinary kết hợp bộ quét nhị phân **Apache Tika (Magic Bytes)** ngăn chặn hoàn toàn việc tải lên file độc hại giả dạng đuôi ảnh. Thiết lập xử lý ngoại lệ `MaxUploadSizeExceededException` mượt mà cho file >5MB.
- **Tái cấu trúc Sạch - Shared Core (Sprint 1.4):** Tránh phụ thuộc chéo khi bước sang Phase 2 bằng cách đưa `MediaService` (Domain Interface) và `CloudinaryService` (Adapter) ra phân vùng `shared` dùng chung. Được xác thực hoàn toàn qua ArchUnit với 0 lỗi vi phạm.
- **Chat System (Phase 4 - HOÀN THÀNH 100%):** WebSocket STOMP + SockJS, Redis Presence/Pub/Sub, Conversation & Message CRUD, status SENT→DELIVERED→SEEN. **Sprint 4.4:** Typing Indicator (Redis TTL self-healing), Message Reactions (embedded Map 6 emoji), Reply (denormalized snapshot + jump-to-message), Media (upload Cloudinary/Tika, preview tray, nén). **Sprint 4.5:** Edit/Delete (2 chế độ, 15 phút), Infinite Scroll (DESC pagination + giữ scroll position).

#### B. Frontend (React 19 + Vite + TypeScript)
- **Kiến trúc Modular Phân Lớp:** Tổ chức dự án theo chuẩn với core, components, và modules nghiệp vụ khép kín.
- **Form & Zod Validations:** Thiết kế `LoginForm`, `RegisterForm` và `authSchema` đảm bảo lọc và chuẩn hóa dữ liệu sạch từ Client-side.
- **Silent Refresh & Axios Mutex Lock:** Triển khai Axios Client có Interceptor tự động xoay vòng Access Token ngầm.
- **Chat UI (Phase 4 - HOÀN THÀNH):** Layout 3 cột (conversations + chat + profile panel), Stories carousel, Filter tabs, real-time messaging Optimistic UI, STOMP WebSocket. Typing indicator, reactions picker, reply quote (+jump), media preview tray + progress, edit/delete menu, infinite scroll.

#### C. Kiến trúc & Hạ tầng
- **Modular Monolith** chạy trên 1 VPS duy nhất, MongoDB (chính) + Redis (Presence, JWT Blacklist, Unread Count, Pub/Sub).
- **MongoDB Replica Set (`rs0`)** hỗ trợ transactions.
- **Docker Compose** orchestration hoàn chỉnh.

---

### 🚀 Nhiệm vụ tiếp theo (Phase 6 - Navigation & Phase 7 - VPS Deployment)

- **Phase 6 - Navigation**: Thiết lập và tích hợp `react-router-dom` cho việc điều hướng trang động và deep-linking.
- **Phase 7 - VPS Deployment**: Deploy hệ thống (Spring Boot, MongoDB, Redis, React, Nginx) lên VPS thực tế.
- **Testing & Performance Optimization**: Tối ưu hóa hiệu suất load trang và viết các bài test tích hợp cho WebSocket.

---
*Ghi chú: Luôn giữ file `TESTING_GUIDE.md`, `PHASE_3_FRIENDS_TESTING.md` và `PHASE_4_CHAT_TESTING.md` cập nhật để đảm bảo tính sẵn sàng kiểm thử của hệ thống.*
