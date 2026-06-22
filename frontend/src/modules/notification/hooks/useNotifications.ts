import { useCallback, useEffect, useRef, useState } from 'react';
import { sseService } from '../../core/services/sseService';
import { notificationService, normalizeNotification } from '../services/notificationService';
import type { NotificationResponse } from '../types/notification.types';

/**
 * Hook quản lý Notification Center (Phase 5.1).
 *
 * - Khi đăng nhập: nạp số chưa đọc + subscribe realtime {@code /user/queue/notifications}.
 * - Có thông báo mới → prepend vào danh sách + tăng badge (+ toast tùy chọn).
 * - Cung cấp hành động đánh dấu đã đọc / tất cả đã đọc với Optimistic UI.
 */
export function useNotifications(isLoggedIn: boolean, onNew?: (n: NotificationResponse) => void) {
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const onNewRef = useRef(onNew);
  onNewRef.current = onNew;

  /** Nạp danh sách thông báo (trang đầu). Gọi khi mở dropdown lần đầu. */
  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const page = await notificationService.getNotifications(0, 15);
      setNotifications(page.content);
      setLoaded(true);
    } catch (e) {
      console.error('[Notifications] load failed', e);
    } finally {
      setLoading(false);
    }
  }, []);

  /** Đánh dấu 1 thông báo đã đọc (Optimistic). */
  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id && !n.isRead ? { ...n, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await notificationService.markAsRead(id);
    } catch (e) {
      console.error('[Notifications] markAsRead failed', e);
    }
  }, []);

  /** Đánh dấu tất cả đã đọc (Optimistic). */
  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await notificationService.markAllAsRead();
    } catch (e) {
      console.error('[Notifications] markAllAsRead failed', e);
    }
  }, []);

  // Nạp số chưa đọc + subscribe realtime khi đăng nhập.
  useEffect(() => {
    if (!isLoggedIn) {
      setNotifications([]);
      setUnreadCount(0);
      setLoaded(false);
      return;
    }

    // Badge: lấy ngay số chưa đọc (không cần mở dropdown).
    notificationService
      .getUnreadCount()
      .then((count) => setUnreadCount(count))
      .catch(() => {});

    // Subscribe SSE cho notifications.
    // Endpoint yêu cầu authentication (JWT cookie sẽ được gửi tự động).
    const unsubscribe = sseService.subscribe<NotificationResponse>(
      '/api/events/notifications',
      (raw) => {
        const notif = normalizeNotification(raw);
        setNotifications((prev) => {
          if (prev.some((n) => n.id === notif.id)) return prev; // chống trùng
          return [notif, ...prev];
        });
        setUnreadCount((c) => c + 1);

        // Phát âm thanh thông báo (Sprint 5.3)
        try {
          const audio = new Audio('/sounds/notification.mp3');
          audio.volume = 0.5;
          audio.play().catch((err) => console.log('[Audio] Notification play blocked/failed', err));
        } catch (err) {
          console.error('[Audio] Error playing notification sound', err);
        }

        onNewRef.current?.(notif);
      }
    );

    return () => unsubscribe();
  }, [isLoggedIn]);

  return {
    notifications,
    unreadCount,
    loading,
    loaded,
    loadNotifications,
    markAsRead,
    markAllAsRead,
  };
}
