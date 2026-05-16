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
