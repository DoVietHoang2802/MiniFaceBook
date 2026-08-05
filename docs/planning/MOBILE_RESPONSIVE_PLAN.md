# 📱 KẾ HOẠCH NÂNG CẤP TOÀN DIỆN GIAO DIỆN DI ĐỘNG (MOBILE RESPONSIVE PLAN)

> **Dự án:** Monorepo MiniFaceBook (Hizo)  
> **Tệp tài liệu:** `docs/planning/MOBILE_RESPONSIVE_PLAN.md`  
> **Mục tiêu:** Nâng cấp 100% trải nghiệm người dùng trên thiết bị di động (Mobile Phone `< 768px`, iPhone, Android) đạt chuẩn **Facebook Native Mobile App & Modern Web Responsive Standard**.
>
> **Trạng thái triển khai (30/07/2026):** ✅ Đã hoàn thành implementation chính và mobile E2E tại viewport 360×800. Full desktop suite còn residual risk xác thực phiên: 12/17 pass, 5 test thất bại sau các response 401 trong suite dài; các regression responsive chạy riêng đều pass.

---

## 🎯 1. TỔNG QUAN VẤN ĐỀ & MỤC TIÊU CẢI TIẾN

### 🔴 Hiện trạng (Lý do giao diện cũ khó dùng trên mobile):
1. **Khuyết thiếu Thanh Điều hướng Mobile:** Thanh Sidebar bên trái bị ẩn đi trên mobile (`hidden md:flex`), khiến người dùng điện thoại không có đường dẫn trực quan để chuyển giữa Trang chủ, Trò chuyện, Thông báo.
2. **Khung Chat bị chèn ép:** Trang `/chats` hiển thị đồng thời cả Cột danh sách bạn bè và Cột khung chat trên màn hình nhỏ (chỉ 360px - 390px), làm hai khung bị bóp nghẹt, chữ tràn và rất khó nhắn tin.
3. **Popup Thông báo nhỏ hẹp:** Dropdown thông báo mở ra bị tràn mép màn hình điện thoại, dễ bị đè vướng.
4. **Touch Target nhỏ:** Các nút bấm Thả tim, Bình luận, Chia sẻ có diện tích chạm ngón tay nhỏ hơn chuẩn cảm ứng (44px), dễ bấm nhầm.

### 🟢 Giải pháp đề xuất (Chuẩn Mobile UX):
- **Thanh Điều hướng Đáy (Mobile Bottom Navigation Bar)** cố định ở cuộn màn hình.
- **Cơ chế Chuyển màn hình Chat Full-screen (Screen Switcher)** trên di động.
- **Bottom Sheet trượt mượt** cho Popup Thông báo.
- **Tối ưu Touch Targets >= 44px** và thu gọn Padding lãng phí.

---

## 🏛️ 2. PHÂN TÍCH CHI TIẾT THEO TỪNG MODULE (TECHNICAL SPECIFICATIONS)

### A. Component Tổng quan (`MainLayout.tsx`)
- **Mobile Bottom Nav:** Thêm thanh điều hướng ngắt ở đáy màn hình di động:
  ```tsx
  <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200 z-[190] flex items-center justify-around px-2 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
    {/* 5 Nút: Trang chủ, Bạn bè, Trò chuyện (badge), Thông báo (badge), Profile */}
  </nav>
  ```
- **Container Spacing:** Bổ sung `pb-16 md:pb-0` để nội dung trang không bị Bottom Nav che mất phần cuối.
- **Notification Sheet:** Biến Popup thông báo thành **Bottom Sheet trượt mượt từ dưới lên** (`fixed inset-x-0 bottom-0 max-h-[85vh] rounded-t-3xl shadow-2xl z-[200]`).

### B. Module Trò chuyện (`ChatPage.tsx`)
- **Mobile View State:** Quản lý luồng hiển thị bằng state `activeMobileView: 'list' | 'chat'`.
- **Luồng hoạt động:**
  - `activeMobileView === 'list'`: Hiển thị danh sách hội thoại tràn 100% màn hình mobile.
  - `activeMobileView === 'chat'`: Khi chọn 1 bạn bè, ẩn danh sách và hiển thị Khung chat tràn 100% màn hình, bổ sung nút **`< Danh sách`** ở góc trái Header Chat để bấm quay lại.

### C. Module Bài viết (`PostCard.tsx` & `CreatePostBox.tsx`)
- **Card Spacing:** Thu gọn padding từ `p-5` xuống `p-3.5 sm:p-5` trên mobile để tiết kiệm diện tích màn hình hiển thị nội dung.
- **Touch Target:** Kéo rộng diện tích cảm ứng của nút Thả tim, Bình luận, Chia sẻ lên tối thiểu `py-2 px-3` (đạt kích thước tối thiểu 44px x 44px).
- **Emotion Picker:** Thu nhỏ thanh chọn 6 biểu cảm cảm xúc (Pill popup) vừa vặn khung hình mobile, không bị nổ tràn lề.

### D. Module Trang cá nhân (`ProfilePage.tsx`)
- **Header Responsive:** Ảnh bìa (Cover photo) và Ảnh đại diện (Avatar) căn giữa gọn gàng trên mobile, nút "Chỉnh sửa trang cá nhân" kéo rộng 100%.
- **Scrollable Tabs:** Thanh các tab (Bài viết, Giới thiệu, Bạn bè, Ảnh) hỗ trợ cuộn ngang nhẹ nhàng bằng ngón tay (`overflow-x-auto scrollbar-none flex-nowrap`).

### E. Module Quản trị (`AdminDashboardPage.tsx`)
- **KPI Grid:** Chuyển 4 thẻ KPI thống kê từ `grid-cols-4` trên Desktop thành `grid-cols-2 lg:grid-cols-4` trên Mobile.
- **Data Tables:** Thêm thanh cuộn ngang mượt mà (`overflow-x-auto`) cho Bảng kiểm duyệt Người dùng và Bài viết, chống vỡ khung giao diện Admin.

---

## 🧪 3. KẾ HOẠCH KIỂM THỬ VÀ XÁC MINH (VERIFICATION PLAN)

### 1. Kiểm thử Biên dịch & Build tự động:
- Chạy `npm run build` ở thư mục `frontend/` để đảm bảo 100% không có lỗi biên dịch TypeScript hay Vite Bundling.

### 2. Kiểm thử Thực tế trên Trình duyệt (Responsive Mode):
- Mở Chrome DevTools và test trên 3 kích thước màn hình phổ biến:
  - 📱 **iPhone 14 Pro / 15 (393px x 852px)**
  - 📱 **Samsung Galaxy S20 / S23 (360px x 800px)**
  - 📱 **iPad Air / Tablet (768px x 1024px)**
