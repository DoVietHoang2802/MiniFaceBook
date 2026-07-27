# 📜 MINIFACEBOOK — AI AGENT GOVERNANCE & CODING RULES (.agents/AGENTS.md)

> [!IMPORTANT]
> **DÀNH CHO TẤT CẢ AI AGENT / ASSISTANTS KHI THAM GIA DỰ ÁN MINIFACEBOOK**
> Tệp này quy định các chuẩn mực cao nhất về Kiến trúc, Quy trình Code, Quản trị Tài liệu và Verification. AI BẮT BUỘC tuân thủ 100% trong mọi phiên làm việc.

---

## 🏛️ 1. TỔNG QUAN KIẾN TRÚC & NGUYÊN TẮC CỐT LÕI
- **Architecture Model:** Modular Monolith Clean Architecture (Java 21 + Spring Boot 3.x Backend) & React + TypeScript (Vite + TailwindCSS Frontend).
- **Core Principle:** "Quality Over Quantity" — Code sạch, bảo mật, không nuốt exception, không giả lập mock ảo khi đã có backend thật.
- **Single Source of Truth:** Hệ thống tài liệu được quản lý phân lớp tại `/docs`. Bắt buộc đọc `SESSION_HANDOFF.md` ở đầu phiên làm việc.

---

## 💻 2. QUY CHUẨN LẬP TRÌNH (CODING STANDARDS)

### A. Backend (Spring Boot 3 + Java 21)
1. **Phân lớp nghiêm ngặt:**
   - `domain/`: Lưu Entity, Domain Value Objects, Repository Interfaces. Không phụ thuộc vào Spring/Framework.
   - `application/`: Service Use Cases, DTOs (`Request`/`Response`), Mappers (MapStruct).
   - `infrastructure/`: Persistence (MongoDB Documents, MongoRepositories), External Integrations (Redis, Sentry, Cloudinary, Resend).
   - `presentation/`: REST Controllers, Spring Security Configuration, Request Validators.
2. **Xử lý Ngoại lệ (Exception Handling):**
   - Luôn ném `AppException` kết hợp `ErrorCode` dạng Enum.
   - Không catch rỗng hoặc nuốt exception (`try { ... } catch (Exception e) {}`).
   - Mọi lỗi phải được xử lý tập trung tại Global Exception Handler (`@RestControllerAdvice`).
3. **Caching & Realtime:**
   - Khi evict cache Redis (user profile), phải xóa đồng thời cả 2 key: ID (`user:profile:id:<id>`) và Email (`user:profile:email:<email>`).
   - Mọi thay đổi bài viết/bình luận/reaction phải phát sóng realtime qua SSE (`/api/events/...`) hoặc WebSocket STOMP (`/topic/...`).

### B. Frontend (React + TypeScript + Vite)
1. **Type Safety:** 100% components và API responses phải được định kiểu TypeScript đầy đủ (`interface`/`type`), hạn chế dùng `any` bừa bãi.
2. **UI & Styling:** Dùng TailwindCSS + Lucide Icons. Tuân thủ thiết kế hiện đại (glassmorphism, micro-animations, color palette chuẩn HSL).
3. **State & Realtime Management:** Sử dụng TanStack Query (React Query) cho server state và custom SSE/WebSocket hooks cho realtime sync.

---

## 📝 3. QUY TRÌNH ĐỒNG BỘ TÀI LIỆU (DOCUMENTATION PROTOCOL - UPDATE FULL)

Mỗi khi hoàn thành bất kỳ tính năng mới hoặc chỉnh sửa lớn nào, AI **BẮT BUỘC** cập nhật đồng bộ các tài liệu sau:

1. **`docs/architecture/DATABASE_SCHEMA.md`**: Cập nhật nếu có thêm collection, table hoặc thêm/sửa field trong MongoDB / Redis.
2. **`docs/planning/ROADMAP.md`**: Đánh dấu `[x]` hoàn thành sprint/hạng mục tương ứng và cập nhật tiến độ %.
3. **`docs/planning/PROGRESS.md`**: Ghi lại nhật ký chi tiết các kỹ thuật, bài toán và giải pháp của phiên làm việc.
4. **`docs/session/SESSION_HANDOFF.md`**: Cập nhật trạng thái mới nhất lên đầu file để giao tiếp với AI phiên sau.
5. **`docs/guidelines/CV_PORTFOLIO_HIGHLIGHTS.md`**: Viết Highlight mới theo chuẩn STAR (Situation, Task, Action, Result + Bullet point tiếng Anh cho CV).
6. **`README.md`**: Cập nhật bảng tổng quan lộ trình và tiến độ % tổng thể của dự án.

---

## 🧪 4. QUY ĐỊNH XÁC MINH & KIỂM THỬ (VERIFICATION & SAFETY RULES)

1. **Build Checklist:**
   - Trước khi tuyên bố hoàn thành task, AI BẮT BUỘC chạy `npm run build` ở `frontend/` để kiểm tra lỗi biên dịch TypeScript & Vite bundling.
   - Chạy `mvn test` hoặc kiểm tra ứng dụng Backend không bị lỗi crash khi khởi động.
2. **Clean Repository:**
   - Kiểm tra `git status` trước khi bàn giao để phát hiện file rác, file tạm hoặc code debug chưa xóa.
   - Không commit credential hoặc secret key cứng vào repository (dùng `application-local.yml` hoặc `.env`).
