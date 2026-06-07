import { useCallback, useEffect, useState } from 'react';
import { webSocketService } from '../services/webSocketService';
import { chatService } from '../services/chatService';

/**
 * Hook quản lý TỔNG tin nhắn chưa đọc cho chấm đỏ/badge nút Chats ở sidebar (Phase 5.4).
 *
 * <p>Theo logic Facebook/Zalo: tin nhắn KHÔNG vào notification center mà hiện badge riêng trên nút
 * Chats. Khi có tin mới (hoặc khi đã đọc), backend gửi tín hiệu qua {@code /user/queue/chat-unread}
 * → hook gọi lại API tổng unread để lấy số chính xác (tránh lệch khi cộng/trừ thủ công).
 */
export function useChatUnread(isLoggedIn: boolean) {
  const [totalUnread, setTotalUnread] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const total = await chatService.getTotalUnread();
      setTotalUnread(total ?? 0);
    } catch (e) {
      console.error('[ChatUnread] refresh failed', e);
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      setTotalUnread(0);
      return;
    }

    // Lấy tổng unread ngay khi đăng nhập.
    refresh();

    // Đảm bảo WS kết nối; subscribe tín hiệu thay đổi unread (tự re-subscribe khi reconnect).
    webSocketService.connect().catch(() => {});
    const unsubscribe = webSocketService.subscribe<{ conversationId: string }>(
      '/user/queue/chat-unread',
      () => {
        refresh();
      }
    );

    return () => unsubscribe();
  }, [isLoggedIn, refresh]);

  return { totalUnread, refreshChatUnread: refresh };
}
