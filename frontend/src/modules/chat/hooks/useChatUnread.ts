import { useCallback, useEffect, useState } from 'react';
import { webSocketService } from '../services/webSocketService';
import { chatService } from '../services/chatService';
import type { MessageResponse } from '../types/chat.types';

/**
 * Hook quản lý TỔNG tin nhắn chưa đọc cho chấm đỏ/badge nút Chats ở sidebar (Phase 5.4).
 *
 * <p>Theo logic Facebook/Zalo: tin nhắn KHÔNG vào notification center mà hiện badge riêng trên nút
 * Chats. Khi có tin mới (hoặc khi đã đọc), backend gửi tín hiệu qua {@code /user/queue/chat-unread}
 * → hook gọi lại API tổng unread để lấy số chính xác (tránh lệch khi cộng/trừ thủ công).
 */
export function useChatUnread(isLoggedIn: boolean, currentUserId?: string) {
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
    
    const unsubscribeUnread = webSocketService.subscribe<{ conversationId: string }>(
      '/user/queue/chat-unread',
      () => {
        refresh();
      }
    );

    // Đăng ký nghe tin nhắn mới toàn cục để phát âm thanh tin nhắn (Sprint 5.3)
    const unsubscribeMessages = webSocketService.subscribe<{ type: string; data: MessageResponse }>(
      '/user/queue/messages',
      (payload) => {
        if (payload.type === 'NEW_MESSAGE') {
          const newMsg = payload.data;
          // Chỉ phát âm thanh khi tin nhắn là từ người khác gửi đến
          if (currentUserId && newMsg.sender.id !== currentUserId) {
            try {
              const audio = new Audio('/sounds/message.mp3');
              audio.volume = 0.5;
              audio.play().catch((err) => console.log('[Audio] Message play blocked/failed', err));
            } catch (err) {
              console.error('[Audio] Error playing message sound', err);
            }
          }
        }
      }
    );

    return () => {
      unsubscribeUnread();
      unsubscribeMessages();
    };
  }, [isLoggedIn, currentUserId, refresh]);

  return { totalUnread, refreshChatUnread: refresh };
}
