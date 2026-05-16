# 📈 TIẾN ĐỘ DỰ ÁN (PROJECT PROGRESS)

*Tài liệu này ghi chú lại chi tiết những thành quả đã đạt được sau mỗi Phase, giải thích rõ công dụng, lợi ích và lý do của những quyết định kiến trúc trong hệ thống Mini FaceBook.*

---

## 🚀 PHASE 0: FOUNDATION & INFRASTRUCTURE (ĐANG TRIỂN KHAI 🏗️ - PIVOT TO SPRING BOOT)
**Đánh giá tổng quan:** Dự án đã thực hiện bước chuyển mình (Pivot) quan trọng sang **Spring Boot 3.x (Java 21)**. Quyết định này nhằm tận dụng sức mạnh của hệ sinh thái Java Enterprise và áp dụng **Modular Clean Architecture** để đảm bảo tính bền vững và khả năng mở rộng tối đa.

### 🏆 Các tính năng & Kiến trúc đang thiết lập:

#### 1. Modular Clean Architecture (Chuẩn Senior Java)
- **Đã làm:** Định nghĩa cấu trúc dự án chia theo 4 lớp (Domain, Application, Infrastructure, Presentation).
  - 📁 Package Domain: `domain/` (Chứa Entities, Interfaces)
  - 📁 Package Application: `application/` (Chứa Use Cases, Services)
  - 📁 Package Infrastructure: `infrastructure/` (Chứa Persistence, Config)
  - 📁 Package Presentation: `presentation/` (Chứa Controllers, DTOs)
- **Giúp ích gì?** 
  - Đảm bảo tính "Độc lập": Logic nghiệp vụ không bị dính chặt vào Framework hay Database.
  - Dễ bảo trì và Test: Mỗi lớp có một nhiệm vụ riêng biệt, giảm thiểu rủi ro khi thay đổi code.

#### 2. Jakarta Bean Validation (Dữ liệu sạch)
- **Đã làm:** Sử dụng `@Valid` và các Annotation chuẩn như `@NotNull`, `@Size`, `@Email`.
- **Giúp ích gì?**
  - **Chặn dữ liệu rác:** Tự động loại bỏ các request không hợp lệ ngay từ tầng Controller.
  - **Trải nghiệm Frontend tốt:** Trả về mã lỗi 400 kèm thông tin chi tiết các trường bị lỗi để Frontend hiển thị thông báo.

#### 3. Tập trung xử lý lỗi với `@RestControllerAdvice`
- **Đã làm:** Thiết lập bộ xử lý lỗi tập trung để bắt trọn mọi Exception toàn hệ thống.
- **Giúp ích gì?**
  - **Đồng nhất:** Mọi lỗi (400, 401, 403, 500) đều trả về một format JSON duy nhất: `{ "timestamp", "status", "error", "message", "path" }`.
  - **Bảo mật:** Giấu đi các chi tiết lỗi nhạy cảm của Server khi xảy ra lỗi 500, bảo vệ cấu trúc hệ thống khỏi hacker.

#### 4. Ghi Log chuyên nghiệp với `SLF4J + Logback`
- **Đã làm:** Cấu hình logging mặc định của Spring Boot.
- **Giúp ích gì?**
  - Giúp theo dõi "sức khỏe" hệ thống 24/7. Mọi hành động gọi API hay lỗi phát sinh đều được lưu lại để debug dễ dàng hơn.

#### 5. Rate Limiting với `Bucket4j` (Chống Spam/DDoS)
- **Đã làm:** Tích hợp bộ lọc giới hạn tần suất request cho từng địa chỉ IP.
- **Giúp ích gì?**
  - Ngăn chặn bot spam tin nhắn hoặc tạo hàng loạt tài khoản ảo làm sập Database.

#### 6. Tài liệu hóa API với `SpringDoc OpenAPI (Swagger)`
- **Đã làm:** Cấu hình Swagger UI để tự động tạo tài liệu từ code.
  - 📁 Endpoint tài liệu: `http://localhost:8080/api/docs`
- **Giúp ích gì?**
  - Giúp Team Frontend nắm bắt nhanh các Endpoint mà không cần trao đổi thủ công, tăng tốc độ phát triển cực nhanh.

---

## 🛠️ CHIẾN LƯỢC CÔNG NGHỆ BỔ SUNG (STRATEGIC CHOICES)
*Dự án tích hợp các công cụ "Power-ups" để đạt chuẩn Senior 10 năm kinh nghiệm:*

#### 1. Lombok & MapStruct
- **Lý do:** Java truyền thống rất rườm rà. Lombok giúp xóa bỏ code thừa (Getter/Setter), còn MapStruct giúp tự động chuyển đổi Entity <-> DTO.
- **Lợi ích:** Code cực kỳ ngắn gọn, dễ đọc và hiệu năng cao.

#### 2. ArchUnit (Architecture Governance)
- **Lý do:** Con người có thể sai lầm khi code, phá vỡ quy tắc Clean Architecture.
- **Lợi ích:** Viết unit test để kiểm tra chính cấu trúc code, đảm bảo dự án luôn "sạch" theo đúng thiết kế ban đầu.

#### 3. Testcontainers
- **Lý do:** Mocking đôi khi không phản ánh đúng thực tế Database.
- **Lợi ích:** Chạy Database thật (MongoDB/Neo4j) trong Docker khi chạy test, đảm bảo code chạy đúng 100% khi lên Production.

---

## ✅ TỔNG KẾT
Dự án đã hoàn tất việc chuyển đổi tư duy và hạ tầng sang **Spring Boot**. Mọi tài liệu và quy chuẩn đã được đồng bộ hóa. Chúng ta đã có một bệ phóng chuyên nghiệp nhất để bắt đầu code các tính năng thực tế.
