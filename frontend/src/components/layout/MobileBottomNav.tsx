import { Bell, Home, MessageCircle, User, Users } from 'lucide-react';

type MobileTab = 'feed' | 'friends' | 'chats' | 'notifications' | 'profile';

interface MobileBottomNavProps {
  activeTab: string;
  chatUnread: number;
  notificationUnread: number;
  notificationsOpen: boolean;
  hidden?: boolean;
  onSelect: (tab: MobileTab) => void;
}

const NAV_ITEMS = [
  { id: 'feed', label: 'Trang chủ', icon: Home },
  { id: 'friends', label: 'Bạn bè', icon: Users },
  { id: 'chats', label: 'Trò chuyện', icon: MessageCircle },
  { id: 'notifications', label: 'Thông báo', icon: Bell },
  { id: 'profile', label: 'Cá nhân', icon: User },
] as const;

function badgeValue(value: number) {
  if (value <= 0) return null;
  return value > 99 ? '99+' : String(value);
}

export function MobileBottomNav({
  activeTab,
  chatUnread,
  notificationUnread,
  notificationsOpen,
  hidden = false,
  onSelect,
}: MobileBottomNavProps) {
  if (hidden) return null;

  return (
    <nav
      data-testid="mobile-bottom-nav"
      aria-label="Điều hướng chính trên di động"
      className="mobile-bottom-nav relative z-[190] grid w-full min-w-0 shrink-0 grid-cols-5 overflow-hidden border-t border-slate-200 bg-white/95 px-1 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur-xl md:hidden dark:border-slate-800 dark:bg-slate-900/95"
    >
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = item.id === 'notifications'
          ? notificationsOpen
          : activeTab === item.id;
        const badge = item.id === 'chats'
          ? badgeValue(chatUnread)
          : item.id === 'notifications'
            ? badgeValue(notificationUnread)
            : null;

        return (
          <button
            key={item.id}
            type="button"
            data-testid={`mobile-nav-${item.id}`}
            id={item.id === 'notifications' ? 'mobile-notifications-btn' : undefined}
            onClick={() => onSelect(item.id)}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
            className={`group relative flex min-h-14 min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-500 ${
              isActive
                ? 'text-violet-600 dark:text-violet-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <span className={`relative flex h-7 min-w-10 items-center justify-center rounded-full transition ${isActive ? 'bg-violet-100 dark:bg-violet-500/15' : ''}`}>
              <Icon className={`h-[22px] w-[22px] ${isActive ? 'stroke-[2.4]' : ''}`} />
              {badge && (
                <span className="absolute -right-0.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full border border-white bg-rose-500 px-1 text-[9px] font-black leading-none text-white dark:border-slate-900">
                  {badge}
                </span>
              )}
            </span>
            <span className={`max-w-full truncate text-[10px] leading-3 ${isActive ? 'font-black' : 'font-semibold'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

export default MobileBottomNav;
