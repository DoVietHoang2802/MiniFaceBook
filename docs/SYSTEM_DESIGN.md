# System Design & Database

## 🧱 Database Schema (MongoDB)
- **Users:** `email` (unique), `password` (hashed), `avatar`, `bio`.
- **Messages:** `chatId` (index), `senderId`, `content`, `type`, `status` (sent/delivered/seen), `timestamp` (index).
- **Chats:** `members` (array of ID), `lastMessage` (Denormalized object), `updatedAt`.
- **Friends:** `requesterId`, `recipientId`, `status`, `unique_pair` (Compound Index).

## ⚙️ Backend Architecture
- **Modular Pattern:** Tách biệt `AuthModule`, `UsersModule`, `ChatsModule`.
- **Realtime Flow:** Frontend -> Socket Gateway -> Service -> DB -> Broadcast.
- **Security:**
  - `ThrottlerModule` chống brute-force.
  - `JwtAuthGuard` bảo vệ các route nhạy cảm.

## 📂 Project Structure
- `/src/modules`: Logic nghiệp vụ chính.
- `/src/common`: Guards, Interceptors, Filters, Decorators.
- `/src/shared`: CloudinaryService, MailService.
- `/src/configs`: Cấu hình hệ thống.