# 📋 PHÂN TÍCH KỸ THUẬT - TECH STACK & CÔNG NGHỆ

> [!NOTE]
> **Tài liệu tham khảo nội bộ** — Phục vụ mục đích thảo luận và tra cứu kỹ thuật.
> Đây **không phải** lộ trình phát triển tính năng chính thức.
> Lộ trình Sprint và tính năng xem tại: **[docs/planning/ROADMAP.md](../planning/ROADMAP.md)**

---

*Phân tích được thực hiện tại thời điểm Sprint 2.1 hoàn thành — 22/05/2026*

---

## PHẦN 1: CÔNG NGHỆ ĐÃ SỬ DỤNG (CURRENT STACK)

### 🔵 BACKEND

| Công nghệ | Mục đích | Lý do chọn | Vấn đề giải quyết |
|:---|:---|:---|:---|
| **Java 21 (LTS)** | Ngôn ngữ lập trình chính | Phiên bản LTS mới nhất, hỗ trợ Virtual Threads (Project Loom) | Xử lý đồng thời lớn hơn mà không tốn nhiều RAM |
| **Spring Boot 3.3** | Framework Backend chính | Hệ sinh thái trưởng thành nhất cho Java Enterprise | Giảm boilerplate, tự động cấu hình, tích hợp sẵn Security/Data |
| **Modular Clean Architecture** | Tổ chức code theo 4 lớp: Domain / Application / Infrastructure / Presentation | Tách biệt nghiệp vụ khỏi framework | Code dễ test, dễ bảo trì, không bị "dính chặt" vào DB hay framework cụ thể |
| **Spring Security + OAuth2 Resource Server** | Xác thực & phân quyền | Chuẩn bảo mật enterprise Spring 6 | Kiểm soát truy cập API, bảo vệ tài nguyên |
| **Nimbus JOSE + JWT** | Tạo và xác thực JWT Token | Thư viện JWT mạnh mẽ nhất cho Java | Xác thực stateless không cần server-side session |
| **HttpOnly Cookie (Access + Refresh Token)** | Truyền token bảo mật | Ẩn token khỏi JavaScript hoàn toàn | Chống tấn công XSS đánh cắp token |
| **Refresh Token Rotation + Anti-Replay** | Duy trì phiên đăng nhập an toàn | Tiêu chuẩn bảo mật cao nhất của OAuth2 | Nếu Refresh Token bị lộ, hệ thống tự phát hiện và vô hiệu hóa toàn bộ session |
| **RBAC (Role-Based Access Control)** | Phân quyền theo vai trò ADMIN/USER | Chuẩn industry | Kiểm soát quyền truy cập từng API endpoint |
| **Lombok** | Giảm boilerplate Java | Code ngắn gọn, dễ đọc, giảm lỗi nhân công | Tự động sinh Getter/Setter/Constructor/Builder |
| **MapStruct** | Ánh xạ Entity ↔ DTO | Hiệu năng cao — compile-time, không dùng reflection | Không để Entity lộ ra ngoài Presentation Layer |
| **ArchUnit** | Kiểm tra cấu trúc kiến trúc bằng Unit Test | "Architecture as Code" | Phát hiện ngay khi code vi phạm quy tắc Clean Architecture |
| **Checkstyle + Spotless** | Kiểm tra chuẩn code style | Google Java Style Guide | Đảm bảo code nhất quán trong toàn team |
| **SpringDoc OpenAPI (Swagger)** | Tài liệu API tự động tại `/api/docs` | Single Source of Truth | FE biết chính xác contract API, không cần trao đổi thủ công |
| **Bucket4j** | Rate Limiting theo IP | Nhẹ, tích hợp dễ với Spring Filter | Chống bot spam, brute-force, DDoS cơ bản |
| **Apache Tika (Magic Bytes)** | Quét chữ ký nhị phân file upload | Đọc signature thật của file, không tin vào đuôi file | Chặn file độc hại đổi đuôi `.exe → .jpg` để bypass kiểm tra |
| **Cloudinary** | Lưu trữ media (ảnh, video) trên cloud | Free tier hào phóng, CDN tích hợp sẵn | Không cần mua/quản lý server lưu trữ file riêng |
| **Resend Email API** | Gửi email xác thực tài khoản | API hiện đại, dễ tích hợp, free tier | Gửi link kích hoạt tài khoản đăng ký mới |
| **SLF4J + Logback** | Ghi log hệ thống | Chuẩn logging mặc định của Spring Boot | Theo dõi hoạt động và debug lỗi hệ thống |
| **Global Exception Handler** | Xử lý lỗi tập trung qua `@RestControllerAdvice` | Một nơi duy nhất kiểm soát tất cả lỗi | Mọi lỗi đều trả về format JSON chuẩn `ApiResponse<T>` |

