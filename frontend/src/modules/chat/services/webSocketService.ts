import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

/** Một "ý định subscribe" được ghi nhớ để tự đăng ký lại sau mỗi lần (re)connect. */
interface SubscriptionIntent {
  destination: string;
  callback: (data: unknown) => void;
  sub?: StompSubscription;
}

/**
 * WebSocket Service - Quản lý kết nối STOMP với backend.
 *
 * Cơ chế:
 * - Dùng SockJS để gọi /ws (HttpOnly Cookie tự đính kèm).
 * - JWT trong Cookie được backend đọc qua HandshakeInterceptor.
 * - Auto-reconnect khi mất kết nối.
 * - Singleton pattern - 1 connection duy nhất cho toàn app.
 *
 * QUAN TRỌNG (fix Phase 5.1): STOMP tự reconnect nhưng KHÔNG tự đăng ký lại các kênh đã subscribe.
 * Vì vậy service tự ghi nhớ danh sách kênh (intents) và re-subscribe trong onConnect mỗi lần
 * (re)connect — đảm bảo thông báo / tin nhắn realtime không "chết" sau khi server restart hay mạng
 * chập chờn (trước đây phải F5).
 */
class WebSocketService {
  private client: Client | null = null;
  /** Các kênh mong muốn được duy trì, key = id duy nhất. */
  private intents: Map<string, SubscriptionIntent> = new Map();
  private connectionPromise: Promise<void> | null = null;
  private idCounter = 0;

  /**
   * Kết nối WebSocket. Idempotent - gọi nhiều lần chỉ tạo 1 connection.
   */
  connect(): Promise<void> {
    if (this.client?.connected) {
      return Promise.resolve();
    }
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      this.client = new Client({
        webSocketFactory: () =>
          new SockJS('http://localhost:8080/api/ws', null, {
            transports: ['websocket', 'xhr-streaming', 'xhr-polling'],
          }),
        // Cookie tự đính kèm vì SockJS cùng origin (proxy hoặc CORS withCredentials)
        connectHeaders: {},
        reconnectDelay: 5000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        debug: () => {
          // Tắt verbose STOMP logging để tránh lag khi mở DevTools (Sprint 4.5 perf fix)
        },
        onConnect: () => {
          console.log('[WebSocket] Connected');
          // Đăng ký lại TẤT CẢ kênh đã ghi nhớ (xử lý cả lần đầu lẫn reconnect).
          this.resubscribeAll();
          resolve();
        },
        onStompError: (frame) => {
          console.error('[WebSocket] STOMP error:', frame.headers.message);
          reject(new Error(frame.headers.message));
          this.connectionPromise = null;
        },
        onWebSocketError: (event) => {
          console.error('[WebSocket] Connection error:', event);
        },
        onDisconnect: () => {
          console.log('[WebSocket] Disconnected');
          // Đánh dấu các sub cũ không còn hiệu lực (sẽ tạo lại khi onConnect).
          this.intents.forEach((intent) => {
            intent.sub = undefined;
          });
          this.connectionPromise = null;
        },
      });

      this.client.activate();
    });

    return this.connectionPromise;
  }

  /** Tạo subscription STOMP thực sự cho một intent (nếu đang kết nối). */
  private activateIntent(id: string, intent: SubscriptionIntent): void {
    if (!this.client?.connected) return;
    intent.sub = this.client.subscribe(intent.destination, (msg: IMessage) => {
      try {
        intent.callback(JSON.parse(msg.body));
      } catch (e) {
        console.error('[WebSocket] Failed to parse message:', e);
      }
    });
    this.intents.set(id, intent);
  }

  /** Đăng ký lại toàn bộ kênh đã ghi nhớ (gọi trong onConnect). */
  private resubscribeAll(): void {
    this.intents.forEach((intent, id) => {
      this.activateIntent(id, intent);
    });
  }

  /**
   * Subscribe một destination. Trả về unsubscribe function.
   *
   * <p>Kênh được ghi nhớ nên sẽ tự đăng ký lại sau mỗi lần reconnect. Có thể gọi cả khi chưa kết
   * nối — intent sẽ được kích hoạt ngay khi WS connect.
   */
  subscribe<T>(destination: string, callback: (data: T) => void): () => void {
    const id = `sub-${++this.idCounter}`;
    const intent: SubscriptionIntent = {
      destination,
      callback: callback as (data: unknown) => void,
    };
    this.intents.set(id, intent);

    // Nếu đã kết nối thì subscribe ngay; nếu chưa, onConnect sẽ lo.
    this.activateIntent(id, intent);

    return () => {
      const current = this.intents.get(id);
      current?.sub?.unsubscribe();
      this.intents.delete(id);
    };
  }

  /**
   * Gửi message tới server (đi qua @MessageMapping).
   */
  send(destination: string, body: unknown): void {
    if (!this.client?.connected) {
      console.warn('[WebSocket] Not connected, cannot send to', destination);
      return;
    }
    this.client.publish({
      destination,
      body: JSON.stringify(body),
    });
  }

  /**
   * Ngắt kết nối (gọi khi logout).
   */
  disconnect(): void {
    if (this.client) {
      this.intents.forEach((intent) => intent.sub?.unsubscribe());
      this.intents.clear();
      void this.client.deactivate();
      this.client = null;
      this.connectionPromise = null;
      console.log('[WebSocket] Cleaned up');
    }
  }

  isConnected(): boolean {
    return this.client?.connected ?? false;
  }
}

// Singleton
export const webSocketService = new WebSocketService();
