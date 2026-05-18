# 🏗️ PROJECT STRUCTURE & GOVERNANCE

*Tài liệu này giải thích cách vận hành hệ thống Tài liệu (Docs) và Kỹ năng (Skills) để đảm bảo tính nhất quán và kỷ luật của dự án MiniFaceBook.*

---

## 📘 1. Hệ thống tài liệu (Documentation System)
Hệ thống tài liệu là **"Sách lược & Nhật ký"** của dự án. Nó giúp duy trì bối cảnh (Context) cho cả Developer và AI.

| File | Chức năng |
| :--- | :--- |
| **README.md** | Cổng vào dự án. Chứa Tech Stack, triết lý và hướng dẫn khởi chạy nhanh. |
| **ROADMAP.md** | Lộ trình chiến lược 6 Phase. Dùng để theo dõi những gì **SẼ** làm. |
| **PROGRESS.md** | Nhật ký tiến độ thực tế. Dùng để ghi lại những gì **ĐÃ** làm và lý do kỹ thuật. |
| **SYSTEM_DESIGN.md** | Bản thiết kế kỹ thuật tổng thể (Database, Security, Architecture). |
| **AI_GUIDELINES.md** | **Hiến pháp tối cao.** Quy định quy chuẩn viết code và kỷ luật cho AI. |
| **SESSION_HANDOFF.md** | Cầu nối giữa các phiên làm việc. Ghi lại trạng thái hiện tại và việc cần làm tiếp theo. |
| **TESTING_GUIDE.md** | Cẩm nang kiểm thử. Hướng dẫn cách chạy và test các tính năng đã hoàn thiện. |

---

## 🧠 2. Hệ thống kỹ năng (Internal Skills)
Nằm trong thư mục `.antigravity/skills/`. Đây là **"Cẩm nang thực thi chuyên sâu"** dành riêng cho AI, đảm bảo mọi dòng code đều đạt chuẩn Senior.

- **spring-boot-mastery:** Tiêu chuẩn Modular Clean Architecture, MapStruct, Lombok.
- **security-expert:** Tiêu chuẩn bảo mật (Refresh Token Rotation, HttpOnly Cookies).
- **realtime-architect:** Tiêu chuẩn làm Chat với Spring WebSocket & STOMP.
- **frontend-master:** Tiêu chuẩn React, TypeScript, Tailwind & Zod.
- **db-optimization:** Tiêu chuẩn tối ưu MongoDB, Neo4j và Caching.
- **devops-testing:** Tiêu chuẩn JUnit 5, Testcontainers, K6 và Docker.

---

## ⚖️ 3. Docs vs Skills: Sự khác biệt
- **Docs (Sách lược):** Trả lời câu hỏi **"Cần làm gì?"** và **"Tại sao làm thế?"**. Dành cho cả người và AI.
- **Skills (Kỹ thuật):** Trả lời câu hỏi **"Làm nó như thế nào cho xịn?"**. Tập trung vào việc ép AI tuân thủ các chuẩn mực kỹ thuật ngầm.

---
> **"Tài liệu tốt là nền tảng của một dự án trường tồn."**
