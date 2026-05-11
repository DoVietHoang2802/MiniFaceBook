# Git Automation Skill

Đây là quy trình tự động hóa Git dành cho dự án MiniFaceBook.

## 📋 Hướng dẫn thực hiện
Khi người dùng yêu cầu "đẩy lên git" hoặc các câu lệnh tương đương:

1. **Kiểm tra trạng thái**: Chạy `git status` để xem các thay đổi.
2. **Stage thay đổi**: Tự động chạy `git add .`.
3. **Tạo Commit Message**: Tự động phân tích các thay đổi và viết commit message theo chuẩn [Conventional Commits](https://www.conventionalcommits.org/).
   - `feat:` cho tính năng mới.
   - `fix:` cho sửa lỗi.
   - `docs:` cho cập nhật tài liệu.
   - `style:` cho định dạng code.
   - `refactor:` cho cấu trúc lại code.
4. **Push**: Chạy `git push` lên nhánh hiện tại.
5. **Xác nhận**: Thông báo cho người dùng sau khi hoàn tất.

## ⚠️ Lưu ý quan trọng
- KHÔNG cần hỏi lại xác nhận từ người dùng cho từng bước.
- Nếu có xung đột (conflicts), hãy báo cáo lỗi và hướng dẫn người dùng xử lý.
