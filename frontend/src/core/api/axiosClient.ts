import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { Sentry } from '../monitoring/sentry';

// Định nghĩa interface cho hàng đợi các request bị trễ
interface FailedRequest {
  resolve: (token: string | null) => void;
  reject: (error: any) => void;
}

// Khởi tạo Axios client với cấu hình CORS Credentials chuẩn doanh nghiệp
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  withCredentials: true, // Bắt buộc gửi và lưu trữ HttpOnly Cookies xuyên suốt domain
});

let isRefreshing = false;
let failedQueue: FailedRequest[] = [];



// Hàm xử lý duyệt hàng đợi request khi lấy được token mới hoặc lỗi
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

// Response Interceptor: Xử lý lỗi 401 và hàng đợi Mutex Lock chống bão request
axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Nếu gặp lỗi 401 Unauthorized, không phải request refresh/login/register, và chưa từng được thử lại
    if (error.response?.status === 401 && 
        originalRequest && 
        !originalRequest.url?.includes('/auth/refresh') && 
        !originalRequest.url?.includes('/auth/login') && 
        !originalRequest.url?.includes('/auth/register') && 
        !originalRequest._retry) {
      
      // Nếu đang có 1 tiến trình đi xin token mới, đưa request này vào hàng đợi chờ đợi
      if (isRefreshing) {
        return new Promise<string | null>((resolve, reject) => {
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
        axiosClient
          .post('/auth/refresh') // Gọi API xoay vòng Token ngầm (Silent Refresh)
          .then(() => {
            processQueue(null);
            resolve(axiosClient(originalRequest)); // Gửi lại request ban đầu với cookie mới
          })
          .catch((err) => {
            processQueue(err, null);
            // Phát sự kiện tùy biến để thông báo đăng xuất toàn cục trên UI
            window.dispatchEvent(new Event('unauthorized'));
            reject(err);
          })
          .finally(() => {
            isRefreshing = false;
          });
      });
    }

    // 5xx từ API → Sentry (no-op nếu chưa set VITE_SENTRY_DSN)
    if (error.response && error.response.status >= 500) {
      Sentry.captureException(error);
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
