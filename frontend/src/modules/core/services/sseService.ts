/**
 * SSE (Server-Sent Events) service wrapper.
 *
 * <p>Quản lý EventSource connections, tự động reconnect khi lỗi, và cleanup.
 * Hỗ trợ nhiều subscribers trên cùng một URL (connection được share).
 *
 * <p>Lưu ý: SSE chỉ one-way (server → client). Client gửi request qua REST.
 */
const BACKEND_ORIGIN = 'http://localhost:8080';

/**
 * Lấy JWT token từ localStorage (key 'accessToken').
 * Nếu không có, trả về null.
 */
function getAccessToken(): string | null {
  try {
    return localStorage.getItem('accessToken') || null;
  } catch {
    return null;
  }
}

export class SseService {
  private connections = new Map<string, EventSource>();
  private listeners = new Map<string, Set<(data: any) => void>>();

  /**
   * Subscribe vào một SSE endpoint.
   *
   * @param url URL của SSE endpoint (ví dụ: /api/events/notifications)
   * @param callback Hàm xử lý khi nhận event
   * @returns Hàm unsubscribe để dọn dẹp
   */
  subscribe<T>(url: string, callback: (data: T) => void): () => void {
    // Nếu đã có connection cho URL này, thêm listener
    let eventSource = this.connections.get(url);
    if (!eventSource) {
      // Build absolute URL with token query param if available
      const token = getAccessToken();
      let absoluteUrl = `${BACKEND_ORIGIN}${url}`;
      if (token) {
        const separator = url.includes('?') ? '&' : '?';
        absoluteUrl += `${separator}access_token=${encodeURIComponent(token)}`;
      }
      console.log('[SseService] Connecting to:', absoluteUrl);
      eventSource = new EventSource(absoluteUrl, { withCredentials: true });
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const callbacks = this.listeners.get(url);
          if (callbacks) {
            callbacks.forEach((cb) => cb(data));
          }
        } catch (err) {
          console.error('[SseService] Failed to parse SSE message:', err, event.data);
        }
      };
      eventSource.onerror = (err) => {
        console.error('[SseService] SSE connection error:', err);
        // Browser tự động reconnect, chỉ log lỗi
      };
      eventSource.onopen = () => {
        console.log('[SseService] SSE connection opened:', url);
      };
      this.connections.set(url, eventSource);
    }

    // Thêm callback vào listeners
    if (!this.listeners.has(url)) {
      this.listeners.set(url, new Set());
    }
    this.listeners.get(url)!.add(callback as (data: any) => void);

    // Trả về hàm unsubscribe
    return () => {
      const callbacks = this.listeners.get(url);
      if (callbacks) {
        callbacks.delete(callback as (data: any) => void);
        if (callbacks.size === 0) {
          // Không còn listener nào trên connection này → đóng
          eventSource?.close();
          this.connections.delete(url);
          this.listeners.delete(url);
        }
      }
    };
  }

  /**
   * Tắt tất cả connections.
   */
  disconnectAll() {
    this.connections.forEach((es) => es.close());
    this.connections.clear();
    this.listeners.clear();
  }
}

export const sseService = new SseService();
