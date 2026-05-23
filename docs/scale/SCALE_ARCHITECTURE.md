# 🏗️ KIẾN TRÚC SCALE & LỘ TRÌNH NÂNG CẤP KỸ THUẬT

> [!NOTE]
> **Tài liệu tham khảo nội bộ** — Phục vụ mục đích thảo luận và ra quyết định kỹ thuật khi hệ thống phát triển.
> Đây **không phải** lộ trình phát triển tính năng chính thức của dự án.
> Lộ trình Sprint và tính năng xem tại: **[docs/planning/ROADMAP.md](../planning/ROADMAP.md)**

---

*Phân tích được thực hiện tại thời điểm Sprint 2.1 hoàn thành — 22/05/2026*

---

## PHẦN 1: TRẠNG THÁI CÔNG NGHỆ HIỆN TẠI

### ✅ ĐANG SỬ DỤNG

| Công nghệ | Trigger nên dùng | Khi KHÔNG nên dùng | Nếu bỏ → Thay bằng |
|:---|:---|:---|:---|
| **Java 21 + Spring Boot 3.3** | Luôn — nền tảng cốt lõi | N/A | N/A |
| **Clean Architecture (4 layers)** | Luôn — tổ chức code dài hạn | Dự án prototype < 1 tuần | N/A |
| **MongoDB** | Dữ liệu document, schema linh hoạt | Dữ liệu quan hệ phức tạp nhiều JOIN | PostgreSQL |
| **Mongock (Migration)** | Khi cần quản lý Index/Schema giữa nhiều môi trường | Prototype không có Production | Flyway (nếu dùng SQL DB) |
| **Redis (Cache + Token Blacklist)** | Khi > 30 concurrent users gọi API liên tục | Hệ thống < 10 người dùng | In-memory HashMap (tạm thời) |
| **Spring Security + JWT + HttpOnly Cookie** | Luôn — bắt buộc với bất kỳ app có login | N/A | N/A |
| **Refresh Token Rotation** | Luôn — chống Replay Attack | N/A | N/A |
| **Bcrypt + RBAC** | Luôn | N/A | N/A |
| **Bucket4j (Rate Limiting)** | Khi có public endpoint | App nội bộ không public | Nginx rate limit |
| **Apache Tika (Magic Bytes)** | Khi nhận file upload từ người dùng | App không có upload | Kiểm tra MIME type đơn giản |
| **Cloudinary** | Khi cần lưu media trên cloud | App không có media | AWS S3 / MinIO |
| **Resend API** | Khi cần gửi email xác thực | App không có email | Nodemailer / SES |
| **Lombok + MapStruct** | Luôn — giảm boilerplate | N/A | N/A |
| **ArchUnit + Checkstyle** | Luôn — chạy lúc build, không tốn runtime | N/A | N/A |
| **React 19 + Vite + TypeScript** | Luôn — nền tảng Frontend | N/A | N/A |
| **Tailwind CSS v4 + shadcn/ui** | Luôn | N/A | N/A |
| **Zod + TanStack Query** | Luôn — validate + server state | N/A | N/A |
| **Axios + Mutex Interceptor** | Luôn — Silent Refresh Token | N/A | N/A |
| **Docker Compose** | Luôn — môi trường local nhất quán | N/A | Kubernetes (khi > 5.000 users) |

---

### ❌ LOẠI BỎ (Hiện tại chưa cần)

