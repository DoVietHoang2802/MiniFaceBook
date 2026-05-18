# 🧠 AI DEVELOPMENT GUIDELINES - MINIFACEBOOK (THE ARCHITECT'S HANDBOOK)

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
- **Architecture:** Modular Clean Architecture (Đảm bảo tính độc lập giữa các Module).
- **Persistence:** 
    - **MongoDB:** Lưu trữ dữ liệu chính (Post, Profile, Comment). Port: 27018.
    - **Redis:** Caching, Pub/Sub cho Realtime, Session management.
    - **Neo4j:** Quản lý đồ thị quan hệ bạn bè (Friendship Graph).
- **Security:** OAuth2 Resource Server (JWT) + Refresh Token Rotation + RBAC + Bcrypt.
- **Communication:** Spring WebSocket (STOMP) + Kafka (Event-Driven).
- **Quality Tools:** ArchUnit, Checkstyle (Google), Spotless, Sentry, Bucket4j.
    - *Quy chuẩn ArchUnit Bootstrapping:* Luôn thiết lập `.withOptionalLayers(true)` để tránh lỗi build giả trên các thư mục trống ở các Phase đầu.
    - *Quy chuẩn Global Infrastructure:* Định nghĩa rõ và cho phép `GlobalInfrastructure` (`com.minifacebook.infrastructure..`) gọi xuống `Shared` DTOs để thống nhất API trả về (không vi phạm ranh giới Clean Architecture).

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

---

## 🔄 6. QUY TRÌNH VẬN HÀNH AI (MANDATORY WORKFLOW)
1. **Sync Context:** Đọc `SESSION_HANDOFF.md` trước khi làm bất cứ việc gì.
2. **Execute:** Code -> Checkstyle -> ArchUnit Test.
3. **Analyze:** Nếu gặp lỗi bất thường (Build fail, Dependency conflict), phải báo cáo USER kèm theo ít nhất 02 phương án giải quyết.
4. **Document:** Cập nhật `PROGRESS.md`, `ROADMAP.md` và viết lại `SESSION_HANDOFF.md`.
5. **Skill Update:** Nếu phát hiện một quy trình tốt hơn, phải đề xuất cập nhật vào bộ Skill nội bộ của dự án.

---
## 💡 TRIẾT LÝ LÀM VIỆC
> **"Viết code sao cho 1 năm sau bạn đọc lại vẫn thấy tự hào, chứ không phải thấy xấu hổ."**
> Luôn ưu tiên sự rõ ràng (Clarity) hơn sự ngắn gọn (Brevity).

---
*Kỷ cương là sức mạnh. Mỗi dòng code là một lời cam kết về chất lượng.*
---
## 🔍 7. CƠ CHẾ MINH BẠCH (TRANSPARENCY PROTOCOL)
Để USER hoàn toàn yên tâm về việc AI đã nắm bắt đúng bối cảnh, AI **BẮT BUỘC** phải thực hiện:

1. **Context Receipt:** Mỗi khi bắt đầu phiên chat mới hoặc một Task lớn, AI phải liệt kê danh sách các file `.md` và `Skill` đã đọc kèm theo dấu check `[x]`.
2. **Action Reasoning:** Trước khi thực hiện một thay đổi quan trọng, AI phải giải thích ngắn gọn: "Thay đổi này dựa trên quy chuẩn nào trong Docs/Skill?".
3. **Post-Task Reporting:** Sau khi hoàn thành, AI phải liệt kê danh sách các file tài liệu ĐÃ cập nhật (Progress, Roadmap, Handoff) để USER kiểm soát.

**Mục tiêu:** Loại bỏ hoàn toàn việc USER phải nhắc nhở AI về vấn đề cập nhật tài liệu và bối cảnh.
---
## 🌿 8. QUY CHUẨN GIT & COMMIT (CONVENTIONAL COMMITS)
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

## 🛑 9. NGUYÊN TẮC KHÔNG TỰ Ý CAN THIỆP MÃ NGUỒN (CODE MUTATION BOUNDARY)
Để tránh tình trạng AI "nóng vội", tự ý can thiệp mã nguồn ngoài tầm kiểm soát của USER, dự án thiết lập kỷ luật tối cao sau:

### 9.1. Định nghĩa ranh giới (Boundary Definition)
- **Câu hỏi thảo luận/tư vấn:** Khi USER chỉ hỏi giải thích lý thuyết, hỏi nguyên nhân lỗi hoặc hỏi cách dùng (ví dụ: *"làm thế nào..."*, *"tại sao..."*), AI **TUYỆT ĐỐI KHÔNG** được tự ý chỉnh sửa, tạo mới hoặc xóa bất kỳ file code nào (`.java`, `.yml`, `.xml`...) trong project.
- **Yêu cầu thực thi (Execution Command):** AI chỉ được phép chỉnh sửa mã nguồn khi có hiệu lệnh rõ ràng của USER (ví dụ: *"Hãy tạo file..."*, *"Sửa code cho tôi..."*, *"Hãy tiến hành triển khai..."*) hoặc sau khi đã đề xuất giải pháp bằng văn bản và được USER xác nhận đồng ý (ví dụ: *"Đồng ý, hãy làm đi"*).

### 9.2. Kỷ luật hành vi (Behavioral Discipline)
- Không có ngoại lệ cho sự năng nổ. Sự kỷ luật trong phối hợp và tôn trọng quyền kiểm soát của USER là ưu tiên hàng đầu, cao hơn việc tự ý "sửa lỗi nhanh".
- Mọi trường hợp tự ý code khi chưa được ra lệnh đều bị coi là **Vi phạm Hiến Pháp nghiêm trọng**.

---
**Mọi hành động đẩy code là một dấu ấn lịch sử của dự án. Hãy làm nó chuyên nghiệp.**

