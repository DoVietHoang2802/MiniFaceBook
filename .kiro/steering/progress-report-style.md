---
inclusion: manual
---

# 📊 Progress Report Style Guide

Khi người dùng hỏi về **tiến độ dự án**, **làm tới đâu rồi**, **xem ta làm gì rồi**, hoặc các câu hỏi tương tự, AI PHẢI tuân thủ format báo cáo sau:

## 🎯 FORMAT BẮT BUỘC

### 1. Tổng Quan Tiến Độ (Bảng Summary)
```markdown
## 🎯 TỔNG QUAN TIẾN ĐỘ

| Phase | Tên | Trạng thái | Hoàn thành |
|-------|-----|------------|------------|
| **Phase 0** | Foundation & Infrastructure | ✅ HOÀN THÀNH | 100% |
| **Phase 1** | Authentication & Identity | ✅ HOÀN THÀNH | 100% |
| **Phase 2** | Content & News Feed | ✅ HOÀN THÀNH | 100% |
| **Phase 3** | Social Graph & Friends | 🔄 ĐANG LÀM | XX% |
| **Phase 4** | Realtime Chat | ⏳ CHƯA BẮT ĐẦU | 0% |
| **Phase 5** | Notification System | ⏳ CHƯA BẮT ĐẦU | 0% |
| **Phase 6** | Advanced & Deployment | ⏳ CHƯA BẮT ĐẦU | 0% |
| **Phase 7** | Extended Features | ⏳ CHƯA BẮT ĐẦU | 0% |

**Tổng tiến độ dự án: ~XX%** (X/7 Phases)
```

### 2. Chi Tiết Từng Phase (Bảng Technologies)
Mỗi Phase phải có bảng liệt kê chi tiết:

```markdown
## ✅ PHASE X: TÊN PHASE (XX% HOÀN THÀNH)

### Category Name
| Công nghệ/Feature | Mô tả | Trạng thái |
|-------------------|-------|------------|
| **Tên** | Mô tả ngắn | ✅ Đã triển khai / ⏳ Chưa làm |
```

### 3. Ký Hiệu Trạng Thái
- ✅ = Đã hoàn thành / Đã triển khai
- 🔄 = Đang làm / In Progress
- ⏳ = Chưa bắt đầu / Pending
- ❌ = Bị hủy / Removed

### 4. Cấu Trúc Code (Tree View)
```markdown
## 📁 CẤU TRÚC CODE HIỆN TẠI

### Backend Modules
\```
backend/src/main/java/com/minifacebook/
├── module/
│   ├── auth/ ✅
│   └── post/ ✅
└── shared/ ✅
\```
```

### 5. Thống Kê Công Nghệ
```markdown
## 📊 THỐNG KÊ CÔNG NGHỆ

### Đã Triển Khai: XX Technologies
| Category | Count | Technologies |
|----------|-------|--------------|
| **Backend Core** | X | Java, Spring Boot, ... |

### Chưa Triển Khai: XX Technologies
| Category | Count | Technologies |
|----------|-------|--------------|
| **Testing** | X | JUnit, Playwright, ... |
```

### 6. Kết Luận
```markdown
## 🎯 KẾT LUẬN

**Dự án đã hoàn thành:**
- ✅ **Phase X** (100%): Mô tả ngắn
- 🔄 **Phase Y** (XX%): Mô tả ngắn

**Còn lại:**
- ⏳ **Phase Z**: Mô tả

**Đánh giá:** Nhận xét tổng quan
```

## 📋 NGUỒN DỮ LIỆU

Khi tạo báo cáo, AI PHẢI đọc các file sau:
1. `docs/planning/ROADMAP.md` - Lộ trình và checklist
2. `docs/planning/PROGRESS.md` - Nhật ký tiến độ
3. `backend/src/main/java/com/minifacebook/` - Cấu trúc backend
4. `frontend/src/` - Cấu trúc frontend
5. `backend/pom.xml` - Dependencies backend
6. `frontend/package.json` - Dependencies frontend

## 🎨 PHONG CÁCH

- Sử dụng emoji để phân biệt sections
- Bảng markdown cho dữ liệu có cấu trúc
- Tree view cho cấu trúc thư mục
- Ngôn ngữ: Tiếng Việt (có thể mix tiếng Anh cho technical terms)
- Vai trò: Senior System Analyst với 10+ năm kinh nghiệm
- Giọng văn: Chuyên nghiệp, rõ ràng, dễ hiểu

## 🚫 KHÔNG LÀM

- Không liệt kê dạng bullet points dài dòng
- Không bỏ qua các Phase chưa làm
- Không đoán mò - phải đọc file thực tế
- Không dùng format khác ngoài bảng markdown
