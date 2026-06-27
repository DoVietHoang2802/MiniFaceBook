import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Bell, 
  Bookmark, 
  User, 
  Settings, 
  Flame, 
  Loader2, 
  LogOut, 
  ChevronDown,
  MessageCircle,
  Users,
  Compass,
  Globe,
  TrendingUp,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../../core/auth/AuthContext';
import { useToast } from '../../core/toast/ToastContext';
import { useWebSocket } from '../../modules/chat/hooks/useWebSocket';
import { useChatUnread } from '../../modules/chat/hooks/useChatUnread';
import { useNotifications } from '../../modules/notification/hooks/useNotifications';
import NotificationBell from '../../modules/notification/components/NotificationBell';
import { friendService } from '../../modules/friends/services/friendService';
import { NetworkStatusBanner } from '../NetworkStatusBanner';
import type { NotificationResponse } from '../../modules/notification/types/notification.types';

export const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { triggerToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // Kích hoạt kết nối WebSocket & heartbeat cho presence
  useWebSocket(!!user);

  // Tổng tin nhắn chưa đọc cho chấm đỏ nút Chats sidebar (Phase 5.4 - realtime).
  const { totalUnread: chatUnread } = useChatUnread(!!user, user?.id);

  // Trạng thái giao diện cao cấp
  const [showProfilePopover, setShowProfilePopover] = useState(false);
  
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
      .catch(() => setSuggestedFriends([]));
  }, [user]);

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
    else if (tabId === 'profile') navigate('/profile');
    else if (tabId === 'friends') navigate('/friends');
    else if (tabId === 'chats') navigate('/chats');
    else triggerToast(`Tính năng này sẽ ra mắt ở Phase tiếp theo!`);
  };

  if (!user) return null;

  return (
    <div className={`bg-[hsl(var(--background))] text-slate-800 flex flex-col relative select-none ${activeTab === 'chats' ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      {/* Banner mất kết nối Internet (chuẩn Facebook/Discord) */}
      <NetworkStatusBanner />
      
      {/* Hiệu ứng hào quang nền nhẹ nhàng (Minimalist Light Radial Glow) */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-500/5 blur-[120px] pointer-events-none"></div>

      <div className={`flex-grow w-full max-w-[1600px] mx-auto flex justify-center lg:justify-between relative ${activeTab === 'chats' ? 'px-2 lg:px-3 gap-3 h-screen overflow-hidden' : 'px-4 lg:px-6 xl:px-8 gap-5 xl:gap-7 min-h-screen'}`}>
        
        {/* CỘT TRÁI: SIDEBAR ĐIỀU HƯỚNG */}
        <aside className="hidden md:flex flex-col w-[80px] lg:w-[240px] shrink-0 sticky top-3 h-[calc(100vh-24px)] justify-between py-3 lg:pr-2 transition-all duration-300">
          <div className="space-y-2">
            {/* Logo Hizo */}
            <div className="flex items-center space-x-3 px-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-500/20 shrink-0">
                <span className="text-white font-black text-xl font-outfit">H</span>
              </div>
              <span className="text-2xl font-black tracking-tight text-slate-900 font-outfit animate-fade-in hidden lg:block">
                Hizo
              </span>
            </div>

            {/* Menu Items */}
            <nav className="space-y-1">
              {[
                { id: 'feed', label: 'Khám phá', icon: Compass, badge: null },
                { id: 'friends', label: 'Bạn bè', icon: Users, badge: null },
                { id: 'communities', label: 'Cộng đồng', icon: Globe, badge: null },
                { id: 'chats', label: 'Trò chuyện', icon: MessageCircle, badge: chatUnread > 0 ? (chatUnread > 99 ? '99+' : String(chatUnread)) : null },
                { id: 'notifications', label: 'Thông báo', icon: Bell, badge: unreadCount > 0 ? (unreadCount > 99 ? '99+' : String(unreadCount)) : null },
                { id: 'collections', label: 'Bộ sưu tập', icon: Bookmark, badge: null },
                { id: 'profile', label: 'Trang cá nhân', icon: User, badge: null },
                { id: 'settings', label: 'Cài đặt', icon: Settings, badge: null }
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    title={item.label}
                    className={`w-full relative flex items-center justify-center lg:justify-between px-0 lg:px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all border cursor-pointer ${
                      isActive 
                        ? 'bg-violet-50 text-violet-600 border-violet-100/50 shadow-sm' 
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-3.5">
                      <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-violet-600' : 'text-slate-400 group-hover:text-slate-900'}`} />
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

          {/* Thẻ User Profile */}
          <div className="space-y-4">
            <div className="relative">
              {showProfilePopover && (
                <div className="absolute bottom-[76px] left-0 w-full bg-white border border-slate-200 rounded-xl p-2 shadow-xl z-20 animate-fade-in-up">
                  <button 
                    onClick={() => {
                      triggerToast("Đang mở trang cài đặt tài khoản...");
                      setShowProfilePopover(false);
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2.5 rounded-lg text-slate-700 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Cài đặt tài khoản</span>
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-2 px-3 py-2.5 rounded-lg text-rose-500 hover:bg-rose-50 text-xs font-bold transition border-t border-slate-100 mt-1 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
              
              <div 
                onClick={() => setShowProfilePopover(!showProfilePopover)}
                className="flex items-center justify-center lg:justify-between p-3 rounded-xl hover:bg-slate-100 cursor-pointer border border-transparent hover:border-slate-200 transition-all"
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="h-10 w-10 rounded-full border border-slate-200 overflow-hidden bg-slate-100 shrink-0 shadow-sm">
                    {user.avatar ? (
                      <img src={user.avatar} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-slate-400 font-bold bg-slate-50">
                        {user.email?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="text-left overflow-hidden hidden lg:block w-[140px]">
                    <h4 className="font-bold text-slate-800 text-xs truncate leading-snug">{user.name || 'User'}</h4>
                    <p className="text-slate-400 text-[10px] truncate mt-0.5">{user.email}</p>
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400 hidden lg:block" />
              </div>
            </div>
          </div>
        </aside>

        {/* CỘT GIỮA: RENDER ROUTE CON */}
        <main className={`flex-1 w-full min-w-0 mx-auto transition-all duration-300 ${activeTab === 'chats' ? 'lg:max-w-full py-1 h-screen overflow-hidden' : 'lg:max-w-[680px] py-3 min-h-screen'}`}>
          {/* Top Bar toàn năng - ẩn khi ở Chats */}
          <div className={`flex items-center justify-between gap-4 mb-5 ${activeTab === 'chats' ? 'hidden' : ''}`}>
            <div className="relative flex-grow">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Tìm kiếm bạn bè, bài viết, cộng đồng..." 
                className="w-full pl-10 pr-16 py-2.5 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-xs text-slate-700 transition-all font-medium shadow-sm"
                onClick={() => triggerToast("Tính năng Tìm kiếm nâng cao sẽ ra mắt ở Phase 4!")}
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-400 text-[9px] font-bold">
                ⌘ K
              </div>
            </div>
            <div className="flex items-center space-x-3 shrink-0">
              <button 
                onClick={() => triggerToast("Chế độ tối tự động thích ứng sẽ ra mắt ở Sprint tiếp theo!")} 
                title="Toggle theme"
                className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all cursor-pointer shadow-sm"
              >
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              </button>
              <NotificationBell
                unreadCount={unreadCount}
                notifications={notifications}
                loading={notifLoading}
                loaded={notifLoaded}
                onOpen={loadNotifications}
                onMarkAsRead={markNotifAsRead}
                onMarkAllAsRead={markAllNotifAsRead}
                onNavigate={handleNotifNavigate}
              />
              <div className="h-9 w-9 rounded-full border border-slate-200 overflow-hidden bg-slate-100 shrink-0 shadow-sm">
                {user.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-slate-400 text-xs font-bold bg-slate-50">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </div>

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
          <div className="w-full">
            <Outlet />
          </div>
        </main>

        {/* CỘT PHẢI: TRENDING & PEOPLE YOU MAY KNOW */}
        <aside className={`hidden lg:flex flex-col w-[300px] xl:w-[340px] shrink-0 sticky top-3 h-[calc(100vh-24px)] justify-between py-3 pl-1 transition-all duration-300 ${activeTab === 'chats' ? '!hidden' : ''}`}>
          <div className="space-y-4 overflow-y-auto pr-1">
            
            {/* Widget 1: Trending Topics */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-sm font-outfit">Chủ đề xu hướng</span>
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
                <span className="font-bold text-slate-800 text-sm font-outfit">Gợi ý kết bạn</span>
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
                    
                    <button
                      onClick={() => handleAddFriend(friend.userId, friend.name)}
                      disabled={friend.state === 'loading' || friend.state === 'requested'}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center shrink-0 cursor-pointer gap-1 ${
                        friend.state === 'requested'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 cursor-default'
                          : 'bg-white text-violet-600 border border-violet-200 hover:bg-violet-50 hover:border-violet-300 shadow-sm hover-lift'
                      }`}
                    >
                      {friend.state === 'loading' ? (
                        <Loader2 className="h-3 w-3 animate-spin text-violet-600" />
                      ) : friend.state === 'requested' ? (
                        <>Đã gửi</>
                      ) : (
                        <>
                          <UserPlus className="h-3.5 w-3.5" /> Kết bạn
                        </>
                      )}
                    </button>
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
