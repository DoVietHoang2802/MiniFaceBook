import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

/**
 * WebSocket Service - Quản lý kết nối STOMP với backend.
 *
 * Cơ chế:
 * - Dùng SockJS để gọi /ws (HttpOnly Cookie tự đính kèm).
 * - JWT trong Cookie được backend đọc qua HandshakeInterceptor.
 * - Auto-reconnect khi mất kết nối.
 * - Singleton pattern - 1 connection duy nhất cho toàn app.
 */
class WebSocketService {
  private client: Client | null = null;
  private subscriptions: Map<string, StompSubscription> = new Map();
  private connectionPromise: Promise<void> | null = null;

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
        debug: (msg) => {
          if (import.meta.env.DEV) {
            console.log('[STOMP]', msg);
          }
        },
        onConnect: () => {
          console.log('[WebSocket] Connected');
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
          this.connectionPromise = null;
        },
      });

      this.client.activate();
    });

    return this.connectionPromise;
  }

  /**
   * Subscribe một destination. Trả về unsubscribe function.
   */
  subscribe<T>(destination: string, callback: (data: T) => void): () => void {
    if (!this.client?.connected) {
      console.warn('[WebSocket] Not connected, cannot subscribe to', destination);
      return () => {};
    }

    const sub = this.client.subscribe(destination, (msg: IMessage) => {
      try {
        const data = JSON.parse(msg.body) as T;
        callback(data);
      } catch (e) {
        console.error('[WebSocket] Failed to parse message:', e);
      }
    });

    this.subscriptions.set(destination, sub);
    return () => {
      sub.unsubscribe();
      this.subscriptions.delete(destination);
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
      this.subscriptions.forEach((sub) => sub.unsubscribe());
      this.subscriptions.clear();
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