---

### 🟢 FRONTEND

| Công nghệ | Mục đích | Lý do chọn | Vấn đề giải quyết |
|:---|:---|:---|:---|
| **React 19 + Vite** | Framework UI chính | Hệ sinh thái lớn nhất, Vite build cực nhanh (< 1s HMR) | Xây dựng SPA mượt mà, tái sử dụng component |
| **TypeScript** | Ngôn ngữ lập trình Frontend | Type-safety từ compile-time | Phát hiện lỗi sớm, code tự tài liệu hóa |
| **Tailwind CSS v4 (CSS-first)** | Styling UI | Utility-first, không cần đặt tên class CSS | Thiết kế nhanh, responsive layout dễ dàng |
| **shadcn/ui** | Component library | Component mở — copy vào project, không bị lock-in | UI đẹp, nhất quán, tùy biến linh hoạt |
| **Zod** | Validate schema dữ liệu | TypeScript-first, type inference tự động | Lọc dữ liệu rác phía Client trước khi gửi lên Server |
| **TanStack Query** | Quản lý server-side state | Tự động cache, refetch, loading/error state | Giảm code boilerplate khi fetch API |
| **Axios + Mutex Lock Interceptor** | HTTP Client + Silent Refresh tự động | Giải quyết Token Refresh Storm | Tự động xoay vòng Access Token ngầm khi hết hạn mà không logout người dùng |
| **Vizo Light Slate Theme (Notion-inspired)** | Ngôn ngữ thiết kế thống nhất | HSL color system nhẹ nhàng cao cấp | Trải nghiệm người dùng premium, nhất quán xuyên suốt ứng dụng |
| **Client-side File Size Guard** | Chặn file > 5MB trước khi upload | Validate sớm tại máy khách | Tránh lỗi `ERR_CONNECTION_RESET` từ Tomcat, UX tốt hơn |

---

### 🗄️ DATABASE

| Công nghệ | Loại | Mục đích | Lý do chọn | Vấn đề giải quyết |
|:---|:---|:---|:---|:---|
| **MongoDB (Port 27018)** | Document DB — Cơ sở dữ liệu chính | Lưu User, Post, RefreshToken, Comment | Schema linh hoạt, phù hợp dữ liệu mạng xã hội thay đổi thường xuyên | Không cần migration phức tạp khi thêm field mới |
| **Mongock** | Migration Tool | Quản lý Database Schema Migration | Tích hợp với Spring Boot, thay thế script MongoDB thủ công | Đồng bộ Index schema giữa các môi trường Dev/Staging/Prod |
| **Redis** | In-Memory Cache + Key-Value Store | Cache profile, lưu Token Blacklist | Tốc độ đọc/ghi < 1ms — nhanh hơn MongoDB 100x cho dữ liệu nóng | Giảm tải cho MongoDB, tăng tốc phản hồi API |
| **Neo4j** *(Hạ tầng sẵn, chưa code nghiệp vụ)* | Graph Database | Quản lý đồ thị quan hệ bạn bè | Truy vấn quan hệ sâu (Friends of Friends) nhanh hơn MongoDB ở quy mô lớn | Gợi ý kết bạn, tính số bạn chung |

---

### 🛠️ DEVOPS / INFRASTRUCTURE

| Công nghệ | Mục đích | Lý do chọn | Vấn đề giải quyết |
|:---|:---|:---|:---|
| **Docker Compose** | Chạy toàn bộ hạ tầng local | Một lệnh `docker-compose up -d` dựng đủ mọi service | Đảm bảo môi trường Dev nhất quán 100% giữa các máy |
| **Maven (mvnw wrapper)** | Quản lý build và dependency Backend | Chuẩn de-facto của Java Enterprise | Tự động tải thư viện, build JAR, chạy test |

---

### 🔒 SECURITY (Tổng hợp)

| Công nghệ | Mục đích |
|:---|:---|
| Spring Security Stateless JWT | Xác thực API không cần server-side session |
| HttpOnly Cookie | Chống XSS đánh cắp token qua JavaScript |
| Refresh Token Rotation | Chống Replay Attack — tự khóa session khi phát hiện bất thường |
| Bcrypt Password Encoder | Băm mật khẩu một chiều an toàn |
| RBAC (ADMIN/USER) | Phân quyền truy cập từng endpoint |
| Apache Tika | Chống upload file độc hại ngụy trang |
| Bucket4j Rate Limiter | Chống brute-force và spam API |

---

