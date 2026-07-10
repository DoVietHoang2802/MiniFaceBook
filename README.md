# 🚀 MiniFaceBook - Professional Backend Foundation

> [!CAUTION]
> ### 🛑 BẮT BUỘC ĐỐI VỚI AI (MANDATORY STARTUP PROTOCOL)
> Trước khi thực hiện bất kỳ hành động nào trong phiên chat mới, AI PHẢI đọc file **[docs/session/SESSION_HANDOFF.md](docs/session/SESSION_HANDOFF.md)** để đồng bộ bối cảnh và các quyết định chiến lược. Không được bỏ qua bước này!

---

## 🧠 Triết lý phát triển (Core Philosophy)
- **Quality Over Quantity:** Hoàn thiện Core (Auth, 1-1 Chat) đạt điểm 10 trước khi mở rộng.
- **Single Source of Truth:** Tài liệu được phân lớp rõ ràng, tránh dư thừa và sai lệch thông tin.
- **Security First:** Triển khai các cơ chế bảo mật hiện đại nhất (Refresh Token Rotation, HttpOnly Cookies, Throttler).

## 🏗 Kiến trúc dự án (Architecture & Repository)
**Dự án của chúng ta được quản lý theo dạng Monorepo. Trong đó, Backend được xây dựng theo mô hình Modular Monolith, và bên trong mỗi Module đều tuân thủ chặt chẽ nguyên tắc phân lớp của Clean Architecture.**

---

## 🛠 Tech Stack (Production Ready)
- **Backend:** Java 21 (LTS) + Spring Boot 3.x - Modular Clean Architecture.
- **Realtime:** Spring WebSocket (STOMP) + Redis Pub/Sub.
- **Database:** MongoDB (Atlas) làm DB chính + Redis (Caching & JWT Blacklist).
- **Task & Search:** Xử lý nền bằng Spring `@Async` và tìm kiếm bằng MongoDB Text Index/Regex.

---

## 🏃‍♂️ Khởi chạy nhanh (Quick Start)
1. **Hạ tầng:** `docker-compose up -d`
2. **Backend:** Truy cập `backend/` và chạy `mvn spring-boot:run`
3. **Tài liệu API:** Truy cập [http://localhost:8080/api/docs](http://localhost:8080/api/docs)

Chi tiết cách kiểm tra các tính năng bảo mật và kiến trúc, vui lòng xem tại: **[docs/testing/TESTING_GUIDE.md](docs/testing/TESTING_GUIDE.md)**

---
- **Security:** Spring Security (Stateless JWT) + Refresh Token Rotation + **RBAC (Role-Based Access Control)**.
- **Core Tools:** Lombok, MapStruct, ArchUnit, Bucket4j.
- **Services:** Cloudinary (Media), Resend (Email), Google Gemini (AI), **Sentry (Error Tracking)**.
- **Frontend:** React + TypeScript + shadcn/ui + Tailwind v4 + Zod + TanStack Query.
- **DevOps:** Docker Compose, GitHub Actions.
- **Testing:** JUnit 5, Mockito, MockMvc, Testcontainers, Playwright, **K6 (Load Testing)**.

---

## 🗺️ Project Roadmap (Tóm tắt)
Dự án được chia làm **7 giai đoạn** phát triển chính. 
> 📑 Xem chi tiết tại: **[docs/planning/ROADMAP.md](docs/planning/ROADMAP.md)**

| Phase | Tên | Trạng thái |
|:-----:|-----|:----------:|
| 0 | Foundation & Infrastructure | ✅ Hoàn thành |
| 1 | Authentication & Identity | ✅ Hoàn thành |
| 2 | Content & News Feed | ✅ Hoàn thành |
| 3 | Social Graph & Friends | ✅ Hoàn thành |
| 4 | Realtime Chat | ✅ Hoàn thành (Sprint 4.1→4.5) |
| 5 | Notification System | ✅ Hoàn thành (Sprint 5.1→5.4 + Forgot Password OTP) |
| 6 | Advanced & Deployment | 🚧 Đang làm (Sprint 6.1→6.4 hoàn thành, đang Sprint 6.5) |
| 7 | Extended Features | ⏳ Chưa bắt đầu |

**Tiến độ: ~98% — Phase 5 Notification hoàn thành 100%, Phase 6 đang thực hiện Sprint 6.5 (Monitoring & Observability).**

---

## 📂 Tài liệu hướng dẫn (Documentation)
Để hiểu sâu hơn về dự án, vui lòng đọc các tài liệu sau:
- **[STRUCTURE.md](docs/architecture/STRUCTURE.md):** Cách vận hành Docs & Skills.
- **[SYSTEM_DESIGN.md](docs/architecture/SYSTEM_DESIGN.md):** Bản thiết kế DB và Kiến trúc hệ thống.
- **[PROGRESS.md](docs/planning/PROGRESS.md):** Nhật ký tiến độ và các quyết định kỹ thuật.
- **[AI_GUIDELINES.md](docs/guidelines/AI_GUIDELINES.md):** Quy tắc làm việc dành cho AI.
- **[AI_REPORT_COMMANDS.md](docs/guidelines/AI_REPORT_COMMANDS.md):** Format báo cáo tiến độ chuẩn cho AI.
- **[DOCUMENTATION_STANDARDS.md](docs/guidelines/DOCUMENTATION_STANDARDS.md):** Đề án chuẩn hóa thư mục tài liệu mới.

---

## 🚀 Quick Start (Dành cho Developer)
1. **Khởi chạy Hạ tầng (Docker Compose):**
   ```bash
   docker-compose up -d
   ```
   *Mailpit Web UI sẽ chạy tại `http://localhost:8025` để xem và click email xác nhận.*
2. **Khởi chạy Backend (Spring Boot):**
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```
   *Swagger API UI sẽ chạy tại `http://localhost:8080/api/docs`*
3. **Khởi chạy Frontend (React + Vite):**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   *Ứng dụng Web sẽ chạy tại `http://localhost:5173`*

---

## 🤖 Guide for AI Assistant (BẮT BUỘC)
Trước khi thực hiện bất kỳ Task nào, AI phải đọc tài liệu theo thứ tự:
1. `README.md` -> 2. `docs/architecture/STRUCTURE.md` -> 3. `docs/planning/ROADMAP.md` -> 4. `docs/planning/PROGRESS.md`.
- Tuân thủ nghiêm ngặt các Skill trong thư mục `.antigravity/skills/`.
- Luôn sử dụng Swagger Annotations (springdoc-openapi) cho mọi Controller.
- Business logic nằm hoàn toàn trong Service.
- **Git Automation:** Khi người dùng yêu cầu "đẩy lên git", hãy tự động stage (`git add .`), commit với message mô tả đúng các thay đổi, và push lên remote ngay lập tức.