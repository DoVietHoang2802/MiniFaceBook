# MiniFaceBook

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
| 7 | Production Deployment | ✅ AWS/Vercel/HTTPS đang vận hành |
| 8 | Extended Features | 🟡 1-1 WebRTC, nested replies, admin, post sharing và chat AI đã có; Group Chat/Stories còn mở |

**Tiến độ core: hoàn thành.** Production MVP đã vận hành; các release hardening còn lại được theo dõi trong [Production Readiness Checklist](docs/planning/PRODUCTION_READINESS_CHECKLIST.md).

---

## 📂 Tài liệu hướng dẫn (Documentation)
Tài liệu product, architecture, deployment và testing hiện hành được index tại **[docs/README.md](docs/README.md)**.

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
