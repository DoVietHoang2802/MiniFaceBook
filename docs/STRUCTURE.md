# Project Structure & Management Guide

## 🛠 Cách vận hành hệ thống Tài liệu (Docs)
Dự án MiniFaceBook sử dụng hệ thống tài liệu phân lớp để đảm bảo tính nhất quán:

1. **README.md (Thư mục gốc):** Điểm khởi đầu. Chứa Stack công nghệ, Triết lý phát triển và Hướng dẫn cho AI.
2. **docs/ROADMAP.md:** Lộ trình chi tiết 6 Phase. Dùng để theo dõi những gì SẼ làm.
3. **docs/PROGRESS.md:** Nhật ký tiến độ. Dùng để ghi lại những gì ĐÃ làm và tại sao làm thế.
4. **docs/SYSTEM_DESIGN.md:** Bản thiết kế kỹ thuật (DB, Security, Architecture).
5. **docs/AI_GUIDELINES.md:** Quy tắc bắt buộc AI phải tuân theo khi viết code.

---

## 🧠 Cách vận hành hệ thống Kỹ năng (Internal Skills)
Các kỹ năng nằm trong thư mục `.antigravity/skills/` là các "Manual" hướng dẫn thực thi chuyên sâu cho AI:

- **nestjs-mastery:** Tiêu chuẩn viết Backend (Modular, Swagger, DTO).
- **security-expert:** Tiêu chuẩn bảo mật (Refresh Token, HttpOnly Cookies).
- **realtime-architect:** Tiêu chuẩn làm Chat (Socket.io + Redis).
- **frontend-master:** Tiêu chuẩn làm giao diện (React, shadcn/ui, Zod).
- **db-optimization:** Tiêu chuẩn tối ưu Database (Index, Soft Delete).
- **devops-testing:** Tiêu chuẩn triển khai (Docker, Jest, CI/CD).

---

## 💡 Lưu ý cho AI Assistant
Trước khi thực hiện bất kỳ thay đổi nào vào Source Code, AI phải đảm bảo thay đổi đó không vi phạm các nguyên tắc đã ghi trong **AI_GUIDELINES.md** và phù hợp với giai đoạn hiện tại trong **ROADMAP.md**.
