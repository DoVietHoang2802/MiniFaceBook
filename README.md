# MiniFaceBook

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

## Current Status
- Public frontend: `https://www.miniface.site`
- Public API health: `https://api.miniface.site/api/actuator/health`
- Production topology: Vercel (React SPA) + AWS EC2 Docker (Spring Boot, Redis) + MongoDB Atlas + Cloudinary + Resend.
- GitHub Actions is **CI only**. Backend releases to AWS remain an explicit, manual, SHA-reviewed operation.
- See [Production Readiness](docs/planning/PRODUCTION_READINESS_CHECKLIST.md) for verified capabilities, release gates, and known risks.

## 🛠 Tech Stack
- **Backend:** Java 21 (LTS) + Spring Boot 3.x - Modular Clean Architecture.
- **Realtime:** Spring WebSocket (STOMP) + Redis Pub/Sub.
- **Database:** MongoDB (Atlas) làm DB chính + Redis (Caching & JWT Blacklist).
- **Task & Search:** Xử lý nền bằng Spring `@Async` và tìm kiếm bằng MongoDB Text Index/Regex.

---

## 🏃‍♂️ Khởi chạy nhanh (Quick Start)
1. **Hạ tầng:** `docker-compose up -d`
2. **Backend local:** Truy cập `backend/` và chạy `mvn "-Dspring-boot.run.profiles=local" spring-boot:run`
3. **Tài liệu API:** Truy cập [http://localhost:8080/api/docs](http://localhost:8080/api/docs)

Chi tiết cách kiểm tra các tính năng bảo mật và kiến trúc, vui lòng xem tại: **[docs/testing/TESTING_GUIDE.md](docs/testing/TESTING_GUIDE.md)**

---
- **Security:** Spring Security (Stateless JWT) + Refresh Token Rotation + **RBAC (Role-Based Access Control)**.
- **Core Tools:** Lombok, MapStruct, ArchUnit, Bucket4j.
- **Services:** Cloudinary (Media), Resend (Email), Google Gemini (AI), **Sentry (Error Tracking)**.
- **Frontend:** React + TypeScript + shadcn/ui + Tailwind v4 + Zod + TanStack Query, responsive mobile shell với safe-area và touch-first UX.
- **DevOps:** Docker Compose, Vercel, AWS EC2, GitHub Actions CI.
- **Testing:** JUnit 5, Mockito, MockMvc, Testcontainers, Playwright, **K6 (Load Testing)**.

---

## 🗺️ Project Roadmap
Dự án được chia làm **9 phase (0-8)**. Phase 0-6 hoàn thành core; Phase 7 đã triển khai hạ tầng production với release gates còn mở; Phase 8 chứa tính năng mở rộng.
> 📑 Xem chi tiết tại: **[docs/planning/ROADMAP.md](docs/planning/ROADMAP.md)**

| Phase | Tên | Trạng thái |
|:-----:|-----|:----------:|
| 0 | Foundation & Infrastructure | ✅ Hoàn thành |
| 1 | Authentication & Identity | ✅ Hoàn thành |
| 2 | Content & News Feed | ✅ Hoàn thành |
| 3 | Social Graph & Friends | ✅ Hoàn thành |
| 4 | Realtime Chat | ✅ Hoàn thành (Sprint 4.1→4.5) |
| 5 | Notification System | ✅ Hoàn thành (Sprint 5.1→5.4 + System Broadcast) |
| 6 | Navigation, Performance & Testing | ✅ Core hoàn thành; load/restore verification là release gate |
| 7 | Production Deployment | 🟡 Đã vận hành AWS/Vercel/HTTPS; cần hoàn tất release gates |
| 8 | Extended Features | 🟡 1-1 WebRTC, nested replies, admin, post sharing đã có; Group Chat/Stories/AI còn mở |

**Tiến độ core: hoàn thành.** Không coi là “production-ready” cho đến khi các gate bảo mật, backup/rollback, OAuth/media/email browser smoke, realtime/call two-account và load verification được đóng.

---

## 📂 Tài liệu hướng dẫn (Documentation)
Để hiểu sâu hơn về dự án, vui lòng đọc các tài liệu sau:
- **[STRUCTURE.md](docs/architecture/STRUCTURE.md):** Cách vận hành Docs & Skills.
- **[SYSTEM_DESIGN.md](docs/architecture/SYSTEM_DESIGN.md):** Bản thiết kế DB và Kiến trúc hệ thống.
- **[PROGRESS.md](docs/planning/PROGRESS.md):** Nhật ký tiến độ và các quyết định kỹ thuật.
- **[PROFILE_PRIVACY_POLICY.md](docs/guidelines/PROFILE_PRIVACY_POLICY.md):** Chính sách hiển thị dữ liệu Profile và contract API theo người xem.
- **[IMAGE_UPLOAD_VALIDATION_PLAN.md](docs/planning/IMAGE_UPLOAD_VALIDATION_PLAN.md):** Policy upload ảnh bài viết, validation và lộ trình Direct Signed Cloudinary Upload.
- **[GOOGLE_OAUTH_LOGIN_PLAN.md](docs/planning/GOOGLE_OAUTH_LOGIN_PLAN.md):** Kế hoạch Google OAuth/OIDC với JWT HttpOnly cookie và account linking an toàn.
- **[AWS_DEPLOYMENT_CHECKLIST.md](docs/planning/AWS_DEPLOYMENT_CHECKLIST.md):** Quy trình vận hành AWS, Vercel, DNS, HTTPS và checklist release production.
- **[DOMAIN_CONFIGURATION.md](docs/planning/DOMAIN_CONFIGURATION.md):** Cấu hình DNS công khai cho frontend và API, không chứa dữ liệu đăng ký tên miền.
- **[LOCAL_CONFIGURATION.md](docs/guidelines/LOCAL_CONFIGURATION.md):** Cấu hình local Cloudinary, Google OAuth, profile và nguyên tắc giữ secret ngoài Git.
- **[AI_GUIDELINES.md](docs/guidelines/AI_GUIDELINES.md):** Quy tắc làm việc dành cho AI.
- **[API_REFERENCE.md](docs/api/API_REFERENCE.md):** Hợp đồng REST, SSE, STOMP và WebRTC signaling hiện tại.
- **[DOCUMENTATION_STATUS.md](docs/DOCUMENTATION_STATUS.md):** Bảng theo dõi tính chính xác và trạng thái cập nhật tài liệu.

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
    ./mvnw -Dspring-boot.run.profiles=local spring-boot:run
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
- Tuân thủ `.agents/AGENTS.md` và cấu hình Kilo trong `.kilo/`.
- Luôn sử dụng Swagger Annotations (springdoc-openapi) cho mọi Controller.
- Business logic nằm hoàn toàn trong Service.
- **Git Automation:** Khi người dùng yêu cầu "đẩy lên git", hãy tự động stage (`git add .`), commit với message mô tả đúng các thay đổi, và push lên remote ngay lập tức.
