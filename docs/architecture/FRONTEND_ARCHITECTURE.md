# 🏗️ Hướng dẫn Kiến trúc Frontend - MiniFaceBook

Tài liệu này định hình quy chuẩn kiến trúc thư mục, quy tắc tổ chức code và cơ chế hoạt động của hệ thống Frontend **MiniFaceBook** sử dụng bộ ba: **React 19 + TypeScript + Vite + Tailwind CSS v4**.

---

## 🧭 1. Triết lý Kiến trúc: Modular Phân Lớp (Modular Architecture)
Để tránh tình trạng dự án bị phình to và biến thành "spaghetti code", Frontend của MiniFaceBook áp dụng triết lý **Modular Phân lớp** (đóng gói nghiệp vụ khép kín), đối chiếu song song **1:1** với Clean Architecture của Backend.

```
frontend/
└── src/
    ├── core/               # Trái tim ứng dụng (Hạ tầng, Interceptors, Global Types)
    ├── components/         # UI Elements dùng chung toàn cục (Atomic UI Components)
    └── modules/            # Các Module nghiệp vụ khép kín (Auth, Feed, Profile)
```

---

## 📂 2. Đặc tả Chi tiết Cấu trúc Thư mục

### 📁 A. Thư mục `core/` (Cơ sở hạ tầng Stateless)
Nơi quản lý các cấu hình toàn cục, không phụ thuộc vào trạng thái nghiệp vụ cụ thể.
*   `core/api/`: Khởi tạo Axios Instance (`axiosClient.ts`). Cấu hình global interceptors để tự động bắt lỗi `401` và gọi API `/auth/refresh` để **Silent Refresh (Xoay vòng token ngầm)**.
*   `core/config/`: Định nghĩa các biến môi trường (`env.ts`), hằng số toàn cục (`constants.ts`).
*   `core/theme/`: Khởi tạo và quản lý hệ thống màu sắc HSL Dark Mode và các biến Design Tokens CSS.
*   `core/types/`: Khởi tạo kiểu dữ liệu TypeScript toàn cục (User, Post, Comment...).

### 📁 B. Thư mục `components/` (Thành phần UI dùng chung)
Các component tái sử dụng nhiều nơi, được chia nhỏ theo mô hình nguyên tử (Atomic-ish Design):
*   `components/ui/`: Nơi shadcn/ui sinh ra (Button, Input, Card, Dialog, Badge...). Đây là các component cấm chứa logic nghiệp vụ (pure view).
*   `components/layout/`: Quản lý bộ khung hiển thị chính (Sidebar Nav, Header, StickyContainer, Responsive Grid).
*   `components/feedback/`: Quản lý các trạng thái phản hồi trực quan (Skeleton Loaders, Ripple Effect, Alert Notifications).

### 📁 C. Thư mục `modules/` (Đóng gói nghiệp vụ khép kín - QUAN TRỌNG)
Tất cả các tính năng nghiệp vụ lớn được phân tách thành từng thư mục con độc lập:
*   `modules/auth/`: Module Xác thực và Đăng ký.
*   `modules/feed/`: Module Trang chủ và Dòng thời gian.
*   `modules/profile/`: Module Trang cá nhân người dùng.

Mỗi thư mục module nghiệp vụ con **bắt buộc phải tuân thủ** cấu trúc con khép kín như sau:
```
modules/auth/
├── components/     # Các Component con nội bộ (LoginForm, RegisterForm, PasswordStrength)
├── hooks/          # Custom Hooks TanStack Query quản lý state (useLogin, useRegister)
├── services/       # Trình gọi các Endpoint API cụ thể (authService.ts)
└── schemas/        # Định nghĩa các Schema validate bằng Zod (authSchema.ts)
```

---

## 🚨 3. Quy tắc Coding Nghiêm ngặt (Coding Guidelines)

1.  **Quy tắc Độc lập Module:** Các module trong `modules/` không được phép import chéo trực tiếp các component nội bộ của nhau. Nếu cần chia sẻ dữ liệu hoặc component, chúng phải được đưa lên thư mục `components/` dùng chung hoặc `core/types/` toàn cục.
2.  **Quy tắc Validate Dữ liệu:** Tất cả dữ liệu nhập liệu từ người dùng (Forms) bắt buộc phải được validate ở tầng Client thông qua **Zod Schemas** (`schemas/`) trước khi gửi lên API, đảm bảo dữ liệu sạch 100%.
3.  **Quy tắc Stateless Component:** Các component nằm trong `components/ui/` bắt buộc phải là stateless (chỉ nhận props và render), không được phép chứa logic gọi API hoặc kết nối với TanStack Query.
4.  **Quy tắc Custom Hook (TanStack Query):** Cấm gọi trực tiếp `useQuery` hay `useMutation` ở file UI chính. Toàn bộ logic tương tác API phải được đóng gói gọn gàng thành các Custom Hooks (nằm trong thư mục `hooks/` của module đó) để tối ưu tính tái sử dụng và kiểm thử (testing).

---

## ⚡ 4. Đặc tả Kỹ thuật Axios Client (`core/api/axiosClient.ts`)
Để hệ thống bảo mật HttpOnly Cookies hoạt động trơn tru và chống lại các lỗi Race Condition phức tạp, tệp tin `axiosClient.ts` bắt buộc phải được triển khai theo đặc tả kỹ thuật dưới đây:

