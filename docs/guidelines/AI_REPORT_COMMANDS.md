# 🤖 AI REPORT COMMANDS & STYLE GUIDE

> **BẮT BUỘC:** Mọi AI Assistant (Claude, GPT, Gemini, Copilot, Cursor, Kiro...) khi làm việc với dự án này PHẢI đọc và tuân thủ file này.

---

## 📋 DANH SÁCH LỆNH BÁO CÁO

Khi người dùng sử dụng các từ khóa/câu lệnh sau, AI PHẢI áp dụng format tương ứng:

### 1. 📊 Lệnh Xem Tiến Độ
**Trigger keywords:**
- "làm tới đâu rồi"
- "tiến độ thế nào"
- "xem tiến độ"
- "progress report"
- "đã làm được gì"
- "hoàn thành bao nhiêu"

**→ Áp dụng:** [Progress Report Format](#-progress-report-format)

---

### 2. 🛠️ Lệnh Liệt Kê Tech Stack
**Trigger keywords:**
- "tech stack"
- "công nghệ gì"
- "dùng những gì"
- "liệt kê công nghệ"
- "technologies"

**→ Áp dụng:** [Tech Stack Format](#-tech-stack-format)

---

### 3. 🏆 Lệnh Xem Highlights/Thành Tựu
**Trigger keywords:**
- "highlights"
- "thành tựu"
- "điểm nổi bật"
- "CV portfolio"
- "đưa vào CV"

**→ Áp dụng:** Đọc file `docs/guidelines/CV_PORTFOLIO_HIGHLIGHTS.md`

---

## 📊 PROGRESS REPORT FORMAT

### Bước 1: Đọc các file nguồn
```
PHẢI ĐỌC:
1. docs/planning/ROADMAP.md
2. docs/planning/PROGRESS.md
3. backend/src/main/java/com/minifacebook/ (cấu trúc)
4. frontend/src/ (cấu trúc)
5. backend/pom.xml
6. frontend/package.json
```

### Bước 2: Tạo báo cáo theo format

#### 2.1. Bảng Tổng Quan
```markdown
## 🎯 TỔNG QUAN TIẾN ĐỘ

| Phase | Tên | Trạng thái | Hoàn thành |
|-------|-----|------------|------------|
| **Phase 0** | Foundation & Infrastructure | ✅ HOÀN THÀNH | 100% |
| **Phase 1** | Authentication & Identity | ✅ HOÀN THÀNH | 100% |
| **Phase 2** | Content & News Feed | 🔄 ĐANG LÀM | XX% |
| **Phase 3** | Realtime Chat | ⏳ CHƯA BẮT ĐẦU | 0% |
| **Phase 4** | Social Graph & Friends | ⏳ CHƯA BẮT ĐẦU | 0% |
| **Phase 5** | Advanced & Deployment | ⏳ CHƯA BẮT ĐẦU | 0% |
| **Phase 6** | Extended Features | ⏳ CHƯA BẮT ĐẦU | 0% |

**Tổng tiến độ dự án: ~XX%**
```

#### 2.2. Chi Tiết Từng Phase
```markdown
## ✅ PHASE X: TÊN PHASE (XX% HOÀN THÀNH)

### Category Name
| Công nghệ/Feature | Mô tả | Trạng thái |
|-------------------|-------|------------|
| **Tên công nghệ** | Mô tả ngắn gọn | ✅ Đã triển khai |
| **Tên feature** | Mô tả ngắn gọn | ⏳ Chưa làm |
```

#### 2.3. Cấu Trúc Code
```markdown
## 📁 CẤU TRÚC CODE HIỆN TẠI

### Backend Modules
```
backend/src/main/java/com/minifacebook/
├── module/
│   ├── auth/ ✅
│   └── post/ ✅
└── shared/ ✅
```

### Frontend Modules
```
frontend/src/
├── core/ ✅
└── modules/
    ├── auth/ ✅
    ├── feed/ ✅
    ├── post/ ✅
    └── profile/ ✅
```
```

#### 2.4. Thống Kê & Kết Luận
```markdown
## 📊 THỐNG KÊ CÔNG NGHỆ

### Đã Triển Khai: XX Technologies
| Category | Count | Technologies |
|----------|-------|--------------|
| **Backend Core** | X | Java, Spring Boot, MongoDB... |
| **Frontend Core** | X | React, TypeScript, Vite... |

### Chưa Triển Khai: XX Technologies
| Category | Count | Technologies |
|----------|-------|--------------|
| **Testing** | X | JUnit, Playwright... |

---

## 🎯 KẾT LUẬN

**Dự án đã hoàn thành:**
- ✅ **Phase X** (100%): Mô tả
- 🔄 **Phase Y** (XX%): Mô tả

**Còn lại:**
- ⏳ **Phase Z**: Mô tả

**Đánh giá:** Nhận xét tổng quan về dự án
```

---

## 🛠️ TECH STACK FORMAT

### Bảng Liệt Kê Công Nghệ
```markdown
## 🛠️ TECH STACK - MiniFaceBook

### Backend
| Công nghệ | Version | Vai trò | Trạng thái |
|-----------|---------|---------|------------|
| **Java** | 21 | Runtime | ✅ Đã dùng |
| **Spring Boot** | 3.3.0 | Framework | ✅ Đã dùng |

### Frontend
| Công nghệ | Version | Vai trò | Trạng thái |
|-----------|---------|---------|------------|
| **React** | 19.2.6 | UI Library | ✅ Đã dùng |

### DevOps
| Công nghệ | Version | Vai trò | Trạng thái |
|-----------|---------|---------|------------|
| **Docker** | Latest | Container | ✅ Đã dùng |
```

---

## 🎨 QUY TẮC CHUNG

### Ký Hiệu Trạng Thái
| Ký hiệu | Ý nghĩa |
|---------|---------|
| ✅ | Đã hoàn thành / Đã triển khai |
| 🔄 | Đang làm / In Progress |
| ⏳ | Chưa bắt đầu / Pending |
| 🔜 | Sẽ làm trong tương lai |
| ❌ | Bị hủy / Removed |

### Phong Cách Viết
- **Ngôn ngữ:** Tiếng Việt (mix tiếng Anh cho technical terms)
- **Vai trò:** Senior System Analyst với 10+ năm kinh nghiệm
- **Giọng văn:** Chuyên nghiệp, rõ ràng, có cấu trúc
- **Format:** Ưu tiên bảng markdown, tránh bullet points dài

### KHÔNG Được Làm
- ❌ Không đoán mò - PHẢI đọc file thực tế
- ❌ Không bỏ qua các Phase/Feature chưa làm
- ❌ Không dùng format khác ngoài bảng markdown
- ❌ Không liệt kê dạng paragraph dài dòng

---

## 📂 FILE NGUỒN QUAN TRỌNG

| File | Mục đích |
|------|----------|
| `docs/planning/ROADMAP.md` | Lộ trình 6 Phase, checklist tasks |
| `docs/planning/PROGRESS.md` | Nhật ký tiến độ, debugging log |
| `docs/architecture/SYSTEM_DESIGN.md` | Thiết kế hệ thống, DB schema |
| `docs/guidelines/CV_PORTFOLIO_HIGHLIGHTS.md` | Thành tựu kỹ thuật STAR format |
| `docs/guidelines/UI_UX_DESIGN.md` | Design system, color tokens |
| `backend/pom.xml` | Backend dependencies |
| `frontend/package.json` | Frontend dependencies |

---

> **Lưu ý:** File này là "Hiến pháp báo cáo" của dự án. Mọi AI PHẢI tuân thủ khi được yêu cầu tạo báo cáo tiến độ hoặc liệt kê công nghệ.