## PHẦN 2: CÔNG NGHỆ SẼ SỬ DỤNG (FUTURE ROADMAP)

### 📅 Ngắn hạn — Sprint 2.2 (Sắp tới)

| Công nghệ | Nhóm | Mục đích | Tại sao cần |
|:---|:---|:---|:---|
| **browser-image-compression** | Frontend | Nén ảnh tự động tại trình duyệt xuống < 1MB trước khi upload | Tiết kiệm 90% chi phí Cloudinary, tăng tốc độ upload trên mạng yếu |

### 📅 Trung hạn — Phase 3 & 4

| Công nghệ | Nhóm | Mục đích |
|:---|:---|:---|
| **Spring WebSocket (STOMP Protocol)** | Backend — Realtime | Chat realtime hai chiều giữa người dùng |
| **Redis Pub/Sub** | Messaging | Đồng bộ WebSocket session khi chạy nhiều server Backend |
| **Neo4j Cypher Queries + Spring Data Neo4j** | Database | Truy vấn đồ thị bạn bè, gợi ý kết bạn thông minh |

### 📅 Dài hạn — Phase 5 & 6

| Công nghệ | Nhóm | Mục đích |
|:---|:---|:---|
| **Sentry** | Monitoring | Tự động bắt lỗi Production, gửi alert về email |
| **JUnit 5 + MockMvc + Testcontainers** | Testing | Unit Test + Integration Test với DB thật trong Docker |
| **Playwright** | Testing | E2E test tự động giả lập hành vi người dùng trên trình duyệt |
| **GitHub Actions** | CI/CD | Tự động build/test/deploy khi push code lên repository |
| **ElasticSearch** | Search | Full-text search khi MongoDB Regex không đủ nhanh (> 100k bản ghi) |
| **Kafka hoặc RabbitMQ** | Messaging | Event-Driven Architecture khi hệ thống đạt hàng triệu người |
| **Prometheus + Grafana** | Monitoring | Giám sát hiệu năng CPU/RAM/DB theo thời gian thực |
| **K6** | Load Testing | Kiểm tra sức chịu tải trước khi deploy lên Production |
| **Google Gemini API** | AI Integration | Tóm tắt hội thoại dài, phân tích cảm xúc bài viết |

---

## PHẦN 3: PHÂN TÍCH THEO QUY MÔ HỆ THỐNG

### 🟢 Quy mô ~100 người dùng

**Concurrent users giờ cao điểm:** ~10–20 người  
**Đánh giá kiến trúc hiện tại:** ✅ Hoàn toàn ổn, một server 1 CPU / 1GB RAM xử lý thoải mái.

**Phân tích dư thừa (Over-engineering):**

| Công nghệ | Trạng thái | Khuyến nghị |
|:---|:---:|:---|
| Neo4j | ❌ Thừa | Thay bằng collection `friendships` trong MongoDB là đủ |
| Redis | ⚠️ Chưa tối ưu | Có thể giữ hoặc dùng in-memory map thay thế |
| ElasticSearch | ✅ Không có | Đúng — chưa cần, MongoDB Text Index là đủ |
| Kafka / RabbitMQ | ✅ Không có | Đúng — Spring `@Async` là đủ |
| Prometheus/Grafana | ✅ Không có | Đúng — dùng dashboard của Render/Railway là đủ |
| ArchUnit | ✅ Nên giữ | Không tốn tài nguyên runtime, bảo vệ kiến trúc dài hạn |
| Bucket4j | ✅ Nên giữ | Nhẹ, bảo vệ API khỏi bot spam |

---

### 🟡 Quy mô ~1000 người dùng

**Concurrent users giờ cao điểm:** ~80–150 người  
**Request ước tính:** ~500–2.000 request/phút

**Phân tích điều chỉnh kiến trúc:**

| Hạng mục | Hành động | Lý do |
|:---|:---:|:---|
| **Redis (Caching)** | ✅ Bắt buộc khai thác | Cache profile, newsfeed tránh query MongoDB liên tục |
| **browser-image-compression** | ✅ Bắt buộc | 1000 người đăng ảnh → hết free tier Cloudinary rất nhanh |
| **Sentry** | ✅ Nên tích hợp | Không thể check log thủ công với 1000 người dùng |
| **Spring WebSocket** | ✅ Cần cho Realtime Chat | Kết nối liên tục hai chiều |
| **Redis Pub/Sub** | ⚠️ Chưa cần | Chỉ cần khi chạy 2+ server — 1 server vẫn đủ |
| **Neo4j** | ❌ Vẫn chưa cần | MongoDB Aggregation < 20ms với 1000 người |
| **ElasticSearch** | ❌ Vẫn chưa cần | MongoDB Text Index vẫn đủ nhanh |
| **Kafka** | ❌ Vẫn chưa cần | Spring `@Async` xử lý tác vụ ngầm là đủ |
| **Load Balancer** | ❌ Chưa cần | 1 server vẫn phục vụ được 1000 người |

