# AI Assistant Guidelines

*Tài liệu này dùng để cung cấp Context cho AI khi hỗ trợ code.*

## 🛠 Coding Standards
1. **Language:** Luôn sử dụng TypeScript.
2. **Framework:** NestJS Modular Architecture.
3. **Database:** Sử dụng `@nestjs/mongoose` và Mongoose Schema.
4. **Validation:** Sử dụng DTO + `class-validator` + `ValidationPipe` toàn cục.
5. **Logic:** Business logic phải nằm ở Service, Controller chỉ điều phối.

## 🔐 Security Rules
- Luôn sử dụng `Passport JWT` cho xác thực.
- Sử dụng `@GetUser()` custom decorator để lấy user từ request.
- Validate đầu vào Frontend bằng **Zod** đồng bộ với Backend DTO.

## 🚀 Workflow nhắc nhở
- Khi viết Gateway cho Socket.IO, phải sử dụng `WBSocket Guard` để verify token.
- Luôn xử lý lỗi qua `Global Exception Filter`.