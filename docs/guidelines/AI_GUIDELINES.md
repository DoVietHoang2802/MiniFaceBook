# 🧠 AI DEVELOPMENT GUIDELINES - MINIFACEBOOK (THE ARCHITECT'S HANDBOOK)
> **Last Updated:** May 2026 | **Version:** 2.0

> [!IMPORTANT]
> Tài liệu này là "Kim chỉ nam" duy nhất và tối cao. Mọi hành động lập trình, thiết kế hệ thống và giao tiếp của AI đều phải soi chiếu qua bộ quy tắc này. Kỷ cương là nền tảng của sự ổn định.

---

## ⚖️ 1. THỨ TỰ ƯU TIÊN (PRIORITY HIERARCHY)
Khi có sự mâu thuẫn hoặc mơ hồ về thông tin, AI phải tuân thủ tuyệt đối thứ tự sau:
1.  **Project Docs:** (Roadmap, System Design, Session Handoff, Progress).
2.  **User Instructions:** (Yêu cầu trực tiếp và bối cảnh hiện tại của USER).
3.  **Internal Skills:** (Bộ kỹ năng trong thư mục `.antigravity/skills`).

**⚠️ QUY TẮC VÀNG:** Nếu một Skill mâu thuẫn với Docs của dự án, AI **KHÔNG ĐƯỢC TỰ Ý LÀM THEO SKILL**. Phải dừng lại, báo cáo ngay mâu thuẫn cho USER và tiến hành cập nhật lại Skill sau khi thống nhất.

---

## 🏗️ 2. TECH STACK & ECOSYSTEM (PRODUCTION READY)
- **Core:** Java 21 (Virtual Threads ready) + Spring Boot 3.3.
- **Architecture:** Modular Monolith trên 1 VPS (Modular Clean Architecture — đảm bảo tính độc lập giữa các Module).
- **Persistence:** 
    - **MongoDB:** Lưu trữ dữ liệu chính (Post, Profile, Comment, Friendship). Port: 27018.
    - **Redis:** Cache (`user:profile`, `feed:user`), JWT Blacklist (logout), Rate Limiting. **Không** sử dụng Pub/Sub.
- **Security:** OAuth2 Resource Server (JWT) + Refresh Token Rotation + RBAC + Bcrypt.
- **Communication:** Spring WebSocket (STOMP) cho Realtime Chat.
- **Async Tasks:** Spring `@Async` + `@EnableAsync` cho tác vụ nền (gửi mail, xử lý ảnh).
- **Quality Tools:** ArchUnit, Checkstyle (Google), Spotless, Sentry, Bucket4j.
    - *Quy chuẩn ArchUnit Bootstrapping:* Luôn thiết lập `.withOptionalLayers(true)` để tránh lỗi build giả trên các thư mục trống ở các Phase đầu.
    - *Quy chuẩn Global Infrastructure:* Định nghĩa rõ và cho phép `GlobalInfrastructure` (`com.minifacebook.infrastructure..`) gọi xuống `Shared` DTOs để thống nhất API trả về (không vi phạm ranh giới Clean Architecture).
- **Load Testing:** K6 — bắt buộc chạy trước mỗi lần deploy lên Production.

---

## 💎 3. QUY CHUẨN VIẾT CODE (SENIOR CODING STANDARDS)

### 3.1. Phân lớp kiến trúc (Layering)
- **Domain:** Chứa Logic nghiệp vụ cốt lõi. Không được chứa code của Framework (No @Service, No @Repository).
- **Application:** Chứa các Use Case. Điều phối dữ liệu từ Domain.
- **Infrastructure:** Hiện thực hóa các Interface từ Domain (Database, External API).
- **Presentation:** Chỉ xử lý HTTP Request/Response. Tuyệt đối không chứa logic nghiệp vụ.

### 3.2. Mapping & DTO
- Sử dụng **MapStruct** 100%. Không viết hàm mapping thủ công.
- **Luật bất biến:** Một Entity không bao giờ được "lộ diện" ra tầng Presentation. Mọi dữ liệu ra ngoài phải qua DTO.

### 3.3. Dependency Injection
- Luôn sử dụng **Constructor Injection**. 
- Sử dụng `@RequiredArgsConstructor` của Lombok để giữ code sạch sẽ.

