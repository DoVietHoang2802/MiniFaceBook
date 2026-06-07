import axiosClient from '../../../core/api/axiosClient';
import type { ApiResponse, NotificationResponse, Page } from '../types/notification.types';

/** Chuẩn hóa: backend (Lombok+Jackson) có thể trả `read` thay vì `isRead` — gộp về `isRead`. */
export function normalizeNotification(raw: NotificationResponse): NotificationResponse {
  const anyRaw = raw as NotificationResponse & { read?: boolean };
  return { ...raw, isRead: raw.isRead ?? anyRaw.read ?? false };
}

/**
 * Service gọi API Notification Center (Phase 5.1).
 * Request tự kèm HttpOnly Cookie qua axiosClient (withCredentials).
 */
export const notificationService = {
  /** Lấy danh sách thông báo (mới nhất trước), phân trang. */
  getNotifications: async (page = 0, size = 15) => {
    const res = await axiosClient.get<ApiResponse<Page<NotificationResponse>>>('/notifications', {
      params: { page, size },
    });
    const data = res.data.data;
    return { ...data, content: data.content.map(normalizeNotification) };
  },

  /** Đếm số thông báo chưa đọc (badge chuông). */
  getUnreadCount: async () => {
    const res = await axiosClient.get<ApiResponse<number>>('/notifications/unread-count');
    return res.data.data;
  },

  /** Đánh dấu một thông báo là đã đọc. */
  markAsRead: async (notificationId: string) => {
    await axiosClient.put<ApiResponse<void>>(`/notifications/${notificationId}/read`);
  },

  /** Đánh dấu tất cả thông báo là đã đọc. */
  markAllAsRead: async () => {
    await axiosClient.put<ApiResponse<void>>('/notifications/read-all');
  },
};
