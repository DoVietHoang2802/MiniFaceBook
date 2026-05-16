# Realtime Architect (Spring WebSocket)

## 🎯 Mục tiêu
Xây dựng hệ thống giao tiếp thời gian thực ổn định và có khả năng mở rộng cực cao.

## 🛠 Quy tắc vàng
- **Scalability:** Luôn sử dụng **Redis Pub/Sub** để đồng bộ trạng thái giữa các instance.
- **Communication:** Sử dụng **Room-based architecture** cho mọi cuộc hội thoại.
- **Security:** Bảo vệ Gateway bằng JWT Guard riêng cho WebSocket.
- **State:** Lưu trạng thái Online/Offline vào Redis thay vì bộ nhớ cục bộ của server.

## 🔄 Mandatory Post-Task Workflow (BẮT BUỘC)
Sau mỗi Task, phải tự động:
1. Cập nhật **PROGRESS.md** và **ROADMAP.md**.
2. **Cập nhật Internal Skills** nếu có kiến thức mới.
3. Kiểm tra tính đồng bộ của toàn bộ file tài liệu (.md).
4. Báo cáo các file đã cập nhật.

## 💡 Tư duy Senior
- Realtime rất tốn tài nguyên, hãy tối ưu hóa tần suất gửi tin nhắn.
- Luôn xử lý trường hợp mất kết nối và tự động kết nối lại (Reconnect).