---

## 🌐 4. QUY CHUẨN API & GIAO TIẾP (RESTFUL STANDARDS)
- **Naming:** Sử dụng số nhiều cho Resource (e.g., `/users`, `/posts`). Dùng `kebab-case` cho URL.
- **Response Structure:** Luôn bọc trong `ApiResponse<T>`.
- **HTTP Status:** 
    - `200 OK`: Thành công.
    - `201 Created`: Tạo mới thành công.
    - `400 Bad Request`: Lỗi dữ liệu đầu vào.
    - `401 Unauthorized`: Chưa đăng nhập/Token hết hạn.
    - `403 Forbidden`: Không có quyền truy cập.
    - `429 Too Many Requests`: Vi phạm Rate Limit.

---

## 🛡️ 5. BẢO MẬT & HIỆU NĂNG (SECURITY & PERFORMANCE)
- **Fail-fast:** Validate cấu hình ngay khi startup qua `@ConfigurationProperties`. Thiếu biến môi trường => Shutdown ngay.
- **Zero Trust:** Luôn validate dữ liệu đầu vào tại Controller. Password phải được băm ngay tại lớp Application trước khi xuống DB.
- **Database:** Mọi query MongoDB phải có Index phù hợp. Sử dụng **Mongock** để quản lý versioning của Database Schema.
- **File Upload Limits & Guard:** 
  - Cấu hình server Tomcat giới hạn tải lên tối đa là **5MB** cho mỗi file và **25MB** tổng request (qua `spring.servlet.multipart` trong `application.yml`) để tránh lỗi ngắt kết nối Tomcat `ERR_CONNECTION_RESET`.
  - Luôn đi kèm bộ lọc kích thước file phía máy khách (Client-side Size Guard) ở Frontend để cảnh báo sớm cho người dùng và chặn đứng file >5MB trước khi truyền mạng.

---

## 🧪 5B. QUY CHUẨN TÀI LIỆU KIỂM THỬ THEO PHASE (PER-PHASE TESTING DOCS)
Để đảm bảo mỗi giai đoạn đều có hướng dẫn kiểm thử rõ ràng, dễ tra cứu, AI **BẮT BUỘC** tuân thủ:

1. **Mỗi Phase có MỘT file test riêng** đặt trong `docs/testing/` theo mẫu tên: `PHASE_<N>_<TÊN>_TESTING.md` (ví dụ: `PHASE_3_FRIENDS_TESTING.md`).
2. **TUYỆT ĐỐI KHÔNG được xóa** các file test của Phase đã hoàn thành. Đây là tài sản kiểm thử vĩnh viễn của dự án, dùng để hồi quy (regression) và bàn giao.
3. **Mỗi khi hoàn thành một Sprint**, phải cập nhật (append/bổ sung) hướng dẫn test các API mới vào đúng file test của Phase đó — chi tiết từng bước, kèm JSON mẫu copy-paste được và bảng mã lỗi mong đợi.
4. **File `TESTING_GUIDE.md`** đóng vai trò mục lục (index) trỏ tới các file test của từng Phase. Không nhồi nhét chi tiết test của Phase vào file index này.
5. Phong cách viết: rõ ràng cho cả người không chuyên, đánh dấu chỗ cần COPY giá trị, giải thích cơ chế auth (HttpOnly Cookie) khi cần.

---

## 📊 6. QUY CHUẨN BÁO CÁO TIẾN ĐỘ (PROGRESS REPORT STANDARDS)
Khi USER hỏi về tiến độ dự án, tech stack hoặc thành tựu, AI **BẮT BUỘC** phải:
1. Đọc file `docs/guidelines/AI_REPORT_COMMANDS.md` để nắm format chuẩn.
2. Áp dụng đúng format bảng markdown chuyên nghiệp.
3. Đóng vai Senior System Analyst với 10+ năm kinh nghiệm.

**Trigger keywords:**
- Tiến độ: "làm tới đâu rồi", "tiến độ", "progress report", "hoàn thành bao nhiêu"
- Tech stack: "công nghệ gì", "tech stack", "dùng những gì"
- Highlights: "thành tựu", "CV portfolio", "highlights", "đưa vào CV"

