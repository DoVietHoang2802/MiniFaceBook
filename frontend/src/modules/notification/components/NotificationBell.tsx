import { useEffect, useRef } from 'react';
import { Bell, Heart, MessageCircle, UserPlus, UserCheck, CheckCheck } from 'lucide-react';
import type { NotificationResponse, NotificationType } from '../types/notification.types';

interface NotificationBellProps {
  unreadCount: number;
  notifications: NotificationResponse[];
  loading: boolean;
  loaded: boolean;
  onOpen: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onNavigate: (n: NotificationResponse) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Icon + màu theo loại thông báo. */
const TYPE_META: Record<NotificationType, { icon: typeof Heart; color: string; bg: string }> = {
  LIKE: { icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50' },
  COMMENT: { icon: MessageCircle, color: 'text-sky-500', bg: 'bg-sky-50' },
  FRIEND_REQUEST: { icon: UserPlus, color: 'text-violet-500', bg: 'bg-violet-50' },
  FRIEND_ACCEPTED: { icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-50' },
};

/** Định dạng thời gian tương đối kiểu Facebook (vài giây/phút/giờ/ngày trước). */
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'Vừa xong';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} ngày trước`;
  return new Date(iso).toLocaleDateString('vi-VN');
}

/**
 * Chuông thông báo + dropdown (Phase 5.1) - chuẩn Facebook/Zalo.
 * Badge số chưa đọc, danh sách thông báo realtime, click để điều hướng + đánh dấu đã đọc.
 */
export default function NotificationBell({
  unreadCount,
  notifications,
  loading,
  loaded,
  onOpen,
  onMarkAsRead,
  onMarkAllAsRead,
  onNavigate,
  isOpen,
  onOpenChange,
}: NotificationBellProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Đóng dropdown khi click ra ngoài.
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('#sidebar-notifications-btn')) return;
      if (ref.current && !ref.current.contains(e.target as Node)) onOpenChange(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onOpenChange]);

  const toggle = () => {
    const next = !isOpen;
    onOpenChange(next);
    if (next && !loaded) onOpen(); // lazy-load lần đầu mở
  };

  const handleClick = (n: NotificationResponse) => {
    if (!n.isRead) onMarkAsRead(n.id);
    onNavigate(n);
    onOpenChange(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        title="Thông báo"
        className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 relative transition-all cursor-pointer shadow-sm"
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 h-5 min-w-5 px-1 flex items-center justify-center text-[10px] font-black bg-rose-500 text-white rounded-full border-2 border-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[360px] max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-2xl shadow-xl z-50 animate-fade-in-up overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="font-black text-slate-800 text-sm font-outfit">Thông báo</h3>
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="flex items-center gap-1 text-[11px] font-bold text-violet-600 hover:text-violet-500 transition cursor-pointer"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Đánh dấu đã đọc
              </button>
            )}
          </div>

          {/* Danh sách */}
          <div className="max-h-[420px] overflow-y-auto">
            {loading && (
              <div className="py-10 text-center text-slate-400 text-xs">Đang tải...</div>
            )}
            {!loading && notifications.length === 0 && (
              <div className="py-12 text-center px-6">
                <div className="mx-auto h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                  <Bell className="h-6 w-6 text-slate-300" />
                </div>
                <p className="text-slate-400 text-xs font-medium">Chưa có thông báo nào</p>
              </div>
            )}
            {!loading &&
              notifications.map((n) => {
                const meta = TYPE_META[n.type] ?? TYPE_META.LIKE;
                const Icon = meta.icon;
                return (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left transition cursor-pointer hover:bg-slate-50 border-b border-slate-50 ${
                      n.isRead ? '' : 'bg-violet-50/40'
                    }`}
                  >
                    {/* Avatar actor + icon loại */}
                    <div className="relative shrink-0">
                      <div className="h-10 w-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 font-bold">
                        {n.actorAvatar ? (
                          <img src={n.actorAvatar} alt={n.actorName} className="h-full w-full object-cover" />
                        ) : (
                          n.actorName?.charAt(0).toUpperCase()
                        )}
                      </div>
                      <span className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center border-2 border-white ${meta.bg}`}>
                        <Icon className={`h-3 w-3 ${meta.color}`} />
                      </span>
                    </div>

                    {/* Nội dung */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-700 leading-snug">
                        <span className="font-bold text-slate-900">{n.actorName}</span>{' '}
                        {n.content ?? ''}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>

                    {/* Chấm chưa đọc */}
                    {!n.isRead && (
                      <span className="mt-1.5 h-2.5 w-2.5 rounded-full bg-violet-500 shrink-0" />
                    )}
                  </button>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
