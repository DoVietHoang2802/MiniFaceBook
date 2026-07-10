import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Bell, 
  User, 
  Settings, 
  Flame, 
  Loader2, 
  LogOut, 
  ChevronDown,
  MessageCircle,
  Users,
  Compass,
  TrendingUp,
  UserPlus,
  Home,
  X,
  Heart,
  UserCheck,
  CheckCheck
} from 'lucide-react';
import { useAuth } from '../../core/auth/AuthContext';
import { useToast } from '../../core/toast/ToastContext';
import { useWebSocket } from '../../modules/chat/hooks/useWebSocket';
import { useChatUnread } from '../../modules/chat/hooks/useChatUnread';
import { useNotifications } from '../../modules/notification/hooks/useNotifications';
import { friendService } from '../../modules/friends/services/friendService';
import { NetworkStatusBanner } from '../NetworkStatusBanner';
import type { NotificationResponse } from '../../modules/notification/types/notification.types';
import { useRef } from 'react';

const TYPE_META = {
  LIKE: { icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50' },
  COMMENT: { icon: MessageCircle, color: 'text-sky-500', bg: 'bg-sky-50' },
  FRIEND_REQUEST: { icon: UserPlus, color: 'text-violet-500', bg: 'bg-violet-50' },
  FRIEND_ACCEPTED: { icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-50' },
};

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

export const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const notifRef = useRef<HTMLDivElement>(null);
  const { triggerToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // Kích hoạt kết nối WebSocket & heartbeat cho presence
  useWebSocket(!!user);

  // Tổng tin nhắn chưa đọc cho chấm đỏ nút Chats sidebar (Phase 5.4 - realtime).
  const { totalUnread: chatUnread } = useChatUnread(!!user, user?.id);

  // Trạng thái giao diện cao cấp
  const [showProfilePopover, setShowProfilePopover] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const toggleNotifDropdown = () => {
    const next = !showNotifDropdown;
    setShowNotifDropdown(next);
    if (next && !notifLoaded) {
      loadNotifications();
    }
  };
  
  // Gợi ý kết bạn thật từ API (Sprint 3.4 - Mutual Friends). state: idle | loading | requested
  const [suggestedFriends, setSuggestedFriends] = useState<
    { userId: string; name: string; mutualFriendsCount: number; avatar?: string; state: string }[]
  >([]);

  // Xác định activeTab dựa trên URL path
  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/') return 'feed';
    if (path.startsWith('/friends')) return 'friends';
    if (path.startsWith('/chats')) return 'chats';
    if (path.startsWith('/profile')) return 'profile';
    if (path.startsWith('/settings')) return 'settings';
    if (path.startsWith('/discover')) return 'discover';
    return 'feed';
  };
  const activeTab = getActiveTab();

  // Notification Center (Phase 5.1): badge realtime + dropdown chuông.
  const {
    notifications,
    unreadCount,
    loading: notifLoading,
    loaded: notifLoaded,
    loadNotifications,
    markAsRead: markNotifAsRead,
    markAllAsRead: markAllNotifAsRead,
  } = useNotifications(!!user, (n) => {
    triggerToast(`${n.actorName} ${n.content ?? 'có hoạt động mới'}`);
  });

  // Điều hướng khi click vào một thông báo.
  const handleNotifNavigate = (n: NotificationResponse) => {
    if (n.type === 'FRIEND_REQUEST' || n.type === 'FRIEND_ACCEPTED') {
      navigate('/friends');
    } else {
      navigate('/');
    }
  };

  // Tải danh sách gợi ý kết bạn thật (Mutual Friends - Sprint 3.4) khi đã đăng nhập
  useEffect(() => {
    if (!user) return;
    friendService
      .getSuggestions(5)
      .then((list) =>
        setSuggestedFriends(
          list.map((s) => ({
            userId: s.userId,
            name: s.name,
            mutualFriendsCount: s.mutualFriendsCount,
            avatar: s.avatar,
            state: 'idle',
          }))
        )
      )
  }, [user]);

  useEffect(() => {
    if (!showNotifDropdown) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('#sidebar-notifications-btn')) return;
      if (target.closest('#header-notifications-btn')) return;
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showNotifDropdown]);

  // Xử lý gửi lời mời kết bạn THẬT (Optimistic Micro-interaction)
  const handleAddFriend = (userId: string, name: string) => {
    setSuggestedFriends((prev) =>
      prev.map((f) => (f.userId === userId ? { ...f, state: 'loading' } : f))
    );
    friendService
      .sendRequest(userId)
      .then(() => {
        setSuggestedFriends((prev) =>
          prev.map((f) => (f.userId === userId ? { ...f, state: 'requested' } : f))
        );
        triggerToast(`Đã gửi lời mời kết bạn đến ${name}!`);
      })
      .catch(() => {
        setSuggestedFriends((prev) =>
          prev.map((f) => (f.userId === userId ? { ...f, state: 'idle' } : f))
        );
        triggerToast('Gửi lời mời thất bại, vui lòng thử lại.');
      });
  };

  const handleLogout = () => {
    logout();
    triggerToast("Đăng xuất thành công!");
  };

  const handleTabClick = (tabId: string) => {
    if (tabId === 'feed') navigate('/');
    else if (tabId === 'discover') triggerToast("Tính năng Khám phá sẽ ra mắt ở Phase tiếp theo!");
    else if (tabId === 'profile') navigate('/profile');
    else if (tabId === 'friends') navigate('/friends');
    else if (tabId === 'chats') navigate('/chats');
    else if (tabId === 'settings') navigate('/settings');
    else if (tabId === 'logout') handleLogout();
    else if (tabId === 'notifications') {
      if (activeTab === 'chats') {
        navigate('/');
        setTimeout(() => {
          setShowNotifDropdown(true);
          if (!notifLoaded) loadNotifications();
        }, 150);
      } else {
        toggleNotifDropdown();
      }
    } else {
      triggerToast(`Tính năng này sẽ ra mắt ở Phase tiếp theo!`);
    }
  };

  if (!user) return null;

  return (
    <div className={`bg-[hsl(var(--background))] text-slate-800 flex flex-col relative select-none ${activeTab === 'chats' ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      {/* Banner mất kết nối Internet (chuẩn Facebook/Discord) */}
      <NetworkStatusBanner />
      
      {/* Hiệu ứng hào quang nền nhẹ nhàng (Minimalist Light Radial Glow) */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-500/5 blur-[120px] pointer-events-none"></div>

      {/* Top Header Full-Width */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-200 z-[190] flex items-center justify-between px-4 lg:px-6 shadow-sm">
        {/* Left Section: Logo + Search bar */}
        <div className="flex items-center">
          <div 
            onClick={() => navigate('/')}
            className="flex items-center space-x-2.5 cursor-pointer hover:opacity-90 transition shrink-0"
          >
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-500/20">
              <span className="text-white font-black text-lg font-outfit">H</span>
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900 font-outfit hidden sm:block">
              Hizo
            </span>
          </div>
          <div className="relative w-48 sm:w-64 md:w-80 h-9 ml-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm bạn bè, bài viết..." 
              className="w-full h-full pl-9 pr-4 rounded-full bg-slate-100/60 border border-transparent focus:bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 text-xs text-slate-700 transition-all font-medium"
              onClick={() => triggerToast("Tính năng Tìm kiếm nâng cao sẽ ra mắt ở Phase 4!")}
            />
          </div>
        </div>

        {/* Right Section: Messenger + Notifications + Profile Avatar */}
        <div className="flex items-center space-x-2.5">
          {/* Messenger Icon */}
          <button 
            onClick={() => navigate('/chats')}
            title="Trò chuyện"
            className={`h-9 w-9 flex items-center justify-center rounded-full border transition cursor-pointer shadow-sm relative ${
              activeTab === 'chats' 
                ? 'bg-violet-50 border-violet-200 text-violet-600' 
                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <MessageCircle className="h-4 w-4" />
            {chatUnread > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 flex items-center justify-center text-[9px] font-black bg-rose-500 text-white rounded-full border border-white">
                {chatUnread}
              </span>
            )}
          </button>

          {/* Notifications Icon */}
          <button 
            id="header-notifications-btn"
            onClick={toggleNotifDropdown}
            title="Thông báo"
            className={`h-9 w-9 flex items-center justify-center rounded-full border transition cursor-pointer shadow-sm relative ${
              showNotifDropdown 
                ? 'bg-violet-50 border-violet-200 text-violet-600 shadow-inner' 
                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 flex items-center justify-center text-[9px] font-black bg-rose-500 text-white rounded-full border border-white animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* User Profile Pill Popover */}
          <div className="relative h-9">
            {showProfilePopover && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl p-2 shadow-xl z-[200] animate-fade-in-up">
                <button 
                  onClick={() => {
                    navigate('/settings');
                    setShowProfilePopover(false);
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  <Settings className="h-4 w-4" />
                  <span>Cài đặt tài khoản</span>
                </button>
                <button 
                  onClick={() => {
                    handleLogout();
                    setShowProfilePopover(false);
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-rose-500 hover:bg-rose-50 text-xs font-bold transition border-t border-slate-100 mt-1 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}
            
            <div 
              onClick={() => setShowProfilePopover(!showProfilePopover)}
              className="flex items-center space-x-2.5 px-3 h-full rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition cursor-pointer shadow-sm"
            >
              <div className="h-6.5 w-6.5 rounded-full border border-slate-100 overflow-hidden bg-slate-50 shrink-0">
                {user.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-slate-400 text-[10px] font-bold bg-slate-50">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <span className="text-xs font-bold text-slate-700 hidden lg:inline max-w-[100px] truncate">{user.name || 'User'}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>
        </div>
      </header>

      <div className={`flex-grow w-full max-w-[1600px] mx-auto flex justify-start relative pt-14 ${
        activeTab === 'chats' 
          ? 'px-2 lg:px-3 gap-3 h-full overflow-hidden lg:justify-between' 
          : 'px-4 lg:px-6 xl:px-8 gap-6 min-h-[calc(100vh-56px)]'
      }`}>
        
        {/* CỘT TRÁI: SIDEBAR ĐIỀU HƯỚNG */}
        <aside className="hidden md:flex flex-col w-[80px] lg:w-[240px] shrink-0 sticky top-14 h-[calc(100vh-56px)] py-3 lg:pr-2 transition-all duration-300 justify-between overflow-y-auto scrollbar-none">
          <div className="space-y-4">
            {/* Menu Items */}
            <nav className="space-y-1">
              {[
                { id: 'feed', label: 'Trang chủ', icon: Home, badge: null },
                { id: 'discover', label: 'Khám phá', icon: Compass, badge: null },
                { id: 'friends', label: 'Bạn bè', icon: Users, badge: null },
                { id: 'chats', label: 'Trò chuyện', icon: MessageCircle, badge: chatUnread > 0 ? (chatUnread > 99 ? '99+' : String(chatUnread)) : null },
                { id: 'notifications', label: 'Thông báo', icon: Bell, badge: unreadCount > 0 ? (unreadCount > 99 ? '99+' : String(unreadCount)) : null },
                { id: 'profile', label: 'Trang cá nhân', icon: User, badge: null },
                { id: 'settings', label: 'Cài đặt', icon: Settings, badge: null },
                { id: 'logout', label: 'Đăng xuất', icon: LogOut, badge: null }
              ].map((item) => {
                const Icon = item.icon;
                const isActive = item.id === 'notifications' ? showNotifDropdown : activeTab === item.id;
                
                return (
                  <button
                    key={item.id}
                    id={item.id === 'notifications' ? 'sidebar-notifications-btn' : undefined}
                    onClick={() => handleTabClick(item.id)}
                    title={item.label}
                    className={`w-full relative flex items-center justify-center lg:justify-between px-0 lg:px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all border cursor-pointer group ${
                      isActive 
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-transparent shadow-md shadow-violet-500/20' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-3.5">
                      <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-900'}`} />
                      <span className="animate-fade-in hidden lg:block">{item.label}</span>
                    </div>
                    {item.badge && (
                      <>
                        <span className="h-5 min-w-5 px-1.5 items-center justify-center text-[10px] font-black bg-rose-500 text-white rounded-full hidden lg:flex">
                          {item.badge}
                        </span>
                        <span className="absolute top-2 right-2 h-2.5 w-2.5 border-2 border-white rounded-full bg-rose-500 flex lg:hidden"></span>
                      </>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="space-y-4 mt-auto pt-4 border-t border-slate-100">
            {/* Thống kê nhanh */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3 shadow-sm hidden lg:block">
              <span className="font-bold text-slate-800 text-[11px] font-outfit uppercase tracking-wider block">Thống kê nhanh</span>
              <div className="space-y-2.5 pt-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Bài viết</span>
                  <span className="font-black text-violet-600">98</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Bạn bè</span>
                  <span className="font-black text-violet-600">332</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Lượt thích</span>
                  <span className="font-black text-violet-600">1.2K</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Floating Notification Panel */}
        {showNotifDropdown && (
          <div 
            ref={notifRef}
            className="fixed right-4 md:right-6 top-[58px] w-[360px] max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-2xl shadow-2xl z-[195] animate-fade-in overflow-hidden h-[calc(100vh-80px)] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-violet-600 fill-violet-50/50" />
                <span className="font-bold text-slate-800 text-sm font-outfit">Thông báo</span>
              </div>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllNotifAsRead}
                    className="flex items-center gap-1 text-[11px] font-bold text-violet-600 hover:text-violet-500 transition cursor-pointer"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Đọc tất cả
                  </button>
                )}
                <button 
                  onClick={() => setShowNotifDropdown(false)}
                  className="p-1 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Danh sách */}
            <div className="flex-grow overflow-y-auto p-1.5 space-y-0.5 scrollbar-thin">
              {notifLoading && (
                <div className="py-10 text-center text-slate-400 text-xs font-medium">Đang tải thông báo...</div>
              )}
              {!notifLoading && notifications.length === 0 && (
                <div className="py-12 text-center px-6">
                  <div className="mx-auto h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                    <Bell className="h-6 w-6 text-slate-300" />
                  </div>
                  <p className="text-slate-400 text-xs font-medium">Chưa có thông báo nào</p>
                </div>
              )}
              {!notifLoading &&
                notifications.map((n) => {
                  const meta = TYPE_META[n.type] ?? TYPE_META.LIKE;
                  const Icon = meta.icon;
                  return (
                    <button
                      key={n.id}
                      onClick={() => {
                        if (!n.isRead) markNotifAsRead(n.id);
                        handleNotifNavigate(n);
                        setShowNotifDropdown(false);
                      }}
                      className={`w-full flex items-start gap-3 px-3 py-2.5 text-left transition cursor-pointer hover:bg-slate-50 border-b border-slate-100/50 rounded-xl ${
                        n.isRead ? 'text-slate-600' : 'bg-violet-50/30 font-semibold text-slate-900'
                      }`}
                    >
                      {/* Avatar actor */}
                      <div className="relative shrink-0">
                        <div className="h-9 w-9 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 font-bold">
                          {n.actorAvatar ? (
                            <img src={n.actorAvatar} alt={n.actorName} className="h-full w-full object-cover" />
                          ) : (
                            n.actorName?.charAt(0).toUpperCase()
                          )}
                        </div>
                        <span className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center border-2 border-white ${meta.bg}`}>
                          <Icon className={`h-2.5 w-2.5 ${meta.color}`} />
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs leading-snug">
                          <span className="font-bold text-slate-800">{n.actorName}</span>{' '}
                          {n.content ?? ''}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1 font-medium">{timeAgo(n.createdAt)}</p>
                      </div>

                      {/* Unread dot */}
                      {!n.isRead && (
                        <span className="mt-2 h-2 w-2 rounded-full bg-violet-500 shrink-0" />
                      )}
                    </button>
                  );
                })}
            </div>
          </div>
        )}

        {/* CỘT GIỮA: RENDER ROUTE CON */}
        <main className={`flex-1 w-full min-w-0 transition-all duration-300 ${
          activeTab === 'chats' 
            ? 'lg:max-w-full py-1 h-full overflow-hidden flex flex-col' 
            : (activeTab === 'profile' || activeTab === 'settings')
            ? 'lg:max-w-[1000px] py-3 min-h-screen'
            : 'lg:max-w-[680px] py-3 min-h-screen'
        }`}>


          {/* Header Mobile thanh lịch */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 md:hidden">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-sm">
                <span className="text-white font-black text-sm">H</span>
              </div>
              <span className="text-lg font-black tracking-tight text-slate-800 font-outfit">
                Hizo
              </span>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 rounded-lg bg-slate-50 text-rose-500 border border-slate-200 hover:bg-rose-100/50 text-xs font-bold transition"
            >
              Đăng xuất
            </button>
          </div>

          {/* Render trang con */}
          <div className={`w-full ${activeTab === 'chats' ? 'flex-1 min-h-0 flex flex-col' : ''}`}>
            <Outlet />
          </div>
        </main>

        {/* CỘT PHẢI: TRENDING & PEOPLE YOU MAY KNOW */}
        <aside className={`hidden lg:flex flex-col w-[300px] xl:w-[340px] shrink-0 sticky top-14 h-[calc(100vh-56px)] justify-between py-3 pl-1 transition-all duration-300 ${(activeTab === 'chats' || activeTab === 'profile' || activeTab === 'settings') ? '!hidden' : ''}`}>
          <div className="space-y-4 overflow-y-auto pr-1 scrollbar-none">
            
            {/* Widget 1: Trending Topics */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Flame className="h-4 w-4 text-orange-500 fill-orange-500 animate-pulse" />
                  <span className="font-bold text-slate-800 text-sm font-outfit">Xu hướng</span>
                </div>
                <button 
                  onClick={() => triggerToast("Xem danh mục xu hướng chi tiết...")}
                  className="text-[11px] font-bold text-violet-600 hover:text-violet-500 transition cursor-pointer"
                >
                  Xem tất cả
                </button>
              </div>
              <div className="space-y-3 pt-1">
                {[
                  { tag: '#JavaScript', posts: '12.5K bài viết', growth: '+24%' },
                  { tag: '#Frontend', posts: '8.7K bài viết', growth: '+18%' },
                  { tag: '#WebDev', posts: '6.3K bài viết', growth: '+15%' },
                  { tag: '#UIUX', posts: '4.2K bài viết', growth: '+8%' },
                  { tag: '#AI', posts: '3.1K bài viết', growth: '+6%' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg border text-orange-500 bg-orange-50 border-orange-100 shrink-0">
                        <Flame className="h-3.5 w-3.5" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-bold text-slate-700 text-xs group-hover:text-violet-600 transition">{item.tag}</h4>
                        <p className="text-slate-400 text-[10px]">{item.posts}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 text-emerald-500 font-bold text-[11px]">
                      <TrendingUp className="h-3 w-3" />
                      <span>{item.growth}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Widget 2: Suggested Friends */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-violet-500" />
                  <span className="font-bold text-slate-800 text-sm font-outfit">Gợi ý kết bạn</span>
                </div>
                <button 
                  onClick={() => navigate('/friends')}
                  className="text-[11px] font-bold text-violet-600 hover:text-violet-500 transition cursor-pointer"
                >
                  Xem tất cả
                </button>
              </div>

              <div className="space-y-4 pt-1">
                {suggestedFriends.length === 0 && (
                  <p className="text-slate-400 text-[11px] text-center py-2">
                    Chưa có gợi ý. Hãy kết bạn để nhận gợi ý theo bạn chung!
                  </p>
                )}
                {suggestedFriends.map((friend) => (
                  <div key={friend.userId} className="flex items-center justify-between group">
                    <div 
                      onClick={() => navigate(`/profile/${friend.userId}`)}
                      className="flex items-center space-x-3 overflow-hidden cursor-pointer group/item"
                    >
                      <div className="h-10 w-10 rounded-full border border-slate-100 overflow-hidden bg-slate-50 shrink-0 flex items-center justify-center text-slate-400 font-bold shadow-sm">
                        {friend.avatar ? (
                          <img src={friend.avatar} alt={friend.name} className="h-full w-full object-cover" />
                        ) : (
                          friend.name?.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="text-left overflow-hidden">
                        <h4 className="font-bold text-slate-700 text-xs leading-snug group-hover/item:text-violet-600 transition truncate">{friend.name}</h4>
                        <p className="text-slate-400 text-[10px] truncate mt-0.5">{friend.mutualFriendsCount} bạn chung</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleAddFriend(friend.userId, friend.name)}
                        disabled={friend.state === 'loading' || friend.state === 'requested'}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center shrink-0 cursor-pointer gap-1 ${
                          friend.state === 'requested'
                            ? 'bg-slate-100 text-slate-500 border border-slate-200 cursor-default'
                            : 'bg-violet-600 text-white hover:bg-violet-700 shadow-sm hover:shadow-violet-600/10'
                        }`}
                      >
                        {friend.state === 'loading' ? (
                          <Loader2 className="h-3 w-3 animate-spin text-white" />
                        ) : friend.state === 'requested' ? (
                          <>Đã gửi</>
                        ) : (
                          <>Kết bạn</>
                        )}
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSuggestedFriends(prev => prev.filter(f => f.userId !== friend.userId));
                        }}
                        className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                        title="Bỏ qua"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Nút Xem thêm */}
              <button 
                onClick={() => navigate('/friends')}
                className="w-full flex items-center justify-center space-x-1 py-2 text-slate-400 hover:text-slate-700 text-xs font-bold transition-colors cursor-pointer border-t border-slate-100 pt-3 mt-2"
              >
                <span>Xem thêm</span>
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            {/* Widget 3: Active Friends */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-bold text-slate-800 text-sm font-outfit">Bạn bè đang online</span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                {[
                  { name: 'Nguyễn Huy Khoa', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60' },
                  { name: 'Cáp Viết Tài', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=60' },
                  { name: 'Trần Minh Nhật', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60' },
                  { name: 'Đặng Thế Duy', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60' }
                ].map((f, idx) => (
                  <div key={idx} className="relative h-9 w-9 rounded-full border-2 border-white overflow-hidden bg-slate-100 shadow-sm ring-1 ring-slate-100 shrink-0">
                    <img src={f.avatar} alt={f.name} className="h-full w-full object-cover" />
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white"></span>
                  </div>
                ))}
                <div className="h-9 w-9 rounded-full bg-violet-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-violet-600 shadow-sm ring-1 ring-slate-100 cursor-pointer shrink-0">
                  +12
                </div>
              </div>
            </div>

          </div>

          {/* Footer của Sidebar */}
          <div className="text-left text-[10px] text-slate-400 leading-relaxed max-w-[280px] pt-4">
            <div className="flex flex-wrap gap-x-2 gap-y-1">
              <a href="#about" className="hover:underline">Giới thiệu</a>·
              <a href="#help" className="hover:underline">Hỗ trợ</a>·
              <a href="#terms" className="hover:underline">Điều khoản</a>·
              <a href="#privacy" className="hover:underline">Quyền riêng tư</a>·
              <a href="#cookies" className="hover:underline">Cookies</a>·
              <a href="#more" className="hover:underline">Thêm</a>
            </div>
            <p className="mt-2 text-slate-400">© 2026 Hizo. Bảo lưu mọi quyền.</p>
          </div>
        </aside>

      </div>
    </div>
  );
};

export default MainLayout;