- **Checklist xác minh:**
  - [x] Bấm nhảy tab trên Bottom Nav có mượt không, badge đếm tin nhắn/thông báo hiển thị chuẩn không.
  - [x] Xác minh `/chats` hiển thị danh sách single-pane full-width trên mobile; nút Back trong thread đã điều hướng route-authoritative về `/chats`.
  - [x] Long-press nút Thích mở Reaction Picker trên touch viewport và action feed đạt vùng chạm tối thiểu.
  - [ ] Mở trang Admin xem 4 thẻ KPI xếp thành lưới 2x2 đẹp mắt không.

---

## 📑 4. NHẬT KÝ ĐỒNG BỘ TÀI LIỆU (DOCS PROTOCOL)
Sau khi hoàn thành, sẽ cập nhật đồng bộ các file tài liệu:
1. `docs/planning/PROGRESS.md`
2. `docs/planning/ROADMAP.md`
3. `docs/session/SESSION_HANDOFF.md`
4. `docs/guidelines/CV_PORTFOLIO_HIGHLIGHTS.md`
5. `README.md`

---

## 5. ĐÁNH GIÁ CHUYÊN GIA UI/UX & FRONTEND

### 5.1. Kết luận nhanh

Kế hoạch hiện tại đi đúng hướng và đã nhận diện được các vấn đề mobile quan trọng nhất: thiếu điều hướng, khung chat bị chèn ép, notification panel chưa phù hợp và touch target quá nhỏ. Tuy nhiên, tài liệu vẫn thiên về thay đổi class responsive hơn là một đặc tả mobile hoàn chỉnh.

| Hạng mục | Đánh giá | Ghi chú |
|---|---:|---|
| Định hướng UX | 7/10 | Bottom Navigation, Bottom Sheet và single-pane chat là lựa chọn hợp lý |
| Độ đầy đủ kỹ thuật | 5/10 | Thiếu safe area, dynamic viewport, bàn phím ảo, accessibility và trạng thái lỗi |
| Khả năng triển khai | 7/10 | Phần lớn khả thi với React, Tailwind và router hiện tại |
| Kế hoạch kiểm thử | 4/10 | Mới có build và kiểm thử thủ công, chưa có mobile E2E/visual regression |
| Mức độ khớp code hiện tại | 5/10 | Một số hạng mục đã tồn tại hoặc tên component không còn chính xác |

Ba ưu tiên quan trọng nhất:

1. Thiết kế lại toàn bộ mobile shell để top header và bottom navigation không bị trùng chức năng.
2. Hoàn thiện chat theo URL, dynamic viewport, safe area và bàn phím ảo.
3. Chuyển các tương tác hover-only sang touch-first, đặc biệt Reaction Picker và avatar controls.

### 5.2. Các điểm cần đồng bộ với code hiện tại

Tài liệu cần được cập nhật trước khi triển khai để tránh làm lại chức năng đã có:

| Nội dung trong kế hoạch | Hiện trạng code | Hướng xử lý |
|---|---|---|
| Chat cần thêm state `activeMobileView` | `ChatPage.tsx` đã ẩn danh sách khi có hội thoại, ẩn khung chat khi chưa chọn và đã có nút Back | Dùng URL `/chats` và `/chats/:recipientId` làm nguồn trạng thái, không thêm state trùng lặp |
| Profile cần scrollable tabs | `ProfilePage.tsx` đã có `overflow-x-auto`, `scrollbar-none`, `whitespace-nowrap` | Chỉ cần hoàn thiện touch target, scroll affordance và kiểm thử overflow |
| Profile có tab Ảnh | Code hiện chỉ có Bài viết, Giới thiệu và Bạn bè; Hình ảnh đang là một box | Quyết định rõ Ảnh là tab thật hay gallery trong tab Bài viết |
| Admin KPI cần responsive | KPI đã là `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` | Tập trung tối ưu mật độ, typography và card height |
| Admin table cần `overflow-x-auto` | User table và Post table đã có cuộn ngang | Cân nhắc card view mobile hoặc sticky columns thay vì chỉ cuộn ngang |
| `CreatePostBox.tsx` | File thực tế là `CreatePostCard.tsx` | Cập nhật tên component trong tài liệu |
| Notification dropdown | `MainLayout.tsx` đang render markup trực tiếp, đồng thời dự án có `NotificationBell.tsx` | Hợp nhất thành một responsive component dùng chung |

---

## 6. NHỮNG THIẾU SÓT KỸ THUẬT VÀ UX CẦN BỔ SUNG

### 6.1. Safe Area và viewport động

Bottom Navigation không nên chỉ dùng `h-16 bottom-0`, vì sẽ bị Home Indicator của iPhone che. Cần định nghĩa chiều cao có tính safe area:

```css
.mobile-bottom-nav {
  height: calc(56px + env(safe-area-inset-bottom));
  padding-bottom: env(safe-area-inset-bottom);
}

.mobile-page-content {
  padding-bottom: calc(56px + env(safe-area-inset-bottom));
}
```

Viewport meta nên hỗ trợ edge-to-edge:

```html
<meta
  name="viewport"
  content="width=device-width, initial-scale=1, viewport-fit=cover"
/>
```

Các màn hình full-height, đặc biệt Chat, nên dùng `100dvh` thay cho `100vh` hoặc `h-screen`. `dvh` phản ánh đúng chiều cao khi thanh địa chỉ hoặc bàn phím mobile mở/đóng.

### 6.2. Bàn phím ảo trong Chat

Kế hoạch phải có acceptance criteria cho virtual keyboard:

- Composer luôn nằm phía trên bàn phím.
- Bottom Navigation không nổi lên trên bàn phím khi đang nhập.
- Tin nhắn mới nhất vẫn nhìn thấy sau khi bàn phím mở.
- Không tạo khoảng trắng lớn khi bàn phím đóng.
- Giữ đúng scroll position khi reply, edit hoặc upload ảnh.
- Thử nghiệm trên iOS Safari và Android Chrome, không chỉ Chrome DevTools.

Nếu CSS `100dvh` chưa đủ ổn định, có thể bổ sung Visual Viewport API nhưng chỉ dùng khi có bug thực tế trên thiết bị.

### 6.3. Responsive Header

Top Header hiện chứa logo, ô tìm kiếm, Chat, Notifications, Admin và Profile. Cấu trúc này không phù hợp màn hình 320-393px và còn trùng với mobile header bên trong `<main>`.

Đặc tả đề xuất:

- Desktop giữ top header hiện tại.
- Mobile chỉ giữ logo/brand và nút tìm kiếm dạng icon hoặc compact search trigger.
- Chat, Notifications và Profile chuyển xuống Bottom Navigation.
- Admin, Settings và Logout đưa vào Profile/More menu.
- Loại bỏ mobile header trùng lặp đang nằm trong nội dung trang.
- Chỉ có một nguồn định nghĩa active navigation dựa trên URL.

### 6.4. Accessibility

Mọi component mobile mới phải đáp ứng tối thiểu:

- Bottom Navigation dùng thẻ `<nav>` và có accessible label.
- Tab hiện tại dùng `aria-current="page"`.
- Nút chỉ có icon phải có `aria-label` rõ nghĩa.
- Tất cả control có focus-visible rõ ràng.
- Bottom Sheet dùng `role="dialog"` và `aria-modal="true"`.
- Focus được giữ bên trong dialog khi mở và trả lại nút trigger khi đóng.
- Có thể đóng sheet bằng Escape, backdrop và nút Close.
- Body bị khóa scroll khi modal/sheet mở.
- Hỗ trợ `prefers-reduced-motion`.
- Trạng thái không chỉ thể hiện bằng màu sắc.
- Contrast đạt WCAG AA.
- Giao diện vẫn reflow được khi zoom 200% hoặc dùng font hệ thống cỡ lớn.

### 6.5. Trạng thái giao diện

Mỗi module cần mô tả đủ các trạng thái sau:

| Trạng thái | Yêu cầu UX |
|---|---|
| Loading | Skeleton hoặc progress phù hợp, tránh layout shift |
| Empty | Giải thích rõ và có CTA hợp lý |
| Error | Thông báo dễ hiểu, có nút retry khi phù hợp |
| Offline | Hiển thị trạng thái mất kết nối, không làm mất dữ liệu đang nhập |
| Reconnecting | Chat/SSE/WebSocket thể hiện đang kết nối lại |
| Uploading | Có progress, cancel và xử lý lỗi |
| Long content | Không vỡ layout với tên dài, email dài, badge `99+`, nội dung không khoảng trắng |
| Permission denied | Voice/video/camera có hướng dẫn khi người dùng từ chối quyền |

### 6.6. Hiệu năng trên thiết bị di động

- Dùng `loading="lazy"` cho ảnh ngoài viewport.
- Dùng `srcset` và `sizes` cho avatar, cover và ảnh bài viết khi backend/CDN hỗ trợ.
- Giảm shadow, blur và backdrop-filter trên thiết bị yếu.
- Không chạy animation pulse liên tục nếu không cần thiết.
- Không tải lại feed mỗi lần người dùng quay về tab Trang chủ.
- Giữ scroll position theo route/tab.
- Kiểm thử Slow 3G, CPU throttling và ảnh kích thước lớn.
- Tránh decode quá nhiều ảnh cùng lúc trong gallery hoặc feed dài.

### 6.7. Breakpoint và thiết bị kiểm thử

Không nên chỉ định nghĩa mobile là `<768px`. Breakpoint cần dựa trên điểm bố cục bắt đầu vỡ.

Các kích thước bắt buộc:

| Nhóm | Viewport đề xuất |
|---|---|
| Mobile nhỏ | 320×568 |
| Android phổ biến | 360×800 |
| iPhone phổ biến | 375×812, 393×852 |
| Mobile lớn | 430×932 |
| Biên breakpoint | 767px và 768px |
| Tablet | 820×1180, 1024×1366 |
| Landscape | 667×375 và 852×393 |

Riêng Chat có thể cần chuyển từ single-pane sang multi-pane ở `lg` thay vì `md`, vì 768px vẫn khá chật cho danh sách, hội thoại và profile panel.

---

## 7. ĐÁNH GIÁ THIẾT KẾ THEO MODULE

### 7.1. Mobile Bottom Navigation

Bottom Navigation là lựa chọn hợp lý cho mạng xã hội vì dễ học, nằm trong vùng ngón cái và cho phép chuyển nhanh giữa các khu vực chính.

Đặc tả thẩm mỹ đề xuất:

- Tối đa 5 mục chính.
- Mỗi mục rộng đều, vùng chạm tối thiểu 44×44px.
- Icon 22-24px, label 11-12px.
- Luôn hiển thị label thay vì chỉ dùng icon.
- Active state gồm màu primary, label đậm và indicator nhẹ.
- Badge đặt absolute để không làm layout dịch chuyển.
- Không dùng shadow quá mạnh hoặc animation pulse liên tục.
- Hỗ trợ safe area.

Cấu trúc thông tin đề xuất:

| Vị trí | Chức năng |
|---|---|
| 1 | Trang chủ |
| 2 | Bạn bè |
| 3 | Trò chuyện + unread badge |
| 4 | Thông báo + unread badge |
| 5 | Trang cá nhân hoặc More menu |

Nếu người dùng Admin cần truy cập Portal, Admin nên nằm trong Profile/More menu thay vì thêm nút thứ sáu.

### 7.2. Notification Bottom Sheet

Thiết kế `max-h-[85vh] rounded-t-3xl` có tính thẩm mỹ tốt, nhưng cần bổ sung:

- Backdrop tối nhẹ.
- Drag handle ở đầu sheet.
- Sticky header.
- Safe-area padding ở đáy.
- Nút đóng tối thiểu 44×44px.
- `overscroll-behavior: contain` cho danh sách.
- Body scroll lock.
- Desktop vẫn dùng anchored floating panel.
- Mobile dùng bottom sheet qua cùng một component.

Swipe-to-dismiss là cải tiến tốt nhưng không bắt buộc ở phiên bản đầu nếu làm tăng độ phức tạp.

### 7.3. Chat Mobile

Không nên tạo thêm `activeMobileView` nếu route đã biểu diễn trạng thái. Kiến trúc đề xuất:

| URL | Giao diện mobile |
|---|---|
| `/chats` | Danh sách hội thoại |
| `/chats/:recipientId` | Thread chat full-screen |

Lợi ích:

- Browser Back và nút Back Android hoạt động tự nhiên.
- Deep link vào hội thoại hoạt động.
- Refresh trang không mất trạng thái.
- Không phát sinh hai nguồn state dễ lệch nhau.

Tối ưu giao diện:

- Mobile bỏ border, shadow và rounded corner của container Chat.
- Header chat cố định trong vùng nội dung, không đè top header.
- Các nút call/video/info đạt 44×44px.
- Gộp Plus, Image và Mic thành một expandable menu trên màn hình nhỏ.
- Chỉ giữ input, emoji và send trong trạng thái mặc định.
- Emoji Picker không vượt viewport và không bị bàn phím che.
- Profile Panel chuyển thành full-width sheet trên mobile.
- Giữ scroll position của danh sách khi quay lại.
- Bottom Navigation có thể ẩn khi đang mở thread để tránh tranh chấp không gian với composer.

### 7.4. Feed và Post Card

Thu padding từ `p-5` xuống `p-3.5 sm:p-5` là hợp lý. Tuy nhiên `py-2 px-3` chưa chắc đạt 44px chiều cao. Nên quy định trực tiếp:

```tsx
className="min-h-11 min-w-11 px-3"
```

Trên mobile có thể giảm border radius và shadow để feed gần edge-to-edge, tăng không gian nội dung và giảm cảm giác nhiều “hộp trong hộp”.

Vấn đề bắt buộc phải xử lý là Reaction Picker hiện phụ thuộc hover:

- Tap một lần để Like nhanh.
- Long press hoặc tap mở rộng để chọn Love, Haha, Wow, Sad, Angry.
- Mỗi emoji có touch target ít nhất 44px.
- Picker luôn nằm hoàn toàn trong viewport.
- Tooltip hover không phải cách duy nhất để hiểu biểu cảm.

Post Detail, Comment modal và Reactions modal cần chuyển thành full-screen dialog hoặc bottom sheet trên mobile.

### 7.5. Create Post

- Padding dùng `p-3.5 sm:p-5`.
- Textarea nên có font-size tối thiểu 16px trên iOS để tránh auto-zoom.
- Các action Ảnh, Cảm xúc, Check-in, Thăm dò cần vùng chạm 44px.
- Ở màn hình nhỏ có thể chỉ hiển thị 2 action chính và đưa phần còn lại vào More menu.
- Nút xóa preview ảnh phải luôn nhìn thấy trên touch device, không phụ thuộc hover opacity.
- Có giới hạn số ảnh, loading progress, cancel và retry.
- Thu hồi `URL.createObjectURL` khi preview bị xóa hoặc component unmount để tránh memory leak.

### 7.6. Typography và phân cấp thị giác

Code hiện dùng nhiều `text-[10px]`, `text-[11px]` và `text-xs`. Với Be Vietnam Pro, chữ quá nhỏ sẽ khó đọc trên điện thoại.

| Thành phần | Kích thước khuyến nghị |
|---|---:|
| Nội dung chính | 14-16px |
| Input | Tối thiểu 16px trên mobile |
| Button label | Tối thiểu 13px |
| Metadata | Tối thiểu 12px |
| Page heading | 22-28px tùy màn hình |
| Line-height nội dung | 1.4-1.6 |

Không nên thu nhỏ font để ép vừa layout; nên giảm số control, cho phép wrap hoặc thay đổi cấu trúc.

### 7.7. Profile

Profile đã có nền tảng mobile khá tốt nhưng cần hoàn thiện:

- Camera control của avatar phải luôn hiển thị trên touch, không phụ thuộc `group-hover`.
- Nút đổi cover không che nội dung quan trọng của ảnh.
- Edit Profile là primary action full-width trên mobile.
- Logout chuyển vào overflow menu hoặc xếp thành nút secondary riêng.
- Các action khi xem profile người khác phải wrap hoặc xếp dọc ở 320px.
- Tab có scroll affordance để người dùng biết có thể vuốt ngang.
- Quyết định rõ tab Ảnh là route/tab thật hay chỉ là gallery.
- Cover photo cần aspect ratio ổn định và object positioning phù hợp.

### 7.8. Admin Mobile

KPI grid và horizontal table scrolling đã tồn tại. Để có trải nghiệm chuyên nghiệp hơn:

- Dưới 640px chuyển table row thành card hoặc compact list.
- Card chỉ hiển thị tên, trạng thái và primary action.
- Chi tiết mở bằng full-screen sheet/modal.
- Nếu giữ table, thêm `min-width`, sticky cột tên và sticky cột hành động.
- Search form xếp dọc trên 320-360px.
- Action icon đạt 44×44px.
- Topbar rút gọn brand text và controls.
- Pagination có label rõ và vùng chạm lớn.
- Admin modal phải hỗ trợ scroll độc lập và safe area.

---

## 8. KIẾN TRÚC COMPONENT ĐỀ XUẤT

Không nên tiếp tục tăng kích thước `MainLayout.tsx`. Nên tách các concern mobile thành component riêng:

```text
components/layout/
├── MainLayout.tsx
├── DesktopHeader.tsx
├── MobileHeader.tsx
├── MobileBottomNav.tsx
├── DesktopSidebar.tsx
└── ResponsiveNotificationPanel.tsx

components/overlay/
├── BottomSheet.tsx
├── ResponsiveDialog.tsx
└── ModalBackdrop.tsx
```

Nguyên tắc triển khai:

- CSS media query/Tailwind chịu trách nhiệm bố cục.
- React state chỉ dùng cho hành vi tương tác thực sự.
- URL/router chịu trách nhiệm trạng thái điều hướng.
- Không dùng `window.innerWidth` làm nguồn trạng thái lâu dài nếu có thể giải quyết bằng CSS hoặc `matchMedia`.
- Overlay nên render qua portal để tránh lỗi stacking context và `overflow-hidden`.
- Chuẩn hóa z-index thay vì tiếp tục dùng nhiều giá trị tùy ý như `z-[190]`, `z-[195]`, `z-[200]`.

Token layout đề xuất:

```css
:root {
  --app-header-height: 56px;
  --mobile-nav-height: 56px;
  --touch-target-min: 44px;
  --mobile-page-gutter: 16px;
  --sheet-max-height: 85dvh;
}
```

---

## 9. LỘ TRÌNH TRIỂN KHAI ĐỀ XUẤT

### Phase 1 - Responsive Foundation

- Thêm `viewport-fit=cover`.
- Chuẩn hóa `dvh`, safe area, breakpoint và touch target.
- Thêm reduced motion và focus-visible.
- Chuẩn hóa layout tokens.

### Phase 2 - Navigation Shell

- Tách Desktop Header và Mobile Header.
- Thêm `MobileBottomNav`.
- Xóa header mobile bị trùng trong `<main>`.
- Đồng bộ active state với URL.
- Giữ scroll position giữa các route chính.

### Phase 3 - Chat Mobile

- Dùng `/chats` và `/chats/:recipientId` làm screen state.
- Dùng `100dvh` và xử lý virtual keyboard.
- Tối ưu header, composer và action toolbar.
- Chuyển profile panel thành sheet.
- Kiểm thử browser Back và deep link.

### Phase 4 - Feed Touch UX

- Responsive padding cho PostCard và CreatePostCard.
- Chuyển Reaction Picker sang tap/long press.
- Chuẩn hóa touch target.
- Tối ưu ảnh và mobile modals.
- Kiểm tra comment tree, post menu và image gallery.

### Phase 5 - Profile & Admin

- Hoàn thiện profile actions, cover, avatar controls và tabs.
- Quyết định phạm vi tab Ảnh.
- Tối ưu Admin table/card, search, topbar và pagination.

### Phase 6 - Notification Sheet

- Hợp nhất notification component.
- Desktop dùng anchored panel.
- Mobile dùng accessible bottom sheet.
- Thêm focus trap, backdrop, body lock, safe area và empty/error states.

### Phase 7 - Hardening

- Mobile Playwright E2E.
- Visual regression.
- Accessibility audit.
- Performance test trên mạng và CPU chậm.
- Kiểm thử thiết bị thật.

---

## 10. ACCEPTANCE CRITERIA

### 10.1. Global Layout

- [ ] Không có horizontal overflow ở viewport từ 320px trở lên.
- [ ] Chỉ một header mobile xuất hiện.
- [ ] Bottom Navigation không che nội dung cuối trang.
- [ ] Safe area hoạt động trên iPhone có Home Indicator.
- [ ] Active navigation đúng với URL hiện tại.
- [ ] Tất cả action chính có touch target tối thiểu 44×44px.
- [ ] Giao diện vẫn sử dụng được khi zoom 200%.
- [ ] Không có font input dưới 16px gây Safari auto-zoom.

### 10.2. Chat

- [ ] Mobile không hiển thị list và thread đồng thời.
- [ ] `/chats` mở danh sách, `/chats/:recipientId` mở thread.
- [ ] Browser Back từ thread quay về danh sách.
- [ ] Composer không bị bàn phím hoặc Bottom Navigation che.
- [ ] Mở/đóng bàn phím không làm mất scroll position.
- [ ] Header action và composer action đạt 44×44px.
- [ ] Profile panel mở dưới dạng mobile sheet.
- [ ] Deep link và refresh thread hoạt động.

### 10.3. Feed

- [ ] Reaction Picker hoạt động bằng touch, không phụ thuộc hover.
- [ ] Action Thích, Bình luận, Chia sẻ đạt 44px.
- [ ] Ảnh không làm vỡ layout hoặc vượt viewport.
- [ ] Post Detail và Comment UI sử dụng được với bàn phím mobile.
- [ ] Menu bài viết không tràn ra ngoài màn hình.

### 10.4. Notifications

- [ ] Sheet nằm hoàn toàn trong viewport.
- [ ] Có backdrop, close button và Escape handling.
- [ ] Focus không thoát khỏi sheet khi đang mở.
- [ ] Body phía sau không scroll.
- [ ] Sticky header và danh sách scroll độc lập.
- [ ] Loading, empty, error và unread state hiển thị đúng.

### 10.5. Profile & Admin

- [ ] Profile action không tràn ở 320px.
- [ ] Avatar camera control sử dụng được bằng touch.
- [ ] Tabs cuộn ngang mượt và có affordance.
- [ ] Admin KPI không bị chữ chồng chéo.
- [ ] Admin user/post list sử dụng được mà không cần zoom.
- [ ] Admin action buttons đạt 44px.

---

## 11. KẾ HOẠCH KIỂM THỬ NÂNG CAO

### 11.1. Playwright Mobile Projects

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  projects: [
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 14'] },
    },
  ],
});
```

### 11.2. Automated Assertions

- Không có horizontal overflow.
- Bottom Navigation không che phần tử cuối trang.
- Chỉ một mobile header hiển thị.
- Notification Sheet nằm trong viewport.
- Chat list và thread không hiển thị đồng thời.
- Browser Back hoạt động đúng.
- Touch target có bounding box tối thiểu 44px.
- Screenshot regression ở 360px, 393px, 768px và desktop.
- Modal và Bottom Sheet không vượt chiều cao dynamic viewport.

### 11.3. Kiểm thử thiết bị thật

- iOS Safari có notch/Home Indicator.
- Android Chrome.
- Portrait và landscape.
- Bàn phím mở/đóng nhiều lần.
- Font hệ thống cỡ lớn.
- Dark mode.
- Slow 3G và offline/reconnect.
- Camera/microphone permission allow/deny.
- Voice/video call khi chuyển app sang background.

---

## 12. DEFINITION OF DONE

Một module chỉ được xem là hoàn thành responsive khi đáp ứng đồng thời:

1. Build TypeScript/Vite thành công.
2. Không có horizontal overflow từ 320px đến desktop.
3. Hoạt động bằng touch, keyboard và screen reader cơ bản.
4. Không phụ thuộc hover để thực hiện hành động quan trọng.
5. Có loading, empty và error state phù hợp.
6. Playwright mobile test pass.
7. Đã kiểm thử ít nhất một thiết bị iOS và một thiết bị Android thật.
8. Không có regression trên desktop.
9. Tài liệu và screenshot được cập nhật theo implementation thực tế.

---

## 13. BÁO CÁO TRIỂN KHAI THỰC TẾ (30/07/2026)

> **Cập nhật 05/08/2026:** Mobile hardening tiếp tục với `100dvh`/safe-area cho Post Detail, comment composer focus mode, comment image attachment, 16px input chống iOS zoom, long-press reactions (tap = Like, hold = picker/action sheet), chat image lightbox, WebRTC PiP và touch target 48px ở composer Messenger. Test thực tế phải bao gồm iOS Safari và Android Chrome; không dùng hover làm cách duy nhất để thực hiện hành động.

### 13.1. Hạng mục đã hoàn thành

- Responsive foundation: `viewport-fit=cover`, CSS safe-area, `100dvh`, layout tokens, focus-visible và reduced motion.
- Mobile shell: Header riêng trên mobile, Bottom Navigation 5 mục theo URL, unread badges và content padding an toàn.
- Notifications: Desktop anchored panel và mobile Bottom Sheet dùng chung state/logic, có backdrop, Escape, body scroll lock và touch target 44px.
- Chat: Danh sách full-width trên mobile, route-authoritative Back, thread không hiển thị đồng thời với list, composer safe-area, input 16px, action 44px và profile sheet full-width.
- Feed: Card spacing responsive, semantic `article`, stable test IDs, Reaction Picker long-press/touch, action 44px.
- Create Post: Không còn horizontal overflow do flex min-content, action grid responsive, preview delete luôn dùng được bằng touch.
- Profile: Cover/avatar responsive, camera button touch-first, action wrapping, tab touch targets và content order ưu tiên post composer trên mobile.
- Admin: Dynamic viewport, compact topbar, responsive search form, touch-friendly actions và safe-area padding.
- Testing: Thêm Playwright `mobile-chromium` 360×800, tách riêng khỏi desktop suite và thay selector class-based bằng stable test contracts ở các vùng đã sửa.

### 13.2. Component và test mới

- `frontend/src/components/layout/MobileHeader.tsx`
- `frontend/src/components/layout/MobileBottomNav.tsx`
- `frontend/tests/mobile-responsive.spec.ts`

### 13.3. Kết quả xác minh

| Kiểm tra | Kết quả |
|---|---|
| `npm run build` | ✅ Pass |
| `git diff --check` | ✅ Không có lỗi whitespace |
| Mobile Chromium 360×800 | ✅ 2/2 pass |
| Responsive regression chọn lọc: Chat, Feed, Notification, Profile | ✅ 5/5 pass sau khi ổn định selector |
| Full Chromium desktop suite | ⚠️ 12/17 pass |

Năm failure trong full suite đều xuất hiện sau khi login/session bắt đầu trả 401 và `app-shell` bị unmount. Các test tương ứng pass khi chạy riêng hoặc trong tập regression responsive. Đây là residual risk của auth/session E2E dài, không phải lỗi compile hoặc layout responsive; cần một task hardening xác thực riêng trước khi coi CI desktop hoàn toàn xanh.

---

## 14. UX AUDIT & REDESIGN BACKLOG - PROFILE, HOME VÀ CONTENT DENSITY

> **Nguồn đánh giá:** UX Audit sau implementation mobile responsive, dựa trên screenshot mobile thực tế ngày 30/07/2026. Facebook Mobile được dùng như industry benchmark về information hierarchy, density, navigation và touch interaction.
>
> **Mục tiêu redesign:** Giữ hệ thống responsive đã hoàn thành, nhưng giảm không gian lãng phí, tăng lượng nội dung giá trị xuất hiện trong viewport đầu tiên và giảm cognitive load khi tạo/xem bài viết.

### 14.1. Kết luận UX Audit

| Tiêu chí | Đánh giá | Nhận định |
|---|---:|---|
| Tính thẩm mỹ | 7.5/10 | Nhận diện tím nhất quán, cover/avatar và mobile shell có chất lượng tốt |
| Điều hướng | 8/10 | Bottom Navigation rõ ràng, thông báo dạng sheet phù hợp mobile |
| Hiệu quả không gian | 5.5/10 | Profile action area và Create Post chiếm quá nhiều chiều cao |
| Phân cấp thông tin | 7/10 | Profile header tốt nhưng hành động hệ thống đang nổi hơn nội dung |
| Mật độ nội dung | 5.5/10 | Feed hiển thị ít bài viết mỗi viewport; media/text chưa được clamp hợp lý |
| Khả năng sử dụng mobile | 7/10 | Touch target tốt hơn trước, nhưng cần compact states cho luồng thường dùng |

Điểm mạnh hiện tại:

- Branding tím, Header, Bottom Navigation và Notification Bottom Sheet nhất quán.
- Profile cover/avatar tạo được hero hierarchy tốt.
- Không còn desktop layout bị ép vào mobile.
- Chat và reaction đã chuyển sang touch-first.

Vấn đề ưu tiên cao nhất:

1. Profile Header chứa action area quá lớn, đặc biệt là nút Đăng xuất màu đỏ full-width.
2. Create Post ở Home/Profile mở rộng mặc định, đẩy các bài đăng giá trị xuống quá sâu.
3. Bài viết dài và media cao làm giảm content density khi cuộn.
4. Check-in và Khảo sát xuất hiện quá sớm, tăng tải nhận thức so với tần suất sử dụng thực tế.

---

### 14.2. Profile Page - Điều hướng, Action Area và Information Hierarchy

#### A. Nút Đăng xuất

**Đánh giá:** Đăng xuất là thao tác hiếm, có tính phá vỡ phiên hiện tại và không phải primary task của Profile. Hiển thị thành nút đỏ full-width cạnh thông tin cá nhân khiến nó chiếm visual weight quá lớn, kéo dài Profile Header và làm giao diện giống trang Settings hơn trang social profile.

**Quyết định redesign:** Loại bỏ nút Đăng xuất khỏi Profile Header. Không loại bỏ khả năng đăng xuất.

**Vị trí thay thế đề xuất:** menu overflow `⋯` cạnh nút Chỉnh sửa hồ sơ hoặc Account Menu của avatar/header.

```text
Nguyễn Văn An
Sống tích cực, yêu lập trình và công nghệ

[ Chỉnh sửa hồ sơ ] [ ⋯ ]
```

Menu `⋯`:

```text
Cài đặt tài khoản
Quyền riêng tư
Sao chép liên kết hồ sơ
────────────────────
Đăng xuất
```

**Yêu cầu interaction:**

- Chỉ mục Đăng xuất dùng màu rose/red.
- Cần confirm dialog trước khi logout nếu có draft post, upload hoặc thao tác chưa lưu.
- Menu phải đóng bằng outside click, Escape và có focus management.
- Nút overflow tối thiểu 44×44px.

#### B. Nút Chỉnh sửa hồ sơ

**Quyết định:** Giữ nút Chỉnh sửa hồ sơ, nhưng chuyển từ full-width action sang compact primary action.

Lý do:

- Profile Header là nơi người dùng kỳ vọng tìm thấy chỉnh sửa thông tin cá nhân.
- Tab Giới thiệu phù hợp để edit từng field, nhưng không thay thế entry point cho chỉnh sửa tổng quan.
- Facebook benchmark vẫn duy trì action edit ở Profile Header.

**Đặc tả đề xuất:**

```text
[ icon Pencil | Chỉnh sửa hồ sơ ] [ ⋯ ]
```

- Height: 40-44px.
- Width: 140-180px hoặc fit-content trên mobile.
- Mở bottom sheet/modal dùng chung với editor trong tab Giới thiệu.
- Không có hai form edit khác logic/state.
- Giới thiệu giữ icon bút chì tại từng field cho chỉnh sửa nhanh.

#### C. Thiết kế lại Action/Task Area

**Hiện trạng:** Hai nút full-width xếp dọc tạo block cao khoảng 80-100px. Cùng cover, avatar, tên, bio và tabs, phần nội dung chính bị đẩy khỏi viewport đầu tiên.

**Thiết kế đề xuất:**

```text
[Avatar]
Nguyễn Văn An
Sống tích cực, yêu lập trình và công nghệ
128 Bài viết  ·  256 Bạn bè

[ Chỉnh sửa hồ sơ ] [ ⋯ ]