| Công nghệ | Lý do loại bỏ | Trigger để quay lại | Integrate lại như thế nào |
|:---|:---|:---|:---|
| **Neo4j** | Ngốn 512MB–1GB RAM riêng. Data quan hệ bạn bè của < 1.000 người không đủ lớn để cần Graph DB | Khi > 5.000 users + tính năng gợi ý bạn bè phức tạp | Thêm `spring-data-neo4j` vào `pom.xml`, đồng bộ `userId` từ MongoDB sang Neo4j qua `@EventListener` (ApplicationEvent) |
| **ElasticSearch** | Tốn 1–2GB RAM. MongoDB Text Index đủ dùng đến 500k bản ghi | Khi search < 500ms không đạt với MongoDB | Dùng Debezium (CDC) đồng bộ MongoDB → ES tự động, không cần sửa code nghiệp vụ |
| **Kafka / RabbitMQ** | Quá phức tạp. Không có use case thực tế ở < 1.000 users | Khi tác vụ nền (gửi mail, notification) làm chậm API > 200ms | Thêm `spring-kafka` dependency, convert `@Async` method thành Kafka Producer/Consumer — interface không đổi |
| **Redis Pub/Sub** | Chỉ cần khi chạy 2+ instance server song song | Khi deploy multi-instance (thường > 3.000 concurrent) | Enable Redis Pub/Sub trong `WebSocketConfig` — 1 dòng config |
| **Prometheus + Grafana** | Cần dựng thêm 2 container nặng. Dashboard Render/Railway là đủ | Khi cần alert tự động và metric lịch sử > 30 ngày | Thêm `micrometer-prometheus` dependency, expose `/actuator/prometheus` endpoint |
| **K6 Load Testing** | Chưa cần đến Production scale | Trước mỗi lần deploy lên môi trường > 500 users | Viết script `k6 run script.js` — không ảnh hưởng code |

---

### 🔜 DỰ KIẾN DÙNG TRONG TƯƠNG LAI

| Công nghệ | Trigger khi nào thêm | Phase |
|:---|:---|:---:|
| **browser-image-compression** | Ngay Sprint 2.2 — trước khi có người dùng thật | 1 |
| **Sentry (Free Tier)** | Ngay khi deploy Production | 1 |
| **Spring WebSocket + STOMP** | Khi làm tính năng Chat (Phase 3) | 2 |
| **Spring `@Async` + `@EnableAsync`** | Khi có tác vụ nền (gửi mail, notification push) | 2 |
| **JUnit 5 + Testcontainers** | Trước khi deploy lần đầu | 1–2 |
| **GitHub Actions CI/CD** | Khi code base ổn định, commit thường xuyên | 2 |
| **Playwright E2E** | Khi có đủ tính năng core | 2–3 |
| **Neo4j** | Khi > 5.000 users, tính năng gợi ý bạn bè | 3 |
| **ElasticSearch** | Khi search MongoDB > 500ms | 3 |
| **Kafka** | Khi notification/email làm chậm API | 3 |
| **Redis Pub/Sub** | Khi cần chạy 2+ server Backend song song | 3 |
| **Prometheus + Grafana** | Khi cần alert tự động | 3 |
| **Google Gemini API** | Khi thêm tính năng AI (tóm tắt, sentiment) | 3+ |

---

## PHẦN 2: KIẾN TRÚC THEO TỪNG PHASE SCALE

### 🟢 Phase 1 — ~100–200 Users (5–30 Concurrent)

**Mục tiêu:** Hoàn thiện tính năng, không tốn tiền, deploy nhanh.

**Kiến trúc đề xuất:**
```
[Browser / Mobile]
       │
       ▼
[Nginx Reverse Proxy]  ← SSL Termination
       │
       ▼
[Spring Boot App]  ← 1 instance duy nhất
       │
   ┌───┴───┐
   ▼       ▼
[MongoDB] [Redis]
```

**Cấu hình server:**
```
VPS: 1 CPU / 2GB RAM (~$10-12/tháng)
OS: Ubuntu 22.04 LTS
Triển khai: Docker Compose
```

**Công nghệ CẦN thêm vào:**
- `browser-image-compression` (Frontend)
- `Sentry` Free Tier (Error tracking)
- Compound Index MongoDB (`authorId + createdAt`)
- JVM Heap: `-Xms256m -Xmx768m -XX:+UseG1GC`

**Công nghệ NÊN TRÁNH:**
- Neo4j, ElasticSearch, Kafka, Redis Pub/Sub
- Load Balancer — 1 server là đủ

---

### 🟡 Phase 2 — ~500–1000 Users (50–150 Concurrent)

**Mục tiêu:** Hệ thống ổn định, có Chat Realtime, tự động hóa CI/CD.

