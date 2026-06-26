# 💎 Hướng dẫn Thiết kế Hệ thống UI/UX Premium - MiniFaceBook
## 🎨 Phiên Bản: Notion-inspired Light Slate Mode (Vizo Slate Light Theme)

Tài liệu này ghi nhận toàn bộ triết lý thiết kế, quy chuẩn kỹ thuật, hệ thống Design Tokens và các giải pháp cải tiến giao diện đột phá được đúc kết từ cẩm nang **[ui-ux-pro-max](file:///d:/Project_MiniFace/.antigravity/skills/ui-ux-pro-max/SKILL.md)** áp dụng riêng cho dự án **MiniFaceBook**. 

---

## 🎨 1. Triết lý Thiết kế Chủ đạo
MiniFaceBook hướng tới trải nghiệm mạng xã hội tối giản, cao cấp và mượt mà tuyệt đối, lấy cảm hứng từ cấu trúc trực quan của **Notion** và hệ sinh thái **Slate Light (Vizo)**. Dự án tuân thủ 3 nguyên tắc cốt lõi:
1.  **Notion-inspired Light Slate Mode:** Giao diện sáng cao cấp với nền xám nhạt dịu mát (`bg-slate-50`), hộp thẻ trắng muốt tinh khiết (`bg-white`), loại bỏ hoàn toàn hiện tượng mỏi mắt, làm nổi bật thông tin cốt lõi mà không bị rườm rà.
2.  **Soft UI & Ultra-thin Borders:** Các hình khối, thẻ (Cards), nút bấm (Buttons) được bo góc mềm mại (`rounded-xl` / `rounded-2xl`), sử dụng bóng mờ siêu mịn (`shadow-sm shadow-slate-100/50`) và đường viền siêu mảnh xám Slate (`border-slate-200/80`) thay vì các nét vẽ thô cứng.
3.  **Responsive Layout & Zero Artificial Zoom:** Tuyệt đối không dùng cờ zoom cứng (`zoom: 0.9` hoặc tương tự). Giao diện co dãn tự nhiên 100%, bảo toàn tỷ lệ hiển thị chuẩn chỉ của mọi thiết bị.

---

## 🧱 2. Hệ thống Design Tokens (Màu sắc & Typography)

### Bảng màu HSL tối ưu (Notion/Vizo Slate Light Theme)
Hệ thống màu sắc được thiết kế đặc thù cho mạng xã hội hiện đại, dễ dàng quản lý độ tương phản đạt chuẩn WCAG AA:

```css
:root {
  /* Nền và Bề mặt */
  --background: 210 40% 98%;      /* #F8FAFC - Slate 50: Nền xám nhạt thanh lịch */
  --card: 0 0% 100%;             /* #FFFFFF - Trắng tinh khiết tạo độ nổi bề mặt */
  --popover: 0 0% 100%;          /* #FFFFFF - Trắng mờ kính popover */
  
  /* Điểm nhấn & Thương hiệu */
  --primary: 221.2 83.2% 53.3%;   /* #2563EB - Royal Blue: Xanh dương hoàng gia nổi bật */
  --primary-foreground: 0 0% 100%;
  
  /* Văn bản tương phản cao */
  --text-primary: 215 25% 15%;    /* #1E293B - Slate 800: Đọc tin tức cực sắc nét */
  --text-secondary: 215.4 16.3% 46.9%; /* #64748B - Slate 500: Chữ phụ mềm mại */
  
  /* Trạng thái Tương tác & Viền */
  --muted: 210 40% 96.1%;        /* Slate 100 */
  --accent: 210 40% 96.1%;
  --border: 214.3 31.8% 91.4%;   /* #E2E8F0 - Slate 200: Viền siêu mảnh */
  --ring: 221.2 83.2% 53.3%;
  
  /* Trạng thái Hệ thống */
  --success: 142.1 76.2% 36.3%;  /* #16A34A - Emerald Green: Online status (Ripple Pulse) */
  --warning: 38 92% 50%;         /* #D97706 - Amber Yellow: Cảnh báo chưa kích hoạt */
  --destructive: 0 84.2% 60.2%;  /* Red */
}
```

### Typography (Cặp Font chữ Đẳng cấp)
*   **Font Tiêu đề (Headings):** **Outfit** hoặc **Plus Jakarta Sans** (Google Fonts)
    *   *Đặc điểm:* Các nét chữ bo góc tròn trịa, hiện đại, mang lại cảm giác thân thiện, giải trí và vô cùng cao cấp.
*   **Font Nội dung (Body/Inputs):** **Inter**
    *   *Đặc điểm:* Font chữ sans-serif quốc dân, có độ hiển thị cực tốt trên các màn hình độ phân giải thấp, giúp người dùng đọc tin tức lâu không bị mỏi mắt.

---

## 🧭 3. Thống nhất Quy chuẩn Giao diện 3 Cột (Trang Chủ & Dòng Thời Gian)

Mạng xã hội MiniFaceBook áp dụng duy nhất một chuẩn cấu trúc và phối màu đồng bộ cho toàn bộ hệ thống:

```
+-----------------------------------------------------------------------------------+
|  [H] Connect (Logo)  |   [ ⌘ K  Tìm kiếm... ]    | [🔔]  [🌙]  [Avatar]           | (Vizo Topbar)
+-----------------------------------------------------------------------------------+
|  [🏠] Bảng tin       |                                 | [⚡] Trending Now        |
|  [👤] Trang cá nhân  |        [ CREATE POST CARD ]     |   #SpringBoot            | (Right Sidebar
|  [💬] Trò chuyện     |                                 |   #TailwindCSS           |  Suggested
|                      |        [ POST NEWS FEED ]       |                          |  Friends)
|  [Logout Widget]     |                                 | [👥] Suggested Friends   |
+----------------------+---------------------------------+--------------------------+
  (Left Sidebar -          (Central Newsfeed - Max H)      (Right Sidebar - Sticky)
   Responsive Collapse)
```

### 3.1. Cấu trúc 3 Cột Hoàn hảo (3-Column Layout Spec)
*   **Left Sidebar Navigation (Menu Điều Hướng Trái):**
    *   *Định vị:* `sticky top-6 h-[calc(100vh-48px)]`.
    *   *Responsive:* Tự động co gọn thành **Icon-Only Mode (`w-[80px]`)** trên tablet/laptop để ưu tiên không gian cột giữa, và tự động bung rộng đầy đủ nhãn chữ (`w-[275px]`) trên màn hình lớn. Thời gian chuyển động `300ms` cực mượt.
    *   *Branding:* **Logo Connect** bắt buộc luôn hiển thị dạng chữ cái **"H"** phát sáng nhẹ mờ kính.
    *   *Account Widget & Logout:* Tích hợp ở chân Sidebar. Khi click, xuất hiện popover mờ kính chứa nút đăng xuất kèm icon `LogOut` và các cài đặt.
*   **Central Newsfeed (Bảng Tin Trung Tâm):**
    *   *Bố cục:* Rộng thoáng, căn giữa tự động. Chiều rộng tối đa được kiểm soát nghiêm ngặt để đảm bảo khả năng đọc tốt nhất mà không cần zoom trình duyệt.
    *   *Lọc dữ liệu:* Loại bỏ hoàn toàn khối Story rườm rà theo triết lý tối giản Notion.
*   **Right Sidebar Widgets (Cột Phụ Trực Bên Phải):**
    *   *Định vị:* `sticky top-6 h-[calc(100vh-48px)]`. Ẩn hoàn toàn trên thiết bị di động (mobile/tablet).
    *   *Widget Gợi ý kết bạn (Suggested Friends):* Hiển thị chính xác 5 gương mặt gợi ý kết bạn kèm vi tương tác Add Friend.
    *   *Add Friend Interaction:* Khi click, nút kích hoạt trạng thái xoay loading (`Loader2 animate-spin`) trong `800ms` giả lập API, sau đó chuyển mượt sang trạng thái khóa `Requested` màu viền ngọc lục bảo chữ xanh nhẹ để phản hồi trực quan.

### 3.2. Quy chuẩn Icon & Màu sắc Tương tác
Hệ thống sử dụng duy nhất thư viện **Lucide React**, phân chia nhóm màu biểu tượng như sau:
*   **Đăng Ảnh/Video (Photo/Video):** Sử dụng icon `Image` màu xanh lá dịu mát (`text-emerald-500 bg-emerald-50/50`).
*   **Cảm xúc bài viết (Feeling):** Sử dụng icon `Smile` màu vàng hổ phách (`text-amber-500 bg-amber-50/50`).
*   **Check-in (Địa điểm):** Sử dụng icon `MapPin` màu hồng đào (`text-rose-500 bg-rose-50/50`).
*   **Bình chọn (Poll):** Sử dụng icon `BarChart2` màu tím Violet (`text-violet-500 bg-violet-50/50`).
*   **Nút Đăng bài (Submit Button):** Thiết kế dạng gradient tím sang trọng (`bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700`).

### 3.3. Quy chuẩn Hệ thống Biểu tượng Cảm xúc (Reactions Emojis)
Tuyệt đối không sử dụng icon vector tĩnh (Lucide) cho hệ thống Reaction bài viết. Bắt buộc sử dụng bộ ảnh thực tế lưu tại `public/reactions/` để đảm bảo độ nhận diện và kết hợp tốt với hiệu ứng nảy (Bouncy Pop) chân thực nhất:
*   `Like`: `/reactions/like.png`
*   `Love`: `/reactions/love.png`
*   `Haha`: `/reactions/haha.png`
*   `Wow`: `/reactions/wow.png`
*   `Sad`: `/reactions/sad.png`
*   `Angry`: `/reactions/angry.png`

**Quy chuẩn nút bấm tương tác (Action Buttons):**
*   **Nút Like (Khi đã nhấn Active):** Bắt buộc sử dụng tông màu hồng rực rỡ (`text-rose-600 bg-rose-50`) để tạo sự khác biệt hoàn toàn với màu xanh truyền thống.
*   **Nút Bình luận / Chia sẻ:** Sử dụng màu chữ xám tối ưu (`text-slate-600`), khi Hover sẽ đổi nền mềm mại (`hover:bg-slate-50`).

---

## 🚪 4. Phân tích & Giải pháp Cải tiến Chi tiết 3 Màn hình Cốt lõi

### 🔑 Màn hình Đăng nhập & Đăng ký (`Login2.png`)
*   **Bố cục Notion Slate:** Nền xám nhạt `bg-slate-50`, khung đăng nhập trắng muốt nổi bật ở trung tâm.
*   **Focus Glassmorphic Glow:** Khi người dùng nhấp (focus) vào ô Email hay Mật khẩu, đường viền sẽ tự động chuyển màu mượt mà kết hợp hiệu ứng hào quang phát sáng nhẹ:
    ```css
    box-shadow: 0 0 15px rgba(37, 99, 235, 0.08);
    border-color: hsl(var(--primary));
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    ```
*   **Google Button Hover State:** Thêm hiệu ứng Hover Lift: Khi rê chuột vào nút Đăng nhập với Google, nút sẽ tự nâng lên `1px` (`transform: translateY(-1px)`), phóng to `1.01x` và làm sáng viền mờ bằng hiệu ứng chuyển động 200ms để tăng tương tác chạm.
*   **Password Indicator:** Trình kiểm tra độ mạnh mật khẩu thời gian thực (Password Strength Meter) trên trang Đăng ký sẽ thay đổi màu sắc và chiều dài mượt mà dạng fill-bar sinh động.

---

### 🏠 Giao diện Trang chủ News Feed (`TrangChu4.png`)
*   **Create Post Card:** Hộp tạo bài viết thông minh hỗ trợ kéo thả tệp tin trực tiếp. Tích hợp thanh công cụ 4 nhóm màu chuẩn chỉ.
*   **Post Cards & Image Grid:**
    *   *Grid Ảnh linh hoạt:* Kết xuất thông minh lưới ảnh từ 1 đến 4 ảnh. Nếu bài đăng có 5 ảnh trở lên, tấm ảnh thứ 4 sẽ hiển thị một lớp phủ mờ kính tinh xảo kèm huy hiệu `+N` (Ví dụ: `+2`) để khớp hoàn hảo hành vi của các mạng xã hội hàng đầu.
    *   *Giới hạn chiều cao:* Toàn bộ ảnh hiển thị được giới hạn chiều cao tối đa `max-h-[500px]` và áp dụng thuộc tính `object-cover` để tránh làm vỡ bố cục dòng thời gian.
*   **Interactive Placeholder Toasts:**
    *   Bất kỳ phím hành động hoặc menu nào chưa liên kết Backend API đều được thiết lập sự kiện kích hoạt **Glassmorphic Floating Toast** bắn ra thông báo: *“Tính năng đang phát triển và sẽ ra mắt ở Phase tiếp theo!”* giúp người dùng không cảm giác app bị treo mà cực kỳ sống động.

---

### 👤 Giao diện Trang cá nhân (`Giaodientrangcanhan.png`)
*   **Phối màu Slate Light:** Khung Cover Photo và Avatar chân thực nổi bật trên nền Slate nhã nhặn.
*   **Online Status Ripple Pulse:** Chấm xanh online ở Avatar sẽ có hiệu ứng **Ripple Pulse** nhấp nháy phát tỏa vô hạn để giao diện sinh động:
    ```css
    @keyframes ripple {
      0% { transform: scale(0.8); opacity: 0.5; }
      100% { transform: scale(2.4); opacity: 0; }
    }
    ```
*   **Interactive Tabs Slider:** Khi di chuyển giữa các tab `Posts`, `About`, `Friends`, `Photos`, đường gạch chân chỉ thị màu xanh dương sẽ trượt mượt mà (slide transition) sang tab mới thay vì biến mất và xuất hiện đột ngột.
*   **Verified Badge Tooltip:** Khi di chuột vào tích xanh xác minh bên cạnh tên, hiển thị một Tooltip nhỏ sang trọng: *"Tài khoản đã xác minh chính chủ Connect"*.

---

## 🚨 5. Tiêu chuẩn Kiểm định UI/UX Nghiêm ngặt (Checklist)
Để đảm bảo giao diện luôn đạt tiêu chuẩn Premium trước khi bàn giao, mọi thành phần giao diện phải được đối chiếu với checklist sau:

- [ ] **1. Touch Targets (Kích thước chạm):** Mọi nút bấm, link liên kết trên thiết bị di động phải đạt kích thước tối thiểu **44x44 pt** để tránh bấm nhầm.
- [ ] **2. Font Pairing Rules:** Tuyệt đối tuân thủ cặp font `Outfit` (Tiêu đề) và `Inter` (Nội dung). Cấm sử dụng font hệ thống mặc định của trình duyệt.
- [ ] **3. No Emojis for System Icons:** Không dùng biểu tượng cảm xúc (emoji) làm icon hệ thống. Bắt buộc dùng bộ icon vector đồng bộ của **Lucide React**.
- [ ] **4. Accessibility (Độ tương phản WCAG AA):** Mọi chữ viết trên nền sáng phải đảm bảo tỷ lệ tương phản tối thiểu **4.5:1** để người khiếm thị dễ dàng đọc được (ví dụ: chữ Slate 800 trên nền xám nhạt).
- [ ] **5. Motion Budget (Tốc độ chuyển động):** Mọi hiệu ứng hover, transition, modal zoom phải nằm trong khoảng **150ms đến 300ms** sử dụng hàm timing `cubic-bezier(0.4, 0, 0.2, 1)` (mượt mà, tự nhiên), cấm dùng các hiệu ứng giật cục hoặc quá chậm.

---

## ⚡ 6. Quy chuẩn Kỹ thuật Tương tác Bậc cao (Advanced Interaction Specs)
Để đạt được cảm giác "Realtime mượt mà" ngang tầm Facebook, toàn bộ các chức năng Tương tác (Like, Comment, Dropdown, Tooltip) sau này đều phải tuân thủ nghiêm ngặt 3 nguyên tắc vàng sau:

### 6.1. Optimistic UI Updates (Cập nhật giao diện lạc quan)
*   **Nguyên tắc:** KHÔNG BAO GIỜ bắt người dùng phải chờ API trả về thành công mới đổi trạng thái UI.
*   **Áp dụng:** Khi bấm Like bài viết hoặc Gửi bình luận, UI phải ngay lập tức chuyển trạng thái sang `Active` hoặc chèn bình luận mới vào danh sách ảo (như thông qua `onMutate` của React Query) với độ trễ 0ms. Nếu API bị lỗi, tự động Rollback (trả lại trạng thái cũ) và báo lỗi nhỏ qua Toast.

### 6.2. Invisible Padding Bridge (Cầu nối tàng hình chống rớt Hover)
*   **Nguyên tắc:** Các Popup/Dropdown hiện ra khi Hover tuyệt đối không được có khe hở vật lý gây ra hiện tượng "sụp đổ" (Drop) khi người dùng di chuyển chuột từ Nút kích hoạt sang Popup.
*   **Áp dụng:** Bắt buộc sử dụng Padding trong suốt (`pb-X` hoặc `pt-X`) để mở rộng diện tích tương tác (Hit-area), tạo thành "cây cầu vô hình" nối liền Nút và Popup. (Ví dụ: `pb-4 bottom-full` trên thanh Emoji Bar).

### 3. Bouncy Micro-animations (Chuyển động có hồn)
- **Tư duy:** UI tĩnh là UI chết. Mọi thao tác click/hover đều phải có phản hồi thị giác.
- **Giải pháp:** Sử dụng CSS `@keyframes` với quỹ đạo `cubic-bezier(0.175, 0.885, 0.32, 1.275)` để tạo độ nảy (Pop-In Bouncy).
- **Ứng dụng:** Khi người dùng thả cảm xúc, nút icon phải bật lên 1 phát rồi mới rớt xuống, mô phỏng phản hồi vật lý.

### 4. Magic UX Image Compression (Zero-Friction Uploads)
- **Tư duy:** Không bao giờ dùng Hard Limit (ví dụ chặn 5MB) để block người dùng tải ảnh lớn từ điện thoại hiện đại. Việc báo lỗi file lớn là một trải nghiệm cực kỳ ức chế (Friction).
- **Giải pháp:** Mở rộng cổng giới hạn dung lượng lên tới **20MB** để đón nhận mọi bức ảnh. Âm thầm sử dụng **Web Worker** ở luồng nền để nén ảnh (Client-side) xuống `<1MB`, ép toàn bộ sang định dạng `WebP` siêu nhẹ và bypass ảnh `.gif`.
- **Trải nghiệm:** Người dùng cảm thấy ném ảnh to cỡ nào vào tải lên cũng siêu mượt mà không hề biết trình duyệt đã tự động bóp dung lượng giúp bảo vệ Server khỏi bị tràn RAM (OOM).

### 6.3. Bouncy Micro-animations (Chuyển động đàn hồi Cubic-Bezier)
*   **Nguyên tắc:** Các hiệu ứng hiện cửa sổ (như thanh cảm xúc, popup thông báo) không được bật ra một cách cứng nhắc, mà phải có độ nảy nhẹ, trơn tru tạo cảm giác sống động (Pop-in).
*   **Áp dụng:** Bắt buộc sử dụng CSS Keyframes kết hợp với hàm biến thiên `cubic-bezier` tùy chỉnh vượt ngưỡng (overshoot) để tạo độ nảy.
    ```css
    @keyframes bouncy-pop {
      0% { transform: scale(0.8) translateY(10px); opacity: 0; }
      50% { transform: scale(1.05) translateY(-2px); opacity: 0.8; }
      100% { transform: scale(1) translateY(0); opacity: 1; }
    }
    .animate-bouncy-pop {
      animation: bouncy-pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    }

### 6.4. Real-Time Chat & Status Syncing (Trải nghiệm Chat Real-Time & Trạng thái Tin nhắn)
*   **Nguyên tắc Trực quan:** Mọi tin nhắn đều phải có chỉ báo trạng thái thời gian thực tương ứng để người gửi luôn nắm được tiến trình gửi nhận.
*   **Chỉ báo trạng thái tin nhắn (Message Status Indicators):**
    *   **PENDING (Đang gửi - ⏱️):** Hiển thị ngay lập tức khi người dùng click gửi (lớp mờ hoặc icon xoay nhẹ).
    *   **SENT (Đã gửi - ✓):** Đổi thành icon 1 dấu check xám nhạt khi server đã nhận và lưu vào MongoDB thành công.
    *   **DELIVERED (Đã nhận - ✓✓):** Đổi thành icon 2 dấu check khi thiết bị của người nhận đang online và nhận được tin qua WebSocket.
    *   **SEEN (Đã xem - 👁️ / Avatar):** Đổi thành avatar nhỏ hoặc icon con mắt xanh dương dịu mát khi người nhận mở cửa sổ chat hoặc đang active trong cuộc hội thoại đó.
*   **Trợ năng cho Icon Trạng thái (A11y Compliance):** Do các icon vector không tự động hỗ trợ mô tả âm thanh, tất cả các icon trạng thái tin nhắn bắt buộc phải được bao bọc bằng thẻ `span` chứa thuộc tính `title` mô tả trạng thái (ví dụ: `title="Đã xem"`, `title="Đang gửi"`) để hỗ trợ người dùng sử dụng trình đọc màn hình.
*   **Presence (Đèn báo Trạng thái Hoạt động):** Đèn báo trạng thái hoạt động màu xanh lá cây (`bg-green-500`) trên avatar bạn bè phải nhấp nháy tỏa bóng mờ (`animate-pulse`) để báo hiệu trạng thái hoạt động thời gian thực (Heartbeat).

### 6.5. Real-Time Sound Feedback & Browser Autoplay Guidelines (Âm thanh phản hồi thời gian thực)
*   **Nguyên tắc Phản hồi Thính giác:** Âm thanh phải dễ chịu, có độ dài ngắn dưới 2 giây và được phân loại rõ ràng theo ngữ cảnh để tránh gây mệt mỏi cho thính giác (alert fatigue).
*   **Quy chuẩn Âm thanh:**
    *   **Tin nhắn mới (New Message):** Sử dụng âm thanh bong bóng pop đặc trưng của Messenger (`message.mp3`).
    *   **Thông báo mới (Social Notification):** Sử dụng tiếng chuông chime chuẩn của Facebook (`notification.mp3`).
*   **Âm lượng (Volume Spec):** Âm lượng mặc định được giới hạn ở mức **50% (0.5)** để đảm bảo âm thanh rõ ràng nhưng không đột ngột gây giật mình.
*   **Cơ chế Chặn Tiếng Ồn Trùng Lặp (Sender Filter):** Khi chính người dùng hiện tại thực hiện hành động (như gửi tin nhắn), tuyệt đối không được phát âm thanh tin nhắn mới. Chỉ phát khi nhận được tin nhắn từ người khác.
*   **Bảo vệ Autoplay của Trình duyệt (Autoplay Protection):** 
    *   Các trình duyệt hiện đại (Chrome, Safari) cấm phát âm thanh tự động nếu người dùng chưa tương tác với trang.
    *   Bắt buộc bao bọc lệnh phát âm thanh `.play()` trong khối `try-catch` và chuỗi `.catch(error => ...)` để bỏ qua các lỗi này một cách âm thầm, ngăn chặn hoàn toàn việc crash ứng dụng do chính sách bảo mật trình duyệt.

### 6.6. 6-Digit OTP Verification UX (Quy chuẩn ô nhập mã xác thực OTP 6 số)
*   **Nguyên tắc Giao diện:** Giao diện xác thực mã OTP phải gồm 6 ô vuông nhập số riêng biệt được căn giữa (`justify-center`).
*   **Quản lý Con trỏ (Focus Flow):**
    *   **Auto-Focus:** Tự động tập trung con trỏ vào ô nhập số đầu tiên khi màn hình xác thực được hiển thị.
    *   **Auto-Advance:** Khi gõ một chữ số hợp lệ, con trỏ phải tự động nhảy sang ô kế tiếp bên phải.
    *   **Auto-Retreat:** Khi bấm phím xoá `Backspace`, nếu ô hiện tại đang trống, con trỏ phải tự động lùi về ô trước đó bên trái và xoá ký tự.
    *   **Paste Support:** Cho phép người dùng dán (Paste) trực tiếp mã 6 số từ Clipboard. Trình duyệt tự phân tách 6 chữ số và điền đầy vào 6 ô tương ứng.
*   **Bảo mật:** Chỉ chấp nhận nhập chữ số (`0-9`), chặn các ký tự chữ cái hoặc ký tự đặc biệt ngay khi gõ.
*   **Timer & Resend:** Hiển thị bộ đếm ngược 60 giây và chỉ cho phép click gửi lại mã OTP sau khi bộ đếm đã về 0.

### 6.7. Facebook-Style Split-Pane Modal & Hover Scoping UX (Sprint 6.1)
*   **Facebook-Style Split-Pane Modal:** Khi bấm vào phần bình luận của bài viết, hiển thị Modal 2 cột (Trái: Nội dung hình ảnh/carousel hoặc khung chữ tím khói trích dẫn `bg-[#F4F0FD]` thương hiệu Hizo; Phải: Danh sách bình luận cuộn độc lập và thanh nhập liệu).
*   **Mờ nền (Backdrop Blur):** Áp dụng hiệu ứng mờ nền nhã nhặn `backdrop-blur-[6px] bg-slate-950/50` thay vì các màu xanh dương/xám quá đậm che khuất tầm mắt người dùng.
*   **Reaction Hover Scoping (Khoanh vùng kích hoạt Hover cảm xúc):** Cấu hình sự kiện `onMouseEnter` / `onMouseLeave` của bảng tương tác biểu cảm nằm gói gọn duy nhất trong nút Like (Thích). Rê chuột qua các nút lân cận như Bình luận (Comment) hay Chia sẻ (Share) tuyệt đối không được kích hoạt bảng Reaction Picker.
*   **A11y cho Slide & Modal:** Mọi nút đóng Modal, nút điều hướng Slide trước/sau bắt buộc phải có thuộc tính `title` và `aria-label` tương ứng để phục vụ các công cụ đọc màn hình.