**Bottleneck tiềm năng:**
```
1. MongoDB I/O     — Newsfeed query thiếu Index tốt → Thêm Compound Index (authorId + createdAt)
2. File Upload     — Ảnh gốc không nén → Tích hợp browser-image-compression ngay Sprint 2.2
3. WebSocket       — Quản lý 100+ kết nối đồng thời → Dùng in-memory ConcurrentHashMap
4. JVM Heap        — Heap size mặc định thấp → Cấu hình -Xmx512m -Xms256m trong docker-compose
```

**Cấu hình server đề xuất tại 1000 người:**
> 🖥️ **1 CPU / 2GB RAM** — VPS khoảng $10–12/tháng (Hetzner / DigitalOcean / Vultr)  
> Stack: Docker Compose (Spring Boot + MongoDB + Redis) trên cùng 1 máy

---

## PHẦN 4: ĐÁNH GIÁ TỔNG THỂ

### ✅ Điểm mạnh

- **Kiến trúc Clean Architecture** nghiêm túc ngay từ đầu → dễ bảo trì và mở rộng lâu dài
- **Bảo mật cấp doanh nghiệp** (HttpOnly Cookie + Refresh Token Rotation + Tika) → rất đáng đầu tư từ Phase 0
- **Polyglot Persistence** đúng vai trò từng DB (Document / Cache / Graph)
- **Tự động hóa chất lượng code** (ArchUnit + Checkstyle + Spotless) → không phát sinh nợ kỹ thuật
- **Frontend phân lớp rõ ràng**, Axios Mutex Interceptor giải quyết Token Refresh Storm thực tế

### ⚠️ Điểm cần cân nhắc

| Vấn đề | Khuyến nghị cụ thể |
|:---|:---|
| Neo4j dựng Docker nhưng chưa dùng | Tạm bỏ khỏi `docker-compose.yml` để giảm RAM local dev |
| ElasticSearch + Kafka trong Roadmap | Đánh dấu rõ "Chỉ khi > 10.000 users" để tránh over-engineer sớm |
| `browser-image-compression` chưa có | Ưu tiên làm ngay Sprint 2.2 — ảnh hưởng trực tiếp đến chi phí |

### 📊 Bảng tóm tắt tổng quan

| Nhóm công nghệ | Trạng thái hiện tại | Tại 100 users | Tại 1.000 users |
|:---|:---:|:---:|:---:|
| Backend (Spring Boot + Java 21) | ✅ Hoạt động tốt | ✅ Dư sức | ✅ Dư sức |
| Frontend (React 19 + TypeScript) | ✅ Hoạt động tốt | ✅ Tốt | ✅ Tốt |
| MongoDB | ✅ Hoạt động tốt | ✅ Tốt | ⚠️ Cần thêm Index |
| Redis | ✅ Chạy, chưa tối ưu | ⚠️ Tạm ổn | ✅ Bắt buộc khai thác |
| Neo4j | ⚙️ Hạ tầng sẵn, chưa code | ❌ Chưa cần | ❌ Chưa cần |
| Docker Compose | ✅ Hoạt động tốt | ✅ Tốt | ✅ Tốt |
| Kafka / RabbitMQ | ✅ Không có | ✅ Không cần | ✅ Không cần |
| ElasticSearch | ✅ Không có | ✅ Không cần | ✅ Không cần |
| Sentry | ❌ Chưa tích hợp | ⚠️ Nên có | ✅ Bắt buộc |
| Image Compression | ❌ Chưa tích hợp | ⚠️ Nên có | ✅ Bắt buộc |

---

> **📌 Kết luận của System Analyst:**
>
> Dự án MiniFaceBook có một nền tảng kiến trúc **rất bài bản và chuyên nghiệp** so với một pet project cá nhân thông thường. Bảo mật và cấu trúc code đạt mức Enterprise-grade ngay từ Phase 0.
>
> Điểm duy nhất cần lưu ý là một số công nghệ trong Roadmap (ElasticSearch, Kafka, Neo4j) chỉ thực sự cần thiết khi hệ thống vượt qua ngưỡng **10.000+ người dùng hoạt động thường xuyên**. Tập trung hoàn thiện sản phẩm trước, scale sau — đây là tư duy đúng đắn nhất cho một pet project phát triển dài hạn.
