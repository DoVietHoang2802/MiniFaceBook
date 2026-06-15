✅ PROMPT BUILD COMMENT SYSTEM (FACEBOOK-STYLE REAL UI)

Bạn là một Senior Frontend Engineer + UI/UX Designer cấp cao, nhiệm vụ của bạn là thiết kế và implement hệ thống Comment Box + Comment Thread giống Facebook (production-level UX) cho dự án social network MiniFaceBook.

🎯 Mục tiêu

Xây dựng hệ thống bình luận có trải nghiệm giống Facebook thật:

Mượt
Tối ưu UX
Có nested comment (reply)
Realtime-friendly
UI sạch, hiện đại
🧩 1. COMMENT INPUT (KHUNG NHẬP BÌNH LUẬN)

Thiết kế giống Facebook:

Avatar user nằm bên trái (hình tròn)
Bên phải là input dạng auto-resize textarea
Placeholder: "Write a comment..."
Bo góc mềm (rounded-full / rounded-xl style)
Khi focus:
viền highlight nhẹ (blue/primary)
shadow nhẹ
🎛️ Features bắt buộc:
Enter → gửi comment
Shift + Enter → xuống dòng
Auto expand height theo nội dung (max 5–6 dòng rồi scroll)
Có icon inside input:
📷 Upload image
😀 Emoji picker
Button Send chỉ active khi có content
🧵 2. COMMENT LIST (DANH SÁCH BÌNH LUẬN)

Hiển thị danh sách bình luận (Hiện tại là **Cấp 1 - Flat List** khớp với Backend schema):

Comment item gồm:
Avatar user
Name (bold)
Content text
Timestamp (e.g. "2h", "Just now")
Actions:
Like (Đang phát triển)
Reply (Đang phát triển)
More (···)
UI rules:
Comment container padding nhẹ
Hover highlight background nhẹ

🔁 3. REPLY SYSTEM & REALTIME (FUTURE PHASES)
*Lưu ý: Backend hiện tại (`CommentDocument`) chưa có trường `parentId` và hạ tầng WebSocket chưa được cấu hình. Tính năng Nested Reply và Realtime sẽ được cập nhật ở Phase 3.*
Tuy nhiên UI có thể để sẵn:
Click "Reply" → mở input inline (sẽ kích hoạt khi có API)
Comment realtime bằng WebSocket (sẽ kích hoạt ở Phase 3)

⚡ 4. UX GIỐNG FACEBOOK REAL
Optimistic UI (comment gửi lên hiển thị ngay trên UI trước khi server trả về)
Loading nhẹ khi gửi comment
Smooth animation khi thêm comment (fade + slide)
Auto scroll to new comment nếu ở cuối feed
🧠 5. TECH REQUIREMENTS
React + TypeScript
TailwindCSS (hoặc CSS module)
Component-based architecture:
CommentBox
CommentList
CommentItem
ReplyInput
State management:
useState / useReducer (hoặc Redux nếu cần)
Clean code, dễ mở rộng
🚀 OUTPUT EXPECTED

Hãy trả về:

UI component structure
Code React implementation
UX behavior explanation ngắn gọn
Best practices để scale lên hệ thống lớn (10k+ comments/post)
💡 BONUS (IMPORTANT)

UI phải đạt cảm giác:
👉 “Facebook nhưng hiện đại hơn một chút (2026 style)”
không được làm kiểu basic CRUD comment UI.

Nếu bạn muốn, mình có thể nâng cấp tiếp cho bạn lên level cao hơn nữa:

Comment realtime bằng WebSocket
Like animation kiểu Facebook
Infinite nested comments (graph structure)
Cache + pagination tối ưu backend

Chỉ cần nói: “nâng cấp hệ comment pro level” 👍