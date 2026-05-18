# Spring Boot Mastery Skill (Modular Clean Architecture)

Kỹ năng này định nghĩa các quy chuẩn Senior cho việc phát triển Backend bằng Spring Boot 3.x và Java 21.

## 🏗️ Kiến trúc & Cấu trúc (Modular Clean Architecture)
Mỗi Module phải được chia thành 4 lớp rõ rệt:

1. **Domain Layer (`domain/`)**:
   - Chứa: `Entities`, `Value Objects`, `Domain Services`, `Repository Interfaces`.
   - **Quy tắc**: Tuyệt đối không phụ thuộc vào bất kỳ thư viện bên ngoài nào (kể cả Spring).
2. **Application Layer (`application/`)**:
   - Chứa: `Use Cases`, `Service Implementation`, `Input/Output Ports`.
   - **Quy tắc**: Chỉ phụ thuộc vào Domain Layer.
3. **Infrastructure Layer (`infrastructure/`)**:
   - Chứa: `Persistence (Spring Data MongoDB/Neo4j)`, `External API Clients`, `Configurations`.
4. **Presentation Layer (`presentation/`)**:
   - Chứa: `REST Controllers`, `DTOs`, `Mappers`.

## 🛡️ Senior Coding Standards

- **Boilerplate**: Sử dụng **Lombok** (`@Data`, `@Builder`, `@RequiredArgsConstructor`) để code ngắn gọn.
- **Mapping**: Sử dụng **MapStruct** cho mọi việc chuyển đổi Entity <-> DTO. Không viết code mapping thủ công.
- **Validation**: Sử dụng **Jakarta Bean Validation** (@Valid) tại lớp Controller và `@Validated` tại Service nếu cần.
- **Dependency Injection**: Luôn dùng **Constructor Injection**. Tuyệt đối không dùng `@Autowired` trên field.
- **Error Handling**: Sử dụng `@RestControllerAdvice` để bắt lỗi toàn cục và trả về format JSON đồng nhất.
- **Governance**: Sử dụng **ArchUnit** để viết unit test kiểm tra việc vi phạm cấu trúc giữa các lớp.

## 🧪 Testing Strategy
- **Unit Test**: JUnit 5 + Mockito cho lớp Domain và Application.
- **Integration Test**: Spring Boot Test + **Testcontainers** để chạy trên DB thật (Docker).
- **Architecture Test**: ArchUnit để đảm bảo Clean Architecture không bị phá vỡ.

## ⚡ Performance (Java 21)
- Tận dụng **Virtual Threads** cho các tác vụ I/O nặng (như Chat Realtime) để tối ưu throughput.

---

## ⚠️ MANDATORY POST-TASK WORKFLOW (QUY TRÌNH BẮT BUỘC)
Sau khi hoàn thành bất kỳ thay đổi code nào, AI **PHẢI** thực hiện các bước sau trước khi báo cáo kết quả:

1. **Verify:** Chạy `ArchitectureTest.java` để đảm bảo không vi phạm Clean Architecture.
2. **Document:** 
    - Cập nhật `docs/PROGRESS.md` (Ghi lại logic kỹ thuật).
    - Cập nhật `docs/ROADMAP.md` (Đánh dấu tiến độ).
3. **Context Handoff:** Nếu là task cuối của phiên, phải cập nhật `docs/SESSION_HANDOFF.md`.
4. **Consistency Check:** Đảm bảo `docs/SYSTEM_DESIGN.md` phản ánh đúng các thay đổi hạ tầng (Port, DB, Security).

**TUYỆT ĐỐI KHÔNG ĐỂ USER PHẢI NHẮC VIỆC CẬP NHẬT TÀI LIỆU.**
