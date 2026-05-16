# 📘 Sổ tay lập trình & Quy chuẩn AI (Coding Guidelines)
*Tài liệu này là "Kim chỉ nam" duy nhất cho việc viết code trong dự án MiniFaceBook. Mọi AI và Developer phải tuân thủ tuyệt đối.*

---

## 🛠️ 1. Tech Stack & Công cụ sử dụng
*Để bạn không cần phải quay lại README để tra cứu:*

- **Backend:** Java 21 + Spring Boot 3.x + Modular Clean Architecture.
- **Realtime:** Spring WebFlux / WebSocket + **Redis Adapter**.
- **Database:** MongoDB (Spring Data) + Redis (Caching) + **Neo4j (Social Graph)**.
- **Search & Event:** **ElasticSearch** (Search) & **Kafka** (Messaging Broker).
- **Security:** Spring Security + **JWT + Refresh Token Rotation**.
- **Core Tools:** Lombok, MapStruct, ArchUnit, Bucket4j.
- **Frontend:** React + TypeScript + shadcn/ui + Tailwind + **Zod**.
- **Testing:** **JUnit 5**, **Mockito**, **Supertest** & **Testcontainers**.

---

## 🛡️ 2. Quy tắc Bảo mật & Dữ liệu (Bắt buộc)
- **Tuyệt mật:** Không bao giờ trả về mật khẩu người dùng trong API. Luôn dùng `.select('-password')` trong Mongoose.
- **Xác thực:** Access Token ngắn hạn, Refresh Token dài hạn lưu trong HttpOnly Cookie qua Spring Security Filters.
- **Validation:** Mọi dữ liệu đầu vào (Request Body/Query) PHẢI qua **DTO** với **Jakarta Bean Validation** (@Valid, @NotNull, @Email...).
- **Environment:** Bắt buộc sử dụng `@ConfigurationProperties` và **Bean Validation** để validate file `.env` hoặc `application.yml` khi khởi động. Nếu thiếu biến quan trọng, server phải dừng ngay lập tức.


---

## 🏗️ 3. Quy chuẩn viết code (Senior Standard)
- **Modular Clean Architecture:** Tuân thủ tuyệt đối 4 lớp: `Domain`, `Application`, `Infrastructure`, `Presentation`.
- **Mapping:** Sử dụng **MapStruct** để chuyển đổi giữa Entity và DTO. Tuyệt đối không trả về Entity trực tiếp ra API.
- **Boilerplate:** Sử dụng **Lombok** cho mọi Class (Entity, DTO, Service) để code sạch sẽ.
- **Architecture Governance:** Sử dụng **ArchUnit** để kiểm tra tính toàn vẹn của các lớp (ví dụ: cấm Domain phụ thuộc vào Infrastructure).
- **Error Handling:** Sử dụng `@RestControllerAdvice` và `@ExceptionHandler` để xử lý lỗi tập trung.
- **Logging:** Sử dụng **SLF4J + Logback**. Không sử dụng `System.out.println`.
- **Rate Limiting:** Sử dụng **Bucket4j** để chống spam request.
- **Database Migration:** Mọi thay đổi cấu trúc DB phải qua script Migration (ví dụ: `migrate-mongo` hoặc Liquibase cho SQL nếu có).


---

## 🔄 4. Quy trình cập nhật tự động (Mandatory Workflow)
*Sau khi xong mỗi Task, AI phải tự thực hiện:*
1. Cập nhật **PROGRESS.md**: Ghi rõ "Đã làm gì? Tại sao?".
2. Cập nhật **ROADMAP.md**: Đánh dấu [x] hoàn thành.
3. Kiểm tra tính đồng bộ giữa các file tài liệu.
4. **Cập nhật Internal Skills:** Nếu trong task có kiến thức mới hoặc quy chuẩn mới cần lưu lại cho module tương ứng.
5. Báo cáo danh sách file đã cập nhật cho người dùng.

---

## 💡 Triết lý thực thi
> **"Thà làm ít mà chất lượng điểm 10, còn hơn làm nhiều mà lỗi điểm 5."** 
> Luôn ưu tiên bảo mật và sự ổn định của hệ thống lên hàng đầu.