**Kiến trúc đề xuất:**
```
[Browser / Mobile]
       │
       ▼
[Nginx]  ← SSL + Gzip + Static File Serving
       │
       ▼
[Spring Boot App]  ← 1 instance, tăng RAM
       │
   ┌───┼───────┐
   ▼   ▼       ▼
[MongoDB] [Redis] [WebSocket Session Map]
```

**Cấu hình server:**
```
VPS: 2 CPU / 4GB RAM (~$20-24/tháng)
JVM: -Xms512m -Xmx2048m
MongoDB: Tách riêng hoặc dùng MongoDB Atlas M10 (~$57/tháng)
```

**Công nghệ CẦN thêm vào:**
- `Spring WebSocket + STOMP` (Chat Phase 3)
- `Spring @Async + @EnableAsync` (tác vụ nền)
- `GitHub Actions` (CI/CD tự động)
- `JUnit 5 + Testcontainers` (Integration Test)
- `MongoDB Atlas` hoặc replica set local (High Availability)

**Công nghệ NÊN TRÁNH:**
- Redis Pub/Sub (chỉ 1 server → không cần)
- Kafka (Spring @Async là đủ)
- Neo4j (MongoDB Aggregation vẫn < 20ms)
- Kubernetes (quá nặng cho quy mô này)

**Bottleneck cần monitor:**
- MongoDB Slow Query Log (> 100ms)
- JVM Heap Usage > 80% → tăng RAM hoặc tối ưu query
- Cloudinary bandwidth (nếu chưa nén ảnh)

---

### 🔴 Phase 3 — >5000 Users (500+ Concurrent)

**Mục tiêu:** High Availability, tự động scale, không downtime.

**Kiến trúc đề xuất:**
```
[CDN — Cloudflare]
       │
       ▼
[Load Balancer — Nginx / HAProxy]
       │
   ┌───┴────┐
   ▼        ▼
[Spring Boot  [Spring Boot
  Instance 1]   Instance 2]  ← Horizontal Scale
       │
   ┌───┼───────────┐
   ▼   ▼           ▼
[MongoDB  [Redis    [Redis
 Replica   Cluster] Pub/Sub]
  Set]         │
               ▼
          [Kafka Cluster]
               │
         [ElasticSearch]
```

**Cấu hình server:**
```
Load Balancer:   1 CPU / 1GB RAM
Spring Boot x2:  2 CPU / 4GB RAM mỗi instance
MongoDB:         Atlas M30 hoặc Replica Set 3 nodes
Redis:           Redis Sentinel hoặc Redis Cluster
Kafka:           3-broker cluster (hoặc Confluent Cloud)
```

**Công nghệ CẦN thêm vào theo thứ tự:**
1. `Redis Pub/Sub` → Đồng bộ WebSocket session giữa 2 instance
2. `Load Balancer` (Nginx upstream) → Phân tải 2 Spring Boot
3. `MongoDB Replica Set` → High Availability, không mất data
4. `Kafka` → Tách notification/email ra khỏi luồng API chính
5. `ElasticSearch` → Nếu search MongoDB > 500ms
6. `Neo4j` → Nếu cần gợi ý bạn bè phức tạp
7. `Prometheus + Grafana` → Alert tự động
8. `K6` → Load test trước mỗi release lớn

---

## PHẦN 3: UPGRADE PATH — KHÔNG CẦN REWRITE

> **Nguyên tắc cốt lõi:** Clean Architecture hiện tại của dự án cho phép upgrade từng lớp **độc lập** mà không ảnh hưởng lớp khác. Đây là lý do quan trọng nhất để đầu tư vào kiến trúc ngay từ đầu.

### Bảng Upgrade Path chi tiết

