import { useEffect, useRef, useState } from 'react';
import { webSocketService } from '../services/webSocketService';
import { presenceService } from '../services/presenceService';

/**
 * Hook quản lý kết nối WebSocket + Heartbeat presence.
 *
 * Usage:
 *   const { isConnected } = useWebSocket(isLoggedIn);
 *
 * Khi user login → kết nối WS + bắt đầu gửi heartbeat mỗi 25s.
 * Khi user logout → ngắt WS + dừng heartbeat.
 */
export function useWebSocket(isLoggedIn: boolean) {
  const [isConnected, setIsConnected] = useState(false);
  const heartbeatTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      webSocketService.disconnect();
      setIsConnected(false);
      if (heartbeatTimer.current) {
        clearInterval(heartbeatTimer.current);
        heartbeatTimer.current = null;
      }
      return;
    }

    let cancelled = false;

    webSocketService
      .connect()
      .then(() => {
        if (cancelled) return;
        setIsConnected(true);

        // Bắt đầu heartbeat mỗi 25s (TTL Redis = 35s, có buffer)
        const sendBeat = () => {
          presenceService.heartbeat().catch((err) => {
            console.warn('[Presence] Heartbeat failed:', err);
          });
        };
        sendBeat(); // ngay lập tức
        heartbeatTimer.current = window.setInterval(sendBeat, 25000);
      })
      .catch((err) => {
        console.error('[WebSocket] Connect failed:', err);
        setIsConnected(false);
      });

    return () => {
      cancelled = true;
      if (heartbeatTimer.current) {
        clearInterval(heartbeatTimer.current);
        heartbeatTimer.current = null;
      }
    };
  }, [isLoggedIn]);

  return { isConnected };
}
