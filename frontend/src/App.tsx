import { useState, useEffect } from 'react';
import LoginForm from './modules/auth/components/LoginForm';
import RegisterForm from './modules/auth/components/RegisterForm';
import ForgotPasswordForm from './modules/auth/components/ForgotPasswordForm';
import ProfilePage from './modules/profile/components/ProfilePage';
import { NetworkStatusBanner } from './components/NetworkStatusBanner';
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
  MessageSquare,
  Share2,
  Shield,
  Users,
  Compass,
  Globe,
  MessageCircle,
  TrendingUp,
  UserPlus
} from 'lucide-react';
import { authService } from './modules/auth/services/authService';
import PostFeed from './modules/post/components/PostFeed';
import FriendsPage from './modules/friends/components/FriendsPage';
import { friendService } from './modules/friends/services/friendService';
import ChatPage from './modules/chat/components/ChatPage';
import { useWebSocket } from './modules/chat/hooks/useWebSocket';
import { useChatUnread } from './modules/chat/hooks/useChatUnread';
import { useNotifications } from './modules/notification/hooks/useNotifications';
import NotificationBell from './modules/notification/components/NotificationBell';
import type { NotificationResponse } from './modules/notification/types/notification.types';

function App() {
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot_password'>('login');
  const [user, setUser] = useState<any>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<'feed' | 'profile' | 'friends' | 'chats'>('feed');
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(null);

  // Kích hoạt kết nối WebSocket & heartbeat cho presence
  useWebSocket(!!user);

  // Tổng tin nhắn chưa đọc cho chấm đỏ nút Chats sidebar (Phase 5.4 - realtime).
  const { totalUnread: chatUnread } = useChatUnread(!!user, user?.id);

  // Trạng thái giao diện cao cấp
  const [showProfilePopover, setShowProfilePopover] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  // Gợi ý kết bạn thật từ API (Sprint 3.4 - Mutual Friends). state: idle | loading | requested
  const [suggestedFriends, setSuggestedFriends] = useState<
    { userId: string; name: string; mutualFriendsCount: number; avatar?: string; state: string }[]
  >([]);

  // Kích hoạt Toast thông báo
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
  };

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
      setActiveTab('friends');
    } else {
      setActiveTab('feed');
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

  // Tự động ẩn Toast sau 3 giây
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Kiểm tra trạng thái đăng nhập qua Token Cookie lúc khởi chạy (Silent Check)
  useEffect(() => {
    if (window.location.pathname !== '/' && window.location.pathname !== '') {
      window.history.replaceState({}, '', '/');
    }

    authService.getMe()
      .then((response) => {
        // Response structure: { status, message, data: UserResponse }
        const loggedInUser = response.data;
        if (loggedInUser && loggedInUser.email) {
          setUser(loggedInUser);
        }
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setIsCheckingAuth(false);
      });
  }, []);

  // Lắng nghe sự kiện mất hiệu lực phiên toàn cục từ Axios Client
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
    };
    window.addEventListener('unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('unauthorized', handleUnauthorized);
    };
  }, []);

  const handleLogout = () => {
    authService.logout()
      .then(() => {
        setUser(null);
        triggerToast("Đăng xuất thành công!");
      })
      .catch(() => {
        setUser(null);
      });
  };

  // Trình hiển thị Loading khi đang tải trạng thái xác thực
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] text-white flex flex-col items-center justify-center relative">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none"></div>
        
        <div className="flex flex-col items-center space-y-4 z-10">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 animate-pulse">
            <Flame className="h-7 w-7 text-white" />
          </div>
          <div className="flex items-center space-x-2">
            <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
            <span className="text-sm font-bold tracking-wider text-slate-400 uppercase">Đang đồng bộ phiên...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-[hsl(var(--background))] text-slate-800 flex flex-col relative select-none ${activeTab === 'chats' ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      {/* Banner mất kết nối Internet (chuẩn Facebook/Discord) */}
      <NetworkStatusBanner />
      {/* Hiệu ứng hào quang nền nhẹ nhàng (Minimalist Light Radial Glow) */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-500/5 blur-[120px] pointer-events-none"></div>

      {user ? (
        /* TRANG CHÍNH 3 CỘT (Hizo - khớp Giaodiennangcap.png) */
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
 
              {/* Menu Items (Hizo - khớp Giaodiennangcap.png) */}
              <nav className="space-y-1">
                {[
                  { id: 'feed', label: 'Discover', icon: Compass, badge: null },
                  { id: 'friends', label: 'Network', icon: Users, badge: null },
                  { id: 'communities', label: 'Communities', icon: Globe, badge: null },
                  { id: 'chats', label: 'Chats', icon: MessageCircle, badge: chatUnread > 0 ? (chatUnread > 99 ? '99+' : String(chatUnread)) : null },
                  { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount > 0 ? (unreadCount > 99 ? '99+' : String(unreadCount)) : null },
                  { id: 'collections', label: 'Collections', icon: Bookmark, badge: null },
                  { id: 'profile', label: 'Profile', icon: User, badge: null },
                  { id: 'settings', label: 'Settings', icon: Settings, badge: null }
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.id === 'feed') setActiveTab('feed');
                        else if (item.id === 'profile') setActiveTab('profile');
                        else if (item.id === 'friends') setActiveTab('friends');
                        else if (item.id === 'chats') setActiveTab('chats');
                        else triggerToast(`Tính năng "${item.label}" sẽ ra mắt ở Phase tiếp theo!`);
                      }}
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
              {/* Profile Widget */}
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
                      <h4 className="font-bold text-slate-800 text-xs truncate leading-snug">{user.fullName || 'User'}</h4>
                      <p className="text-slate-400 text-[10px] truncate mt-0.5">{user.email}</p>
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-slate-400 hidden lg:block" />
                </div>
              </div>
            </div>
          </aside>

            {/* CỘT GIỮA: BẢNG TIN HOẶC PROFILE */}
            <main className={`flex-1 w-full min-w-0 mx-auto transition-all duration-300 ${activeTab === 'chats' ? 'lg:max-w-full py-1 h-screen overflow-hidden' : 'lg:max-w-[680px] py-3 min-h-screen'}`}>
            {/* Top Bar toàn năng - ẩn khi ở Chats */}
            <div className={`flex items-center justify-between gap-4 mb-5 ${activeTab === 'chats' ? 'hidden' : ''}`}>
              <div className="relative flex-grow">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search for people, posts, communities..." 
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
                  {/* Sun Icon */}
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

            {/* Content Switcher */}
            <div className="w-full">
              {activeTab === 'feed' ? (
                <PostFeed currentUser={user} />
              ) : activeTab === 'friends' ? (
                <FriendsPage 
                  triggerToast={triggerToast} 
                  onStartChat={(recipientId) => {
                    setSelectedRecipientId(recipientId);
                    setActiveTab('chats');
                  }}
                />
              ) : activeTab === 'chats' ? (
                <ChatPage 
                  currentUser={user} 
                  triggerToast={triggerToast} 
                  initialRecipientId={selectedRecipientId}
                  onClearInitialRecipient={() => setSelectedRecipientId(null)}
                />
              ) : (
                <ProfilePage initialUser={user} onLogout={() => setUser(null)} />
              )}
            </div>
          </main>

          {/* CỘT PHẢI: TRENDING & PEOPLE YOU MAY KNOW */}
          <aside className={`hidden lg:flex flex-col w-[300px] xl:w-[340px] shrink-0 sticky top-3 h-[calc(100vh-24px)] justify-between py-3 pl-1 transition-all duration-300 ${activeTab === 'chats' ? '!hidden' : ''}`}>
            <div className="space-y-4 overflow-y-auto pr-1">
              
              {/* Widget 1: Trending Topics (khớp Giaodiennangcap.png - có % tăng) */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-sm font-outfit">Trending Topics</span>
                  <button 
                    onClick={() => triggerToast("Xem danh mục xu hướng chi tiết...")}
                    className="text-[11px] font-bold text-violet-600 hover:text-violet-500 transition cursor-pointer"
                  >
                    View all
                  </button>
                </div>
                <div className="space-y-3 pt-1">
                  {[
                    { tag: '#JavaScript', posts: '12.5K posts', growth: '+24%' },
                    { tag: '#Frontend', posts: '8.7K posts', growth: '+18%' },
                    { tag: '#WebDev', posts: '6.3K posts', growth: '+15%' },
                    { tag: '#UIUX', posts: '4.2K posts', growth: '+8%' },
                    { tag: '#AI', posts: '3.1K posts', growth: '+6%' }
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

              {/* Widget 2: Suggested Friends (Khớp 100% TrangChu4.png) */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-sm font-outfit">People You May Know</span>
                  <button 
                    onClick={() => setActiveTab('friends')}
                    className="text-[11px] font-bold text-violet-600 hover:text-violet-500 transition cursor-pointer"
                  >
                    View all
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
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <div className="h-10 w-10 rounded-full border border-slate-100 overflow-hidden bg-slate-50 shrink-0 flex items-center justify-center text-slate-400 font-bold">
                          {friend.avatar ? (
                            <img src={friend.avatar} alt={friend.name} className="h-full w-full object-cover" />
                          ) : (
                            friend.name?.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="text-left overflow-hidden">
                          <h4 className="font-bold text-slate-700 text-xs leading-snug group-hover:text-violet-600 transition truncate">{friend.name}</h4>
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
                            <UserPlus className="h-3.5 w-3.5" /> Follow
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>

                {/* Nút Show More */}
                <button 
                  onClick={() => setActiveTab('friends')}
                  className="w-full flex items-center justify-center space-x-1 py-2 text-slate-400 hover:text-slate-700 text-xs font-bold transition-colors cursor-pointer border-t border-slate-100 pt-3 mt-2"
                >
                  <span>Show more</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Footer của Sidebar */}
            <div className="text-left text-[10px] text-slate-400 leading-relaxed max-w-[280px] pt-4">
              <div className="flex flex-wrap gap-x-2 gap-y-1">
                <a href="#about" className="hover:underline">About</a>·
                <a href="#help" className="hover:underline">Help</a>·
                <a href="#terms" className="hover:underline">Terms</a>·
                <a href="#privacy" className="hover:underline">Privacy</a>·
                <a href="#cookies" className="hover:underline">Cookies</a>·
                <a href="#more" className="hover:underline">More</a>
              </div>
              <p className="mt-2 text-slate-400">© 2026 Hizo. All rights reserved.</p>
            </div>
          </aside>

        </div>
      ) : (
        /* TRANG LANDING / AUTH (LOGGED OUT - VIZO LIGHT MODE) */
        <div className="min-h-screen flex flex-col bg-slate-50">
          {/* Header thanh lịch */}
          <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between z-10">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-500/20">
                <span className="text-white font-black text-xl font-outfit">V</span>
              </div>
              <span className="text-2xl font-black tracking-tight text-slate-800 font-outfit">
                Vizo
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 hidden sm:inline-block">
                Hạ tầng Sandbox local
              </span>
              <a
                href="http://localhost:8025"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-bold transition-all hover:border-violet-500 bg-white flex items-center space-x-1 shadow-sm"
              >
                <span>Mailpit UI</span>
              </a>
            </div>
          </header>

          <main className="flex-grow flex flex-col items-center px-6 py-6 sm:py-10 z-10 max-w-7xl w-full mx-auto justify-center">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full mt-10">
              
              {/* Cột trái: Slogan & Tính năng nổi bật */}
              <div className="lg:col-span-7 space-y-8 text-left hidden lg:block pr-8">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-violet-50 border border-violet-100 text-xs font-bold text-violet-600">
                  <span className="h-2 w-2 rounded-full bg-violet-500 animate-pulse"></span>
                  <span>Phiên bản Enterprise v1.2</span>
                </div>

                <h1 className="text-5xl font-black tracking-tight leading-[1.1] text-slate-900">
                  Kết nối sâu sắc, <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-500">
                    Chia sẻ chân thực.
                  </span>
                </h1>

                <p className="text-slate-500 text-lg max-w-lg leading-relaxed">
                  Vizo mang lại một trải nghiệm mạng xã hội thế hệ mới: Nhanh hơn, bảo mật hơn và thông minh vượt trội.
                </p>

                {/* Các đặc trưng công nghệ */}
                <div className="grid grid-cols-2 gap-6 pt-4 max-w-xl">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-lg bg-white border border-slate-200 mt-1 text-violet-600 shadow-sm">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Realtime Messaging</h4>
                      <p className="text-slate-500 text-xs mt-1">STOMP WebSocket & Redis Pub/Sub</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-lg bg-white border border-slate-200 mt-1 text-indigo-600 shadow-sm">
                      <Share2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Social Graph DB</h4>
                      <p className="text-slate-500 text-xs mt-1">Đồ thị quan hệ bạn bè Neo4j</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-lg bg-white border border-slate-200 mt-1 text-emerald-600 shadow-sm">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Strict Security</h4>
                      <p className="text-slate-500 text-xs mt-1">HttpOnly Cookies & Token Rotation</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-lg bg-white border border-slate-200 mt-1 text-amber-600 shadow-sm">
                      <Flame className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Vite & Tailwind v4</h4>
                      <p className="text-slate-500 text-xs mt-1">Build thần tốc, UI mượt mà</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cột phải: Form Đăng nhập / Đăng ký */}
              <div className="lg:col-span-5 flex justify-center w-full">
                {authMode === 'login' ? (
                  <LoginForm 
                    key="login" 
                    onToggleForm={() => setAuthMode('register')} 
                    onForgotPassword={() => setAuthMode('forgot_password')} 
                    onLoginSuccess={(u) => setUser(u)} 
                  />
                ) : authMode === 'register' ? (
                  <RegisterForm key="register" onToggleForm={() => setAuthMode('login')} />
                ) : (
                  <ForgotPasswordForm key="forgot" onBackToLogin={() => setAuthMode('login')} triggerToast={triggerToast} />
                )}
              </div>

            </div>
          </main>

          {/* Footer tối giản */}
          <footer className="w-full border-t border-slate-200 py-6 z-10 bg-white mt-auto">
            <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-4">
              <p>© 2026 Vizo Project. All rights reserved.</p>
              <div className="flex space-x-6">
                <a href="#privacy" className="hover:underline">Điều khoản bảo mật</a>
                <a href="#terms" className="hover:underline">Điều khoản dịch vụ</a>
                <a href="http://localhost:8080/api/docs" target="_blank" rel="noopener noreferrer" className="hover:underline text-violet-600 font-semibold">Swagger API Docs</a>
              </div>
            </div>
          </footer>
        </div>
      )}

      {/* Trình thông báo Toast lấp lánh (Floating Toast Notification) */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-2xl text-slate-800 text-xs font-bold tracking-wide flex items-center space-x-2 z-50 animate-fade-in-up">
          <div className="h-2 w-2 rounded-full bg-violet-600 animate-pulse"></div>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default App;
