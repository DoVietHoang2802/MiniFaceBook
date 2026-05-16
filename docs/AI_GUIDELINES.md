# 📘 Sổ tay lập trình & Quy chuẩn AI (Coding Guidelines)
*Tài liệu này là "Kim chỉ nam" duy nhất cho việc viết code trong dự án MiniFaceBook. Mọi AI và Developer phải tuân thủ tuyệt đối.*

---

## 🛠️ 1. Tech Stack & Công cụ sử dụng
*Để bạn không cần phải quay lại README để tra cứu:*

- **Backend:** NestJS (TypeScript) + Modular Architecture.
- **Realtime:** Socket.IO + **Redis Adapter** (Bắt buộc để scale).
- **Database:** MongoDB (Mongoose) + Redis (Caching) + **Neo4j (Social Graph)**.
- **Search & Event:** **ElasticSearch** (Search) & **Kafka** (Messaging Broker).
- **Security:** Passport JWT + **Refresh Token Rotation** + HttpOnly Cookies.
- **Frontend:** React + shadcn/ui + Tailwind + **Zod** + **TanStack Query**.
- **Testing:** **Jest** (Unit Test), **Supertest** (Integration Test - gọi thẳng vào DB thật) & **Playwright** (E2E Test).

---

## 🛡️ 2. Quy tắc Bảo mật & Dữ liệu (Bắt buộc)
- **Tuyệt mật:** Không bao giờ trả về mật khẩu người dùng trong API. Luôn dùng `.select('-password')` trong Mongoose.
- **Xác thực:** Access Token ngắn hạn, Refresh Token dài hạn lưu trong HttpOnly Cookie.
- **Validation:** Mọi dữ liệu đầu vào (Request Body/Query) PHẢI qua **DTO** với class-validator.
- **Zod:** Sử dụng Zod để định nghĩa schema chung cho cả Backend và Frontend để đảm bảo Type-Safety tuyệt đối.
- **Environment:** Bắt buộc sử dụng **Joi** trong `ConfigModule` để validate toàn bộ file `.env` khi khởi động. Nếu thiếu biến quan trọng (như `JWT_SECRET`, `NEO4J_URI`), server phải văng lỗi và dừng chạy ngay lập tức, tuyệt đối không chạy tiếp.


---

## 🏗️ 3. Quy chuẩn viết code (Senior Standard)
- **Modular:** Mỗi tính năng (Auth, Users, Chats) phải là một Module riêng biệt.
- **Swagger:** Mọi Endpoint phải có `@ApiTags()`, `@ApiOperation()` và mô tả dữ liệu rõ ràng.
- **Realtime:** Mọi logic Chat phải dùng **Room-based**, không gửi tin nhắn trực tiếp qua Socket ID cá nhân.
- **Error Handling:** Luôn dùng `GlobalExceptionFilter` và ghi log lỗi qua **Winston**.
- **Frontend:** Ưu tiên dùng **TanStack Query** để gọi API, cấm dùng `useEffect` tràn lan để fetch dữ liệu.
- **Database Migration:** Không bao giờ tạo bảng hoặc sửa cấu trúc Database thủ công. Mọi thay đổi về cấu trúc của MongoDB và Neo4j phải được quản lý thông qua script Migration (ví dụ: `migrate-mongo`).


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