👉 Chi tiết format xem tại: **[AI_REPORT_COMMANDS.md](./AI_REPORT_COMMANDS.md)**

---

## 🔄 7. QUY TRÌNH VẬN HÀNH AI (MANDATORY WORKFLOW)
1. **Sync Context:** Đọc `SESSION_HANDOFF.md` trước khi làm bất cứ việc gì.
2. **Execute:** Code -> Checkstyle -> ArchUnit Test.
3. **Analyze:** Nếu gặp lỗi bất thường (Build fail, Dependency conflict), phải báo cáo USER kèm theo ít nhất 02 phương án giải quyết.
4. **Document:** Cập nhật `PROGRESS.md`, `ROADMAP.md` và viết lại `SESSION_HANDOFF.md`.
5. **Skill Update:** Nếu phát hiện một quy trình tốt hơn, phải đề xuất cập nhật vào bộ Skill nội bộ của dự án.
6. **CV Auto-Ledger:** Mỗi khi hoàn thành một Sprint hoặc giải quyết thành công một lỗi kỹ thuật phức tạp (Security, Architecture, Performance), AI bắt buộc phải tự động tổng hợp bài toán vừa giải quyết theo cấu trúc STAR và ghi đè thêm 1 Highlight mới vào file `docs/guidelines/CV_PORTFOLIO_HIGHLIGHTS.md` trước khi báo cáo kết thúc phiên.

---
---

## 💡 8. TRIẾT LÝ LÀM VIỆC
> **"Viết code sao cho 1 năm sau bạn đọc lại vẫn thấy tự hào, chứ không phải thấy xấu hổ."**
> Luôn ưu tiên sự rõ ràng (Clarity) hơn sự ngắn gọn (Brevity).

---
*Kỷ cương là sức mạnh. Mỗi dòng code là một lời cam kết về chất lượng.*
---
## 🔍 9. CƠ CHẾ MINH BẠCH (TRANSPARENCY PROTOCOL)
Để USER hoàn toàn yên tâm về việc AI đã nắm bắt đúng bối cảnh, AI **BẮT BUỘC** phải thực hiện:

1. **Context Receipt:** Mỗi khi bắt đầu phiên chat mới hoặc một Task lớn, AI phải liệt kê danh sách các file `.md` và `Skill` đã đọc kèm theo dấu check `[x]`.
2. **Action Reasoning:** Trước khi thực hiện một thay đổi quan trọng, AI phải giải thích ngắn gọn: "Thay đổi này dựa trên quy chuẩn nào trong Docs/Skill?".
3. **Post-Task Reporting:** Sau khi hoàn thành, AI phải liệt kê danh sách các file tài liệu ĐÃ cập nhật (Progress, Roadmap, Handoff) để USER kiểm soát.

**Mục tiêu:** Loại bỏ hoàn toàn việc USER phải nhắc nhở AI về vấn đề cập nhật tài liệu và bối cảnh.
---
## 🌿 10. QUY CHUẨN GIT & COMMIT (CONVENTIONAL COMMITS)
Khi thực hiện các thao tác Git, AI phải tuân thủ quy trình tự động hóa và định dạng sau:

### 8.1. Quy trình thực thi (Automated Workflow)
1. **Status Check:** Luôn kiểm tra `git status` để rà soát các tệp tin thay đổi.
2. **Auto Stage:** Tự động `git add .` (hoặc các file cụ thể nếu có yêu cầu riêng).
3. **Smart Commit:** Tự động phân tích các thay đổi để viết Message mà không cần USER phải gợi ý.

### 8.2. Định dạng Commit Message (Mandatory Format)
Sử dụng chuẩn **Conventional Commits**: `<type>: <description>`
- `feat`: Thêm tính năng mới.
- `fix`: Sửa lỗi.
- `docs`: Cập nhật tài liệu (Roadmap, Progress, Guidelines...).
- `style`: Thay đổi định dạng code (không ảnh hưởng logic).
- `refactor`: Tái cấu trúc mã nguồn.
- `chore`: Các thay đổi nhỏ về build, tool, dependency.