### 🚀 A. Cấu hình CORS & Credentials (Cực kỳ quan trọng)
Vì Backend và Frontend chạy khác Origin (Cổng 8080 vs 5173), trình duyệt sẽ mặc định block toàn bộ cookie HttpOnly trừ khi cấu hình đồng thời:
*   **Frontend Axios:** Phải kích hoạt thuộc tính `withCredentials: true` toàn cục:
    ```typescript
    const axiosClient = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
      withCredentials: true, // Cho phép gửi và lưu trữ HttpOnly Cookies xuyên suốt domain
      headers: {
        'Content-Type': 'application/json',
      },
    });
    ```
*   **Backend Spring Boot:** Cấu hình CORS bắt buộc phải set `allowCredentials(true)` và chỉ định chính xác Origin của Frontend (Không được dùng dấu sao `*` khi cho phép credentials).

### 🚀 B. Cơ chế Hàng đợi Mutex Lock chống "Bão Request" (Token Refresh Storm)
*   **Vấn đề thực tế:** Khi load một trang phức tạp (ví dụ: Trang chủ), Frontend sẽ gọi đồng thời 5 API. Nếu Access Token vừa hết hạn, cả 5 API này sẽ đồng loạt nhận lỗi `401` và đồng thời gọi API `/auth/refresh` 5 lần cùng lúc. Điều này sẽ khiến cơ chế **Refresh Token Rotation (RTR)** hiểu lầm là có Replay Attack và khóa sạch tài khoản của người dùng!
*   **Giải pháp Mutex Queue:** Sử dụng cờ `isRefreshing` làm ổ khóa (Mutex Lock) và mảng `failedQueue` để tạm giữ các request bị trễ:

```typescript
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Axios Response Interceptor
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Nếu gặp lỗi 401 và request chưa được thử lại
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Nếu đang có 1 tiến trình đi xin token mới, đưa request này vào hàng đợi chờ đợi
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return axiosClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      return new Promise((resolve, reject) => {
        axiosClient.post('/auth/refresh') // Gọi API refresh token
          .then(() => {
            processQueue(null);
            resolve(axiosClient(originalRequest)); // Gửi lại request ban đầu
          })
          .catch((err) => {
            processQueue(err, null);
            // Xóa cookie cục bộ, đẩy người dùng ra trang Đăng nhập
            window.location.href = '/login';
            reject(err);
          })
          .finally(() => {
            isRefreshing = false;
          });
      });
    }

    return Promise.reject(error);
  }
);
```

---

## ⚡ 5. Bài học thực chiến & Giải pháp khắc phục lỗi nghiêm ngặt (Troubleshooting & Lessons Learned)

Trong quá trình khởi tạo và vận hành máy chủ phát triển Vite với TypeScript, nhóm phát triển đã đúc rút được hai bài học kỹ thuật cốt lõi giúp hệ thống vận hành ổn định tuyệt đối:

### 🚀 A. Ràng buộc import type nghiêm ngặt do `verbatimModuleSyntax`
*   **Triệu chứng lỗi:** Trình duyệt trắng xóa màn hình kèm thông báo runtime lỗi:
    ```bash
    SyntaxError: The requested module '/src/modules/auth/schemas/authSchema.ts' does not provide an export named 'LoginInput'
    ```
*   **Nguyên nhân:** Cấu hình `tsconfig.json` bật cờ `"verbatimModuleSyntax": true` để tối ưu hóa kích thước bundle. Khi đó, trình biên dịch bắt buộc phải phân biệt rõ ràng giữa biến giá trị chạy ở runtime và kiểu dữ liệu (type) chạy ở compile-time. Nếu import chung, ESBuild sẽ giữ nguyên dòng import đó trong file JS kết quả, khiến trình duyệt báo lỗi vì không tìm thấy export runtime.
*   **Giải pháp chuẩn mực:** Tách biệt tuyệt đối import type bằng từ khóa `type`:
    ```typescript
    // ✅ Chuẩn (Loại bỏ hoàn toàn type khi biên dịch sang JS chạy ở trình duyệt)
    import { loginSchema } from '../schemas/authSchema';
    import type { LoginInput } from '../schemas/authSchema';
    ```

### 🚀 B. Cú pháp trích xuất danh sách lỗi chuẩn của ZodError (`.issues` thay vì `.errors`)
*   **Triệu chứng lỗi:** TypeScript báo lỗi không tìm thấy thuộc tính:
    ```bash
    Property 'errors' does not exist on type 'ZodError<...>'
    ```
*   **Nguyên nhân:** Trong các phiên bản Zod hiện đại, toàn bộ danh sách các trường dữ liệu vi phạm kiểm thử được định nghĩa trong mảng `.issues` chứ không phải `.errors`.
*   **Giải pháp chuẩn mực:** Sử dụng `.issues` để duyệt qua từng lỗi chi tiết của input:
    ```typescript
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: { [key: string]: string } = {};
      result.error.issues.forEach((err) => { // ✅ Chuẩn ZodError.issues
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
    }
    ```
