# 🚀 MiniFaceBook - Professional Backend Foundation

> [!CAUTION]
> ### 🛑 BẮT BUỘC ĐỐI VỚI AI (MANDATORY STARTUP PROTOCOL)
> Trước khi thực hiện bất kỳ hành động nào trong phiên chat mới, AI PHẢI đọc file **[docs/SESSION_HANDOFF.md](docs/SESSION_HANDOFF.md)** để đồng bộ bối cảnh và các quyết định chiến lược. Không được bỏ qua bước này!

---

## 🧠 Triết lý phát triển (Core Philosophy)
- **Quality Over Quantity:** Hoàn thiện Core (Auth, 1-1 Chat) đạt điểm 10 trước khi mở rộng.
- **Single Source of Truth:** Tài liệu được phân lớp rõ ràng, tránh dư thừa và sai lệch thông tin.
- **Security First:** Triển khai các cơ chế bảo mật hiện đại nhất (Refresh Token Rotation, HttpOnly Cookies, Throttler).

---

## 🛠 Tech Stack (Production Ready)
- **Backend:** Java 21 (LTS) + Spring Boot 3.x - Modular Clean Architecture.
- **Realtime:** Spring WebSocket (STOMP) + Redis Pub/Sub.
- **Database:** MongoDB (Atlas) + Redis (Caching & Sessions) + **Neo4j (Graph Database cho Social Connections)**.
- **Search & Broker:** **ElasticSearch** (Search), **Kafka/RabbitMQ** (Event-Driven).

---

## 🏃‍♂️ Khởi chạy nhanh (Quick Start)
1. **Hạ tầng:** `docker-compose up -d`
2. **Backend:** Truy cập `backend/` và chạy `mvn spring-boot:run`
3. **Tài liệu API:** Truy cập [http://localhost:8080/api/docs](http://localhost:8080/api/docs)

Chi tiết cách kiểm tra các tính năng bảo mật và kiến trúc, vui lòng xem tại: **[docs/TESTING_GUIDE.md](docs/TESTING_GUIDE.md)**

---
- **Security:** Spring Security (Stateless JWT) + Refresh Token Rotation + **RBAC (Role-Based Access Control)**.
- **Core Tools:** Lombok, MapStruct, ArchUnit, Bucket4j.
- **Services:** Cloudinary (Media), Resend (Email), Google Gemini (AI), **Sentry (Error Tracking)**.
- **Frontend:** React + TypeScript + shadcn/ui + Tailwind + Zod + TanStack Query.
- **DevOps & Monitoring:** Docker Compose, GitHub Actions, Prometheus & Grafana.
- **Testing:** JUnit 5, Mockito, MockMvc, Testcontainers, Playwright, **K6 (Load Testing)**.

---

## 🗺️ Project Roadmap (Tóm tắt)
Dự án được chia làm 6 giai đoạn phát triển chính. 
> 📑 Xem chi tiết tại: **[docs/ROADMAP.md](docs/ROADMAP.md)**

- **Phase 1:** Core Auth & Identity (🏗️ *Đang triển khai*).
- **Phase 2:** Realtime Chat (MVP).
- **Phase 3:** Social Graph & Friends.
- **Phase 4:** Content & Engagement (AI Integration).
- **Phase 5:** Optimization & Deployment.
- **Phase 6:** Scaling & Extended Features.

---

## 📂 Tài liệu hướng dẫn (Documentation)
Để hiểu sâu hơn về dự án, vui lòng đọc các tài liệu sau:
- **[STRUCTURE.md](docs/STRUCTURE.md):** Cách vận hành Docs & Skills.
- **[SYSTEM_DESIGN.md](docs/SYSTEM_DESIGN.md):** Bản thiết kế DB và Kiến trúc hệ thống.
- **[PROGRESS.md](docs/PROGRESS.md):** Nhật ký tiến độ và các quyết định kỹ thuật.
- **[AI_GUIDELINES.md](docs/AI_GUIDELINES.md):** Quy tắc làm việc dành cho AI.

---

## 🚀 Quick Start (Dành cho Developer)
1. **Clone project:** `git clone ...`
2. **Cấu hình môi trường:** Copy `.env.example` thành `.env` và điền các tham số.
3. **Chạy hạ tầng (Docker):**
   ```bash
   docker-compose up -d
   ```
4. **Cài đặt & Chạy Backend (Maven):**
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```
5. **Truy cập Swagger:** `http://localhost:8080/api/docs`

---

## 🤖 Guide for AI Assistant (BẮT BUỘC)
Trước khi thực hiện bất kỳ Task nào, AI phải đọc tài liệu theo thứ tự:
1. `README.md` -> 2. `docs/STRUCTURE.md` -> 3. `docs/ROADMAP.md` -> 4. `docs/PROGRESS.md`.
- Tuân thủ nghiêm ngặt các Skill trong thư mục `.antigravity/skills/`.
- Luôn sử dụng Swagger Annotations (springdoc-openapi) cho mọi Controller.
- Business logic nằm hoàn toàn trong Service.
- **Git Automation:** Khi người dùng yêu cầu "đẩy lên git", hãy tự động stage (`git add .`), commit với message mô tả đúng các thay đổi, và push lên remote ngay lập tức.