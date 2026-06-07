/** Loại thông báo (khớp enum backend Phase 5.1). */
export type NotificationType = 'LIKE' | 'COMMENT' | 'FRIEND_REQUEST' | 'FRIEND_ACCEPTED';

/** Một thông báo trả về từ backend (đã enrich thông tin actor). */
export interface NotificationResponse {
  id: string;
  actorId: string;
  actorName: string;
  actorAvatar?: string | null;
  type: NotificationType;
  entityId?: string | null;
  content?: string | null;
  isRead: boolean;
  createdAt: string;
}

/** Cấu trúc bao response chung của backend. */
export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

/** Cấu trúc phân trang Spring Data. */
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  last: boolean;
}