### 8.3. Kỷ luật Push
- **Tuyệt đối:** Không được để xảy ra tình trạng đẩy code kèm theo các file rác hoặc file cấu hình cá nhân.
- **Xử lý xung đột:** Nếu gặp Conflict, AI phải dừng lại, báo cáo nguyên nhân và đề xuất phương án Merge cho USER.

---

## 🛑 11. NGUYÊN TẮC KHÔNG TỰ Ý CAN THIỆP MÃ NGUỒN (CODE MUTATION BOUNDARY)
Để tránh tình trạng AI "nóng vội", tự ý can thiệp mã nguồn ngoài tầm kiểm soát của USER, dự án thiết lập kỷ luật tối cao sau:

### 9.1. Định nghĩa ranh giới (Boundary Definition)
- **Câu hỏi thảo luận/tư vấn:** Khi USER chỉ hỏi giải thích lý thuyết, hỏi nguyên nhân lỗi hoặc hỏi cách dùng (ví dụ: *"làm thế nào..."*, *"tại sao..."*), AI **TUYỆT ĐỐI KHÔNG** được tự ý chỉnh sửa, tạo mới hoặc xóa bất kỳ file code nào (`.java`, `.yml`, `.xml`...) trong project.
- **Yêu cầu thực thi (Execution Command):** AI chỉ được phép chỉnh sửa mã nguồn khi có hiệu lệnh rõ ràng của USER (ví dụ: *"Hãy tạo file..."*, *"Sửa code cho tôi..."*, *"Hãy tiến hành triển khai..."*) hoặc sau khi đã đề xuất giải pháp bằng văn bản và được USER xác nhận đồng ý (ví dụ: *"Đồng ý, hãy làm đi"*).

### 9.2. Kỷ luật hành vi (Behavioral Discipline)
- Không có ngoại lệ cho sự năng nổ. Sự kỷ luật trong phối hợp và tôn trọng quyền kiểm soát của USER là ưu tiên hàng đầu, cao hơn việc tự ý "sửa lỗi nhanh".
- Mọi trường hợp tự ý code khi chưa được ra lệnh đều bị coi là **Vi phạm Hiến Pháp nghiêm trọng**.

### 9.2.B. Phân biệt Cải tiến Giao diện vs Chức năng (UI vs Feature Boundary) ⭐
Khi USER nhờ "cải tiến / chỉnh / thêm" một thứ gì đó, AI **BẮT BUỘC** phân loại trước khi làm:

- **Cải tiến THUẦN GIAO DIỆN** (màu sắc, bố cục, khoảng cách, animation, đổi text, sắp xếp lại layout, responsive...): → Được phép làm ngay, không cần hỏi.

- **Cải tiến ĐỤNG TỚI CHỨC NĂNG** (cần API mới, logic nghiệp vụ mới, field DB mới, entity mới, hoặc dữ liệu chưa tồn tại trong hệ thống): → **TUYỆT ĐỐI KHÔNG tự ý làm luôn.** Phải DỪNG lại và báo USER theo đúng 4 bước:
  1. **Báo rõ:** "Phần [X] này hiện hệ thống CHƯA có về mặt chức năng."
  2. **Giải thích VÌ SAO chưa có:** do chưa tới phase đó / chưa nằm trong sprint hiện tại / ngoài scope đã thống nhất / chưa được thiết kế...
  3. **Đưa lựa chọn để USER quyết:** (a) Gắn/làm luôn vào đây; (b) Làm theo cách khác (vd: hiển thị placeholder/giá trị tạm); (c) Để dành làm sau ở phase phù hợp.
  4. **CHỜ USER chọn** rồi mới thực hiện. Không được "vừa giao vừa làm" mà không giải thích.

- **Mục đích:** Tránh tình trạng AI tự mở rộng scope, tự thêm chức năng ngoài ý muốn khiến USER mất kiểm soát lộ trình. USER luôn là người quyết định một chức năng được làm hay hoãn.

