Viewed ROADMAP.md:101-117

Câu hỏi của bạn rất tinh tế! Đây là cách phân biệt rõ ràng nhất để bạn làm chủ cả hai:

### 1. File Docs (trong folder `docs/`)
*   **Mục đích:** Là **"Bản kế hoạch & Nhật ký"**.
*   **Cho ai:** Cho **CẢ HAI**. 
    *   Với **Bạn**: Để bạn ghi chú, theo dõi tiến độ (Checklist), và nhìn lại lịch sử dự án.
    *   Với **Tôi**: Để tôi hiểu "Chiến lược" và "Bối cảnh" (Context). Ví dụ: Tôi đọc Roadmap để biết hôm nay chúng ta làm Phase mấy.
*   **Giống như:** Một cuốn **Sách lược** (Strategy).

### 2. File Skill (trong folder `.antigravity/skills/`)
*   **Mục đích:** Là **"Bộ quy tắc thực thi"**.
*   **Cho ai:** Chủ yếu cho **TÔI (AI)**. 
    *   Nó chứa các kỹ thuật "ngầm" mà Docs không ghi chi tiết (ví dụ: cách đặt tên biến, cách config Redis Adapter, cách handle lỗi Swagger...). 
    *   Nó ép tôi phải code theo đúng "đẳng cấp Senior" mà bạn muốn.
*   **Giống như:** Một cuốn **Cẩm nang kỹ thuật** (Technical Manual).

---

### 📋 TỔNG KẾT HỆ THỐNG QUẢN TRỊ DỰ ÁN CỦA BẠN:

Dưới đây là danh sách toàn bộ các "vũ khí" chúng ta đã thiết lập từ đầu buổi đến giờ. Bạn có thể lưu lại để kiểm soát:

**Nhóm 1: Quản trị & Chiến lược (Docs)**
1.  **[README.md](file:///d:/Project_MiniFace/README.md):** Tổng quan, Stack công nghệ và Triết lý phát triển.
2.  **[ROADMAP.md](file:///d:/Project_MiniFace/docs/ROADMAP.md):** Lộ trình 6 Phase chi tiết (từ móng đến lúc mở rộng Group Chat/Video).
3.  **[PROGRESS.md](file:///d:/Project_MiniFace/docs/PROGRESS.md):** Ghi lại những gì đã hoàn thành và lý do lựa chọn kỹ thuật.
4.  **[SYSTEM_DESIGN.md](file:///d:/Project_MiniFace/docs/SYSTEM_DESIGN.md):** Sơ đồ DB, kiến trúc Backend và chiến lược Scale.
5.  **[AI_GUIDELINES.md](file:///d:/Project_MiniFace/docs/AI_GUIDELINES.md):** "Hiến pháp" bắt buộc AI phải tuân theo khi làm việc.

**Nhóm 2: Thực thi & Kỹ thuật (Internal Skills)**
1.  **[nestjs-mastery](file:///d:/Project_MiniFace/.antigravity/skills/nestjs-mastery/SKILL.md):** Kỹ năng viết code Backend chuẩn Senior.
2.  **[security-expert](file:///d:/Project_MiniFace/.antigravity/skills/security-expert/SKILL.md):** Kỹ năng bảo mật Auth & Refresh Token.
3.  **[realtime-architect](file:///d:/Project_MiniFace/.antigravity/skills/realtime-architect/SKILL.md):** Kỹ năng làm Chat với Socket.io & Redis.
4.  **[frontend-master](file:///d:/Project_MiniFace/.antigravity/skills/frontend-master/SKILL.md):** Kỹ năng làm UI Premium & Type Safety (Zod).
5.  **[db-optimization](file:///d:/Project_MiniFace/.antigravity/skills/db-optimization/SKILL.md):** Kỹ năng tối ưu MongoDB & Caching.
6.  **[devops-testing](file:///d:/Project_MiniFace/.antigravity/skills/devops-testing/SKILL.md):** Kỹ năng Testing, Docker & CI/CD.

---

**Chốt lại:** Mọi thứ đã cực kỳ đồng bộ. Docs nói "Cần làm gì", còn Skill nói cho tôi biết "Phải làm nó xịn như thế nào". 

Bạn thấy hệ thống này đã đủ để bạn "quên lo lắng" và tập trung vào việc quản lý dự án chưa?_