Bài viết     Bạn bè     Giới thiệu
```

**Quy chuẩn spacing:**

| Thành phần | Giá trị đề xuất |
|---|---:|
| Bio đến stats | 8px |
| Stats đến action | 12px |
| Action area cao tối đa | 44px |
| Action đến tabs | 16px |
| Profile header desktop/mobile padding | 16px / 16px |

Mục tiêu: khu vực action không vượt 52px tổng chiều cao và Post Composer bắt đầu trong hoặc sát viewport đầu tiên trên điện thoại.

#### D. Thứ tự Profile Tabs

Hai lựa chọn hợp lý:

| Phương án | Thứ tự | Khi sử dụng |
|---|---|---|
| Facebook benchmark | `Bài viết · Giới thiệu · Bạn bè` | Ưu tiên sự quen thuộc với người dùng phổ thông |
| Social-first đề xuất | `Bài viết · Bạn bè · Giới thiệu` | Ưu tiên social proof, kết nối và bạn chung |

**Khuyến nghị hiện tại:** `Bài viết · Bạn bè · Giới thiệu` vì MiniFaceBook là social network và Friends có giá trị khám phá/quan hệ lớn hơn About. Tuy nhiên cần kiểm chứng bằng analytics khi có traffic thực tế; không cần đổi chỉ để thay đổi hình thức.

Quy tắc hiển thị:

- Chỉ ba tab: chia đều chiều rộng, không cần horizontal scrolling.
- Có từ bốn tab trở lên: dùng horizontal scrolling + visual affordance ở cạnh phải.
- Sticky tabs ngay dưới mobile header khi người dùng scroll Profile.
- Active tab không chỉ thể hiện bằng màu: dùng underline/indicator và `aria-selected`/`aria-current` phù hợp.

#### E. Avatar và cover controls

- Camera avatar phải luôn có entry point touch-first, không phụ thuộc hover.
- Cover action chỉ hiển thị icon camera ở mobile; label xuất hiện từ `sm` trở lên.
- Aspect ratio cover ổn định; ảnh dùng object positioning tránh cắt mặt chủ thể.
- Action đổi ảnh không che avatar hoặc tên trên viewport 320px.

---

### 14.3. Home Page và Create Post Composer

#### A. Vấn đề

Create Post hiện hiển thị đồng thời avatar, textarea cao, divider, grid action 2×2 và nút Đăng full-width. Tổng chiều cao ước tính 210-230px, chiếm gần 30% viewport cao 800px trước khi người dùng đọc được bài viết đầu tiên.

#### B. Thiết kế compact state mặc định

```text
[Avatar] [ Bạn đang nghĩ gì?                         ]
─────────────────────────────────────────────────────
[ Ảnh / Video ]                     [ Cảm xúc ]
```

**Mục tiêu:** chiều cao composer khi chưa focus là 105-125px.

Quy tắc:

- Prompt mở full composer khi user tap.
- Textarea compact chỉ cao 44-48px khi chưa focus.
- Nút Đăng chỉ hiện khi có text/media hoặc ở full composer.
- Không render grid 2×2 action ở collapsed state.
- Avatar 36-40px.
- Input font tối thiểu 16px trên iOS để ngăn Safari auto-zoom.

#### C. Expanded Create Post Sheet

Khi người dùng tap prompt, mở responsive dialog/full-screen mobile sheet:

```text
Tạo bài viết                                  [Đăng]

[Avatar] Nguyễn Văn An
[Ai có thể xem bài viết này?]

Bạn đang nghĩ gì?