### 9.3. Kỷ luật cập nhật tài liệu & Lộ trình (Documentation & Roadmap Discipline)
- **Kiểm tra kỹ lưỡng trước khi cập nhật:** Trước khi chỉnh sửa bất kỳ tệp tài liệu nào (đặc biệt là `ROADMAP.md` và `PROGRESS.md`), AI phải rà soát và kiểm tra kỹ lưỡng trạng thái và lộ trình thực tế hiện có của dự án để tránh ghi đè, làm mất hoặc xáo trộn các phần việc/sprint đã được thống nhất hoặc thiết lập sẵn.
- **Báo cáo và xin phê duyệt trước khi thay đổi:** Nếu có bất kỳ lý do kỹ thuật hoặc bối cảnh thực tiễn nào cần phải tái cấu trúc hoặc thay đổi lộ trình phát triển của dự án, AI **TUYỆT ĐỐI KHÔNG** được tự ý thay đổi hay cập nhật. Phải báo cáo ngay lập tức cho chủ sở hữu (USER), giải thích rõ nguyên nhân, phương án đề xuất và chỉ được tiến hành cập nhật sau khi nhận được sự phê duyệt đồng ý rõ ràng từ USER.

### 9.4. Báo cáo đánh giá tác động (Impact Analysis Protocol)
- **Luật:** Khi muốn thực hiện các thay đổi chạm vào phần lõi (Core/Infrastructure) của hệ thống như Security Filters, Spring Security Configurations, Database Connectors, Domain Models, AI **bắt buộc** phải mô tả một bảng **Impact Matrix** (Thành phần thay đổi, phạm vi ảnh hưởng, rủi ro) trước khi viết code để USER đánh giá và phê duyệt.

### 9.5. Kiểm chứng Git trước khi bàn giao (Git-Aware Verification)
- **Luật:** Trước khi viết báo cáo bàn giao phiên (`SESSION_HANDOFF.md`), AI bắt buộc phải chạy `git status` hoặc `git diff --stat` để tự rà soát, dọn dẹp các tệp tin rác hoặc dòng code debug dư thừa, đảm bảo repository bàn giao cực kỳ sạch sẽ và chuyên nghiệp.

### 9.6. Giao thức Khởi động Phiên (Session Bootstrap Protocol)
- **Luật:** Trong lượt phản hồi đầu tiên của mỗi phiên làm việc mới, AI **bắt buộc** phải đọc và chạy lệnh rà soát toàn bộ các tệp tin tài liệu sau: `README.md`, `docs/session/SESSION_HANDOFF.md`, `docs/planning/ROADMAP.md`, `docs/planning/PROGRESS.md`, `docs/guidelines/AI_GUIDELINES.md` bằng công cụ đọc file. AI phải chứng minh việc này bằng cách xuất bản một bảng **Startup Verification Table** hiển thị trạng thái đã đọc và 1 dòng tóm tắt mục tiêu chính của phiên đó trước khi thực hiện bất kỳ hành động code nào.

### 9.7. Lệnh Tự Động Hóa "Update Full" (The "Update Full" Protocol)
- **Luật:** Bất cứ khi nào USER ra lệnh `"Update Full"`, AI **BẮT BUỘC** phải tự động rà soát, đồng bộ và cập nhật ngay lập tức tất cả các tệp tài liệu kiến trúc của dự án mà không cần USER phải chỉ đích danh từng file.
- **Danh sách file bắt buộc phải quét và cập nhật khi có lệnh Update Full:**
  1. `docs/architecture/DATABASE_SCHEMA.md` (Cấu trúc bảng/DB)
  2. `docs/architecture/BACKEND_ARCHITECTURE.md` (Quy chuẩn code)
  3. `docs/planning/PROGRESS.md` (Nhật ký phiên bản)
  4. `docs/planning/ROADMAP.md` (Lộ trình phát triển)
  5. `docs/session/SESSION_HANDOFF.md` (Báo cáo bàn giao)
  6. `docs/guidelines/CV_PORTFOLIO_HIGHLIGHTS.md` (Thành tựu STAR)
  7. `docs/guidelines/UI_UX_DESIGN.md` (Quy chuẩn giao diện)
- Sau khi rà soát và cập nhật xong, AI bắt buộc phải tự động gom nhóm bằng `git add docs/`, tiến hành `git commit` và đẩy code lên kho lưu trữ.

---
**Mọi hành động đẩy code là một dấu ấn lịch sử của dự án. Hãy làm nó chuyên nghiệp.**

