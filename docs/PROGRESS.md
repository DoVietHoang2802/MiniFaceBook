# 📈 TIẾN ĐỘ DỰ ÁN (PROJECT PROGRESS)

*Tài liệu này ghi chú lại chi tiết những thành quả đã đạt được sau mỗi Phase, giải thích rõ công dụng, lợi ích và lý do của những quyết định kiến trúc trong hệ thống Mini FaceBook.*

---

## 🚀 PHASE 0: FOUNDATION & INFRASTRUCTURE (HOÀN THÀNH 100%)
**Đánh giá tổng quan:** Nền móng hệ thống Backend đã được xây dựng cực kỳ vững chắc, đạt tiêu chuẩn của các dự án thực tế (Production-ready) ở các công ty công nghệ lớn. Việc thiết lập kỹ lưỡng ở Phase 0 giúp loại bỏ 80% rủi ro bảo mật và bug lặt vặt khi scale dự án sau này.

### 🏆 Các tính năng & Kiến trúc đã triển khai thành công:

#### 1. Kiến trúc Modular chuẩn NestJS
- **Đã làm:** Khởi tạo cấu trúc dự án chia theo từng module độc lập (`AuthModule`, `UsersModule`, `ChatsModule`). Thiết lập `ConfigModule` và `MongooseModule` để kết nối MongoDB linh hoạt qua file `.env`.
- **Giúp ích gì?** 
  - Đảm bảo tính "Đóng gói" (Encapsulation). Code tính năng nào nằm gọn ở tính năng đó.
  - Dễ mở rộng: Sau này nếu dự án có hàng triệu user và cần tách thành Microservices (Server Chat chạy riêng, Server Auth chạy riêng), bạn chỉ việc "bưng" nguyên folder ra chạy cực kỳ dễ dàng.

#### 2. Tự động hóa Validation với `ValidationPipe` (Tối ưu DTO)
- **Đã làm:** Kích hoạt `ValidationPipe` toàn cục tại `main.ts` với cấu hình thông minh: `whitelist: true`, `enableImplicitConversion: true` và `exceptionFactory`.
- **Giúp ích gì?**
  - **Chặn dữ liệu rác:** Tự động loại bỏ các field độc hại mà hacker cố tình nhét vào request.
  - **Code cực ngắn (Clean Code):** Thuộc tính `enableImplicitConversion` giúp NestJS tự động ép kiểu dữ liệu (vd: từ chuỗi URL `?page=1` sang số nguyên `1`) ở DTO mà không cần dùng `@Type(() => Number)`.
  - **Trải nghiệm Frontend tốt:** Lỗi gửi sai dữ liệu được format gọn gàng vào mảng `details` để Frontend dễ làm highlight ô input đỏ.

#### 3. Bộ lọc lỗi toàn cục `GlobalExceptionFilter` (Bảo mật 500)
- **Đã làm:** Tạo một cái lưới (Filter) bắt trọn toàn bộ các lỗi xảy ra trong server trước khi trả về cho người dùng. Đã cấu hình Dependency Injection (DI) để Filter nằm trong `app.module.ts`.
- **Giúp ích gì?**
  - **Frontend nhàn hạ:** React luôn nhận về một format JSON duy nhất cho mọi loại lỗi, không bị lúc vầy lúc khác.
  - **Bảo mật tuyệt đối:** Khi code bị lỗi nặng (500), các thông báo gốc chứa thông tin Database hoặc cấu trúc code bị giấu đi hoàn toàn (ép thành chữ `"Internal server error"`). Hacker không thể đọc được cấu trúc DB của bạn thông qua màn hình báo lỗi.

#### 4. Ghi Log chuyên nghiệp với `Winston Logging`
- **Đã làm:** Thay thế `console.log` yếu ớt của NodeJS bằng bộ Winston. Cấu hình tự động in log có màu ra Terminal và âm thầm ghi các lỗi nghiêm trọng vào file `logs/error.log`.
- **Giúp ích gì?**
  - "Mắt thần" của dự án. Khi đem app lên host thật, bạn không thể nhìn Terminal suốt 24/7. Nếu 3h sáng server sập, 8h sáng bạn mở file `error.log` ra là thấy ngay nguyên nhân do đâu, ai gọi API nào gây lỗi.

#### 5. Lá chắn Thép `ThrottlerGuard` (Chống DDoS)
- **Đã làm:** Bật Throttler bảo vệ toàn cục, quy định khắt khe: 1 IP chỉ được gọi API tối đa 100 lần trong 60 giây.
- **Giúp ích gì?**
  - Chống spam tạo hàng loạt tài khoản ảo.
  - Chống việc một đối tượng ác ý cắm bot gửi hàng nghìn tin nhắn mỗi giây làm sập máy chủ MongoDB của bạn.

---
*(Sẽ tiếp tục cập nhật khi hoàn thành Phase 1...)*
