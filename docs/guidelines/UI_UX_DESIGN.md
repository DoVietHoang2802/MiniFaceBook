# 💎 Hướng dẫn Thiết kế Hệ thống UI/UX Premium - MiniFaceBook

Tài liệu này ghi nhận toàn bộ triết lý thiết kế, quy chuẩn kỹ thuật, hệ thống Design Tokens và các giải pháp cải tiến giao diện đột phá được đúc kết từ cẩm nang **[ui-ux-pro-max](file:///d:/Project_MiniFace/.antigravity/skills/ui-ux-pro-max/SKILL.md)** áp dụng riêng cho dự án **MiniFaceBook**.

---

## 🎨 1. Triết lý Thiết kế Chủ đạo
MiniFaceBook hướng tới trải nghiệm giải trí xã hội hiện đại, lôi cuốn và mượt mà tuyệt đối. Dự án tuân thủ 3 nguyên tắc cốt lõi:
1.  **Sleek Dark Mode:** Giao diện tối sang trọng, giảm thiểu mỏi mắt, tăng cường độ tương phản và tạo chiều sâu không gian (Depth Elevation).
2.  **Soft UI Evolution:** Các hình khối, thẻ (Cards), nút bấm (Buttons) được bo góc mềm mại, sử dụng bóng mờ tinh tế và đường viền siêu mảnh thay vì các đường kẻ thô cứng.
3.  **Responsive-First & Touch-Friendly:** Đảm bảo hiển thị hoàn hảo trên mọi kích thước màn hình và tối ưu hóa diện tích tương tác chạm trên thiết bị di động.

---

## 🧱 2. Hệ thống Design Tokens (Màu sắc & Typography)

### Bảng màu HSL tối ưu (Sleek Dark Theme)
Hệ thống màu sắc được thiết kế đặc thù cho mạng xã hội giải trí, sử dụng hệ màu HSL để dễ dàng quản lý độ tương phản:

```css
:root {
  /* Nền và Bề mặt */
  --background: 224 71% 4%;     /* #080C14 - Xanh đen cực sâu, huyền bí */
  --card: 222 47% 7%;           /* #0F1626 - Xanh đen sáng hơn để tạo độ nổi */
  --popover: 222 47% 7%;
  
  /* Điểm nhấn & Thương hiệu */
  --primary: 217.2 91.2% 59.8%;  /* #2563EB - Xanh dương hoàng gia hoàng kim */
  --primary-foreground: 0 0% 100%;
  
  /* Trạng thái Tương tác */
  --muted: 215 20.2% 65.1%;     /* Xám xanh dịu mắt cho văn bản phụ */
  --accent: 217.2 32.6% 17.5%;
  --border: 217.2 32.6% 12%;    /* Đường viền cực mảnh, tinh tế */
  --ring: 217.2 91.2% 59.8%;
  
  /* Trạng thái Hệ thống */
  --success: 142.1 76.2% 36.3%; /* Chấm xanh Online (Ripple Pulse) */
  --warning: 38 92% 50%;        /* Cảnh báo chưa verified (Amber Alert) */
  --destructive: 0 84.2% 60.2%;
}
```

### Typography (Cặp Font chữ Đẳng cấp)
*   **Font Tiêu đề (Headings):** **Outfit** hoặc **Plus Jakarta Sans** (Google Fonts)
    *   *Đặc điểm:* Các nét chữ bo góc tròn trịa, hiện đại, mang lại cảm giác thân thiện, giải trí và vô cùng cao cấp.
*   **Font Nội dung (Body/Inputs):** **Inter**
    *   *Đặc điểm:* Font chữ sans-serif quốc dân, có độ hiển thị cực tốt trên các màn hình độ phân giải thấp, giúp người dùng đọc tin tức lâu không bị mỏi mắt.

---

## 🚪 3. Phân tích & Giải pháp Cải tiến Chi tiết 3 Màn hình Cốt lõi
*(Dựa trên mockup thiết kế tĩnh gốc tại [docs/ui_mockups/](file:///d:/Project_MiniFace/docs/ui_mockups))*

### 🔑 Màn hình Đăng nhập & Đăng ký (`Login2.png`)
*   **Hiện trạng Mockup:** Bố cục cân đối, Logo đẹp mắt, có phân chia Tabs Đăng nhập/Đăng ký rõ ràng, nút Google bắt mắt.
*   **✨ Giải pháp Cải tiến Chuyển động (Motion Specs):**
    *   **Focus Glassmorphic Glow:** Khi người dùng nhấp (focus) vào ô Email hay Mật khẩu, đường viền sẽ tự động chuyển màu mượt mà kết hợp hiệu ứng hào quang phát sáng nhẹ:
        ```css
        box-shadow: 0 0 15px rgba(37, 99, 235, 0.15);
        border-color: hsl(var(--primary));
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        ```
    *   **Google Button Hover State:** Thêm hiệu ứng Hover Lift: Khi rê chuột vào nút Đăng nhập với Google, nút sẽ tự nâng lên `1px` (`transform: translateY(-1px)`), phóng to `1.01x` và làm sáng viền mờ bằng hiệu ứng chuyển động 200ms để tăng tương tác chạm.
    *   **Password Indicator:** Trình kiểm tra độ mạnh mật khẩu thời gian thực (Password Strength Meter) trên trang Đăng ký sẽ thay đổi màu sắc và chiều dài mượt mà dạng fill-bar sinh động.

---

### 🏠 Giao diện Trang chủ News Feed (`GiaoDienChinh.png`)
*   **Hiện trạng Mockup:** Cấu trúc 3 cột hoàn chỉnh, có thanh điều hướng trái, ô đăng bài viết, danh sách Post Card đẹp mắt và Skeleton Loader cực kỳ chuyên nghiệp.
*   **✨ Giải pháp Cải tiến Chuyển động (Motion Specs):**
    *   **Sticky Sidebar & Widgets:**
        *   Cột Trái (Sidebar Navigation) và Cột Phải (Suggested Friends) sử dụng thuộc tính:
            ```css
            position: sticky;
            top: 1rem;
            height: calc(100vh - 2rem);
            overflow-y: auto;
            ```
        *   *Kết quả:* Khi người dùng cuộn xem bài viết ở cột giữa, menu điều hướng và widget gợi ý kết bạn vẫn đứng im cố định, tạo cảm giác vô cùng chắc chắn và chuyên nghiệp.
    *   **Skeleton Loader Shimmer:** Post Skeleton Loader sẽ sử dụng hiệu ứng `animate-pulse` kết hợp với gradient dịch chuyển ngầm (Shimmer Wave Effect) chạy qua các khối xám để mang lại cảm giác tốc độ tải trang nhanh vượt trội.
    *   **Create Post Modal Zoom:** Khi click vào ô nhập bài viết "What's on your mind, Alex?", một Dialog (Modal) sẽ zoom nhẹ mượt mà từ tâm ô input, hỗ trợ khu vực kéo thả (Drag and Drop Area) để đăng tải ảnh/video trực quan.

---

### 👤 Giao diện Trang cá nhân (`Giaodientrangcanhan.png`)
*   **Hiện trạng Mockup:** Cover Photo rộng lớn, Avatar có chấm online nổi bật, Verified Badge màu xanh dương uy tín bên cạnh tên, bố cục phân tách Info bên trái và Posts bên phải rất gọn gàng.
*   **✨ Giải pháp Cải tiến Chuyển động (Motion Specs):**
    *   **Online Status Ripple Pulse:** Chấm xanh online ở Avatar sẽ có hiệu ứng **Ripple Pulse** nhấp nháy phát tỏa vô hạn để giao diện có hồn:
        ```css
        @keyframes ripple {
          0% { transform: scale(0.8); opacity: 0.5; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        ```
    *   **Interactive Tabs Slider:** Khi di chuyển giữa các tab `Posts`, `About`, `Friends`, `Photos`, đường gạch chân chỉ thị màu xanh dương sẽ trượt mượt mà (slide transition) sang tab mới thay vì biến mất và xuất hiện đột ngột.
    *   **Verified Badge Tooltip:** Khi di chuột vào tích xanh xác minh bên cạnh tên, hiển thị một Tooltip nhỏ sang trọng: *"Tài khoản đã xác minh chính chủ"*.

---

## 🚨 4. Tiêu chuẩn Kiểm định UI/UX Nghiêm ngặt (Checklist)
Để đảm bảo giao diện luôn đạt tiêu chuẩn Premium trước khi bàn giao, mọi thành phần giao diện phải được đối chiếu với checklist sau:

- [ ] **1. Touch Targets (Kích thước chạm):** Mọi nút bấm, link liên kết trên thiết bị di động phải đạt kích thước tối thiểu **44x44 pt** để tránh bấm nhầm.
- [ ] **2. Font Pairing Rules:** Tuyệt đối tuân thủ cặp font `Outfit` (Tiêu đề) và `Inter` (Nội dung). Cấm sử dụng font hệ thống mặc định của trình duyệt.
- [ ] **3. No Emojis for System Icons:** Không dùng biểu tượng cảm xúc (emoji) làm icon hệ thống. Bắt buộc dùng bộ icon vector đồng bộ của **Lucide React** hoặc **Heroicons**.
- [ ] **4. Accessibility (Độ tương phản WCAG AA):** Mọi chữ viết trên nền tối phải đảm bảo tỷ lệ tương phản tối thiểu **4.5:1** để người khiếm thị hoặc người dùng ban đêm dễ dàng đọc được.
- [ ] **5. Motion Budget (Tốc độ chuyển động):** Mọi hiệu ứng hover, transition, modal zoom phải nằm trong khoảng **150ms đến 300ms** sử dụng hàm timing `cubic-bezier(0.4, 0, 0.2, 1)` (mượt mà, tự nhiên), cấm dùng các hiệu ứng giật cục hoặc quá chậm.