| Bước | Khi nào | Hành động | Thời gian ước tính | Rủi ro |
|:---|:---|:---|:---:|:---:|
| **Step 0** | Ngay bây giờ | Thêm `browser-image-compression` + Sentry + MongoDB Index + JVM Heap config | 1–2 ngày | 🟢 Thấp |
| **Step 1** | Khi deploy Production lần đầu | Dựng Nginx Reverse Proxy + SSL (Let's Encrypt) trước Spring Boot | 0.5 ngày | 🟢 Thấp |
| **Step 2** | Khi làm Phase 3 (Chat) | Thêm Spring WebSocket + STOMP vào module `chat` mới — không đụng code hiện tại | 1–2 tuần | 🟢 Thấp |
| **Step 3** | Khi có tác vụ nền chậm API | Thêm `@Async` + `@EnableAsync` — chỉ thêm annotation vào Service method hiện tại | 1 ngày | 🟢 Thấp |
| **Step 4** | Khi concurrent > 150 | Nâng VPS từ 2GB → 4GB RAM, tăng JVM heap | 30 phút | 🟢 Thấp |
| **Step 5** | Khi cần 2 instance Spring Boot | Enable Redis Pub/Sub trong `WebSocketConfig` — 5 dòng config | 1 ngày | 🟡 Trung bình |
| **Step 6** | Khi MongoDB là single point of failure | Migrate sang MongoDB Atlas hoặc dựng Replica Set 3 nodes | 1–2 ngày | 🟡 Trung bình |
| **Step 7** | Khi notification làm chậm API | Thêm Kafka dependency, wrap `@Async` method thành Kafka Producer — interface không đổi nhờ Clean Architecture | 1–2 tuần | 🟡 Trung bình |
| **Step 8** | Khi MongoDB search > 500ms | Thêm ElasticSearch + Debezium CDC sync — không cần sửa Repository interface | 2–3 tuần | 🔴 Cao |
| **Step 9** | Khi gợi ý bạn bè phức tạp | Thêm Neo4j + `@EventListener` sync userId — module riêng biệt | 2–3 tuần | 🟡 Trung bình |

---

## PHẦN 4: NGUYÊN TẮC THIẾT KẾ — TRÁNH OVER-ENGINEERING NHƯNG DỄ SCALE

### ✅ Đã làm đúng (Strengths)

- **Interface-driven Design:** Mọi Repository đều là Interface ở Domain layer → swap implementation (MongoDB → PostgreSQL) không cần sửa business logic
- **Shared Module:** `MediaService`, `CloudinaryService` ở `shared` package → các module khác dùng chung mà không coupling
- **ArchUnit Guard:** Tự động phát hiện vi phạm layer → không phát sinh nợ kỹ thuật khi thêm developer mới
- **Stateless JWT:** Không có server-side session → horizontal scale chỉ cần thêm instance, không cần sticky session

### ⚠️ Cần làm thêm (Gaps)

| Gap | Giải pháp | Độ ưu tiên |
|:---|:---|:---:|
| Chưa có Health Check endpoint | Thêm `/actuator/health` (Spring Actuator) | 🔴 Cao |
| Chưa có Graceful Shutdown | Cấu hình `server.shutdown=graceful` trong `application.yml` | 🟡 Trung bình |
| Chưa có Connection Pool config | Cấu hình `MongoClientSettings` với max pool size | 🟡 Trung bình |
| Chưa có Retry mechanism | Thêm `Spring Retry` cho các external API call (Cloudinary, Resend) | 🟡 Trung bình |
| Chưa có Circuit Breaker | Thêm Resilience4j khi có nhiều external service | 🟢 Thấp (Phase 3) |

### 🏁 Quy tắc vàng của Architect

```
1. Chỉ thêm công nghệ khi CÓ VẤN ĐỀ ĐO ĐƯỢC — không thêm "phòng khi cần"
2. Mỗi công nghệ mới = thêm chi phí vận hành, debug, learning curve
3. Ưu tiên: Code đúng → Test đủ → Deploy ổn → RỒỚI scale
4. Clean Architecture là đầu tư tốt nhất — cho phép thay thế từng component riêng lẻ
5. "Premature optimization is the root of all evil" — Donald Knuth
```

---

> **📌 Kết luận của System Architect:**
>
> Kiến trúc MiniFaceBook hiện tại đã đặt nền móng **đúng hướng** để scale không cần rewrite.
> Clean Architecture + Interface-driven + Stateless JWT là bộ ba quyết định đúng nhất.
>
> **Lộ trình tối ưu:** Step 0 → Step 1 → Step 2 (Chat) → đánh giá metric thực tế → quyết định Step tiếp theo.  
> Không bao giờ skip thẳng lên Step 7–9 khi chưa có bằng chứng về bottleneck thực tế.