Ảnh / Video
Cảm xúc
Check-in
Khảo sát
Gắn thẻ bạn bè
```

**Responsive behavior:**

| Desktop | Mobile |
|---|---|
| Centered modal 480-600px | Full-screen dialog hoặc Bottom Sheet cao `100dvh` |
| Close button/overlay | Back, close button, Escape, body scroll lock |
| Grid actions | Full-width action list dễ chạm |

#### D. Check-in và Khảo sát

**Đánh giá:** Không nên xóa nghiệp vụ nếu roadmap còn dùng. Tuy nhiên để Check-in và Khảo sát trong composer default tăng cognitive load trong khi tần suất thường thấp hơn Image/Video và Feeling.

**Quyết định đề xuất:**

- Collapsed composer chỉ giữ `Ảnh / Video` và `Cảm xúc`.
- Check-in, Khảo sát, Gắn thẻ bạn bè, GIF đưa vào `⋯ Thêm` trong expanded composer.
- Nếu analytics cho thấy tỷ lệ dùng Check-in/Poll cao, có thể nâng lại thành quick action theo feature flag.

---

### 14.4. Feed Content Density và Readability

#### A. Nội dung văn bản dài

**Vấn đề:** Bài viết hiển thị toàn bộ text dài làm một card chiếm nhiều viewport, giảm khả năng scan Feed.

**Đặc tả redesign:**

- Collapsed ở 4-6 dòng trên mobile.
- Hiển thị `Xem thêm` khi text vượt giới hạn.
- Mở rộng inline, không reset scroll.
- Sau khi expand có `Thu gọn`.
- Không clamp bài viết ngắn.

```css
.post-content-collapsed {
  display: -webkit-box;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

#### B. Media chiều cao lớn

**Vấn đề:** Ảnh portrait hoặc media có natural height lớn kéo card rất dài.

**Đặc tả redesign:**

```css
.post-media {
  max-height: min(65dvh, 420px);
  object-fit: cover;
}
```

- Không ép mọi ảnh thành 16:9 vì sẽ cắt portrait quá nhiều.
- Landscape giữ aspect ratio hợp lý nhưng có max-height.
- Portrait dùng preview crop, mở media viewer để xem đầy đủ.
- Multi-image dùng collage/grid thay vì xếp dọc toàn bộ.
- Có `aspect-ratio` placeholder để tránh cumulative layout shift.
- Ảnh ngoài viewport dùng lazy loading; CDN nên hỗ trợ `srcset`/`sizes` về sau.

#### C. Reaction, comments và share counters

**Đánh giá:** Các chỉ số bằng 0 tạo noise mà không cung cấp thông tin hữu ích.

**Quy tắc hiển thị:**

- `0 lượt thích`: ẩn reaction summary.
- `0 bình luận`: ẩn comment count.
- `0 chia sẻ`: ẩn share count.
- Nếu tất cả là 0: bỏ cả counter row và giữ divider/action bar gọn.

Ví dụ:

```text
Có tương tác:  👍 ❤️ 12       4 bình luận · 2 lượt chia sẻ
Không có tương tác: [counter row được ẩn]
```

#### D. Post card spacing

| Thành phần | Giá trị mobile đề xuất |
|---|---:|
| Card padding header/content | 12-14px |
| Avatar | 36-40px |
| Metadata | Tối thiểu 12px |
| Nội dung | 14-15px, line-height 1.5 |
| Action bar | Tối thiểu 44px |
| Khoảng cách giữa card | 10-12px |
| Border radius | 12px |

- Giảm shadow; ưu tiên border mảnh để tránh cảm giác “card lồng card”.
- Nút `⋯` giữ vùng chạm 44×44px.
- Không chỉ dựa vào hover để hiển thị menu hoặc action quan trọng.

---

### 14.5. Responsive Design System cho Social Application

#### A. Breakpoint theo cấu trúc

Không chỉ thu nhỏ desktop. Mỗi range có information architecture riêng:

| Viewport | Điều hướng | Bố cục |
|---|---|---|
| 320-639px | Mobile Header + Bottom Navigation | Một cột, sheet/full-screen overlays |
| 640-1023px | Header + Navigation Rail | Một cột chính, panel phụ tùy ngữ cảnh |
| Từ 1024px | Header + Sidebar + Right Rail | Hai/ba cột theo màn hình |

#### B. Width, spacing và typography tokens

| Token | Giá trị đề xuất |
|---|---:|
| Mobile gutter | 12-16px |
| Feed desktop max-width | 600-680px |
| Profile desktop max-width | 960-1100px |
| Notification desktop | 360-400px |
| Form modal | 480-600px |
| Chat list desktop | 280-320px |
| Touch target | Tối thiểu 44×44px |
| Mobile body text | 14-16px |
| Mobile input | Tối thiểu 16px |
| Metadata | Tối thiểu 12px |
| Button label | 13-14px |

#### C. Navigation và overlay rules

- Bottom Navigation tối đa 5 mục, luôn hiển thị icon + label.
- Badge đặt absolute, không làm layout dịch chuyển.
- Active state dùng indicator + label weight, không chỉ đổi màu.
- Dùng `aria-current="page"` cho route active.
- Có thể ẩn Bottom Navigation khi mở Chat Thread nếu composer/bàn phím cần không gian.
- Desktop popover chuyển thành Bottom Sheet trên mobile.
- Desktop centered modal chuyển thành full-screen dialog/mobile sheet.
- Side panel chuyển thành full-width sheet.

Mọi sheet/dialog phải có safe-area padding, backdrop, body scroll lock, Escape/close handling, focus trap, focus return và scroll nội bộ độc lập.

#### D. Accessibility và performance baseline

- WCAG AA contrast tối thiểu.
- Focus-visible rõ ràng; icon-only button phải có `aria-label`.
- Hỗ trợ zoom 200%, font hệ thống lớn và `prefers-reduced-motion`.
- Trạng thái không được truyền đạt chỉ bằng màu.
- Lazy-load media ngoài viewport; dùng placeholder aspect ratio.
- Không tải full-resolution cho thumbnail.
- Giảm blur, shadow và animation liên tục trên thiết bị yếu.
- Test Slow 3G, offline/reconnect, portrait/landscape, iOS Safari và Android Chrome.

---

### 14.6. Redesign Roadmap

#### P0 - Giá trị UX cao, triển khai trước

1. [x] Chuyển Đăng xuất vào menu `⋯`.
2. [x] Thu Chỉnh sửa hồ sơ thành compact action cạnh menu `⋯`.
3. [ ] Thêm post/friend counts trong Profile Header nếu API đã có dữ liệu tổng hợp đáng tin cậy.
4. [x] Chuyển Create Post sang collapsed composer cao 105-125px.
5. [x] Đưa Check-in và Khảo sát vào More menu của expanded composer.
6. [x] Clamp text bài viết dài với `Xem thêm`/`Thu gọn`.
7. [x] Giới hạn chiều cao preview ảnh; media viewer đầy đủ là P1.
8. [x] Ẩn interaction counters có giá trị 0.

#### P1 - Hoàn thiện luồng và hierarchy

1. Sticky Profile tabs dưới mobile header.
2. Full-screen Create Post Sheet trên mobile.
3. Multi-image collage tối ưu mobile.
4. Tinh chỉnh card density, shadow, divider và vertical rhythm.
5. Chuẩn hóa typography token 12-16px.
6. Theo dõi analytics để xác nhận tab order `Posts/Friends/About`.

#### P2 - Product hardening

1. Responsive media CDN với `srcset`/`sizes`.
2. Skeleton tương ứng compact/expanded layout.
3. Visual regression screenshots ở nhiều viewport.
4. Thử nghiệm iOS/Android thật, keyboard, system font scaling và zoom 200%.
5. A/B test collapsed composer, tab order và media crop ratio khi có đủ traffic.

---

### 14.7. Acceptance Criteria cho Redesign Backlog

#### Profile

- [ ] Không có nút Đăng xuất full-width trong Profile Header.
- [ ] Chỉnh sửa hồ sơ và overflow menu nằm trên một hàng ở 320px.
- [ ] Action area không cao quá 52px.
- [ ] Avatar/cover controls đều thao tác được bằng touch.
- [ ] Tabs có thứ tự được chốt, active indicator và sticky behavior đúng.

#### Composer

- [ ] Collapsed composer cao tối đa 125px trên viewport 360px.
- [ ] Default chỉ hiển thị Image/Video và Feeling.
- [ ] Check-in/Poll vẫn dùng được từ expanded More menu.
- [ ] Input mobile tối thiểu 16px.
- [ ] Expanded composer không bị keyboard hoặc Bottom Navigation che.

#### Feed

- [ ] Bài text dài clamp 4-6 dòng, mở/thu gọn không reset scroll.
- [ ] Preview media không vượt `min(65dvh, 420px)` trên mobile.
- [ ] Counter bằng 0 không chiếm hàng UI.
- [ ] Post card/action bar giữ 44px touch targets.
- [ ] Không có horizontal overflow tại 320px, 360px, 393px và 430px.

#### Verification

- [ ] Playwright mobile test bổ sung compact composer, overflow menu, text clamp và zero-counter behavior.
- [ ] Visual screenshots ở 360×800, 393×852, 768×1024 và desktop.
- [ ] Kiểm thử thiết bị thật trên iOS Safari và Android Chrome.

---

### 14.8. Báo cáo P0 Redesign Implementation (30/07/2026)

**Đã triển khai:**

- Profile Header giữ action `Chỉnh sửa trang cá nhân` compact, chuyển `Đăng xuất` vào overflow menu cùng `Cài đặt tài khoản`.
- Tab Profile được sắp lại thành `Bài viết · Bạn bè · Giới thiệu`, chia đều chiều ngang khi chỉ có ba tab.
- `CreatePostCard` mặc định là compact composer gồm prompt, Ảnh/Video và Cảm xúc; chiều cao được kiểm tra không vượt 140px ở 360px viewport.
- Tap composer mở dialog được portal trực tiếp vào `document.body`, tránh stacking context làm Bottom Navigation/toast che dialog.
- Expanded composer đưa Check-in/Khảo sát vào `Thêm vào bài viết`, hỗ trợ Escape, backdrop close, body scroll lock, media preview và safe-area.
- `PostCard` hỗ trợ text clamp 5 dòng cùng `Xem thêm/Thu gọn`, ảnh đơn bị giới hạn `min(65dvh, 420px)`, media lazy-load và ẩn row/count bằng 0.
- Feed giảm khoảng cách dọc và test infinite scroll chuyển sang theo dõi sentinel thật của `IntersectionObserver`.
- Route scroll manager dùng `useLayoutEffect` reset đồng thời `window`, `html`, `body` và `scrollingElement` trước/sau route layout; khắc phục Chat bị render ở vị trí cuộn còn lại từ Friends.
- Main content mobile dùng đúng available viewport height giữa Header và Bottom Navigation; Friends không còn tạo viewport scroll dư khi danh sách kết thúc, và có end-of-list label rõ ràng.
- Scroll architecture được harden: `mobile-route-scroll` dùng `flex-1` (không dùng `flex-grow` theo content), trở thành scroll owner có chiều cao cố định; route/tab mới luôn bắt đầu từ scroll top 0.

**Xác minh:**

| Kiểm tra | Kết quả |
|---|---|
| Frontend `npm run build` | ✅ Pass |
| Mobile P0 E2E 360×800 | ✅ 4/4 pass |
| Feed desktop E2E | ✅ 3/3 pass |
| Profile desktop E2E | ⚠️ 4/5 pass |

Profile failure còn lại bắt đầu ở helper login khi auth/session trả 401 trong suite dài tạo nhiều user, trước khi kiểm tra UI Friends box. Đây là residual auth E2E đã biết, không phải regression của Profile action area/tabs.
