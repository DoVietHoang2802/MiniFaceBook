import { useState, useEffect } from 'react';
import LoginForm from './modules/auth/components/LoginForm';
import RegisterForm from './modules/auth/components/RegisterForm';
import ProfilePage from './modules/profile/components/ProfilePage';
import { 
  Home, 
  Search, 
  Bell, 
  Mail, 
  Bookmark, 
  FileText, 
  User, 
  Settings, 
  PenSquare, 
  Flame, 
  Loader2, 
  LogOut, 
  ChevronDown,
  MessageSquare,
  Share2,
  Shield
} from 'lucide-react';
import { authService } from './modules/auth/services/authService';
import PostFeed from './modules/post/components/PostFeed';

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<'feed' | 'profile'>('feed');

  // Trạng thái giao diện cao cấp
  const [showProfilePopover, setShowProfilePopover] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [suggestedFriends, setSuggestedFriends] = useState([
    { id: 1, name: 'Jason Nguyen', mutualFriends: 12, avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80', state: 'idle' },
    { id: 2, name: 'Thao Pham', mutualFriends: 8, avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80', state: 'idle' },
    { id: 3, name: 'Brian Le', mutualFriends: 15, avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80', state: 'idle' },
    { id: 4, name: 'Alice Duong', mutualFriends: 6, avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80', state: 'idle' },
    { id: 5, name: 'David Tran', mutualFriends: 10, avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80', state: 'idle' }
  ]);

  // Kích hoạt Toast thông báo
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
  };

  // Xử lý gửi lời mời kết bạn (Micro-interaction)
  const handleAddFriend = (id: number, name: string) => {
    setSuggestedFriends((prev) =>
      prev.map((f) => (f.id === id ? { ...f, state: 'loading' } : f))
    );
    
    setTimeout(() => {
      setSuggestedFriends((prev) =>
        prev.map((f) => (f.id === id ? { ...f, state: 'requested' } : f))
      );
      triggerToast(`Đã gửi lời mời kết bạn đến ${name}!`);
    }, 800);
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
      .then((response: any) => {
        const apiData = response as any;
        const loggedInUser = apiData.data || apiData;
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
    <div className="min-h-screen bg-[hsl(var(--background))] text-slate-800 flex flex-col relative select-none">
      {/* Hiệu ứng hào quang nền nhẹ nhàng (Minimalist Light Radial Glow) */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-500/5 blur-[120px] pointer-events-none"></div>

      {user ? (
        /* TRANG CHÍNH 3 CỘT (MATCHING GiaoDienChinh.png & TrangChu4.png - VIZO LIGHT MODE) */
        <div className="flex-grow w-full max-w-full 2xl:max-w-[1800px] mx-auto px-4 md:px-8 lg:px-12 flex justify-center gap-6 min-h-screen relative">
          
          {/* CỘT TRÁI: SIDEBAR ĐIỀU HƯỚNG (Responsive Icon-Only) */}
          <aside className="w-[80px] lg:w-[275px] shrink-0 sticky top-3 h-[calc(100vh-24px)] flex flex-col justify-between py-3 lg:pr-4 border-r border-slate-200/60 hidden md:flex transition-all duration-300">
            <div className="space-y-2">
              {/* Logo Hizo (Khớp 100% TrangChu4.png) */}
              <div className="flex items-center space-x-3 px-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-500/20 shrink-0">
                  <span className="text-white font-black text-xl font-outfit">H</span>
                </div>
                <span className="text-2xl font-black tracking-tight text-slate-900 font-outfit animate-fade-in hidden lg:block">
                  Hizo
                </span>
              </div>
 
              {/* Menu Items (Vizo Color Palette) */}
              <nav className="space-y-1">
                {[
                  { id: 'feed', label: 'Home', icon: Home, badge: null },
                  { id: 'explore', label: 'Explore', icon: Search, badge: null },
                  { id: 'notifications', label: 'Notifications', icon: Bell, badge: '3' },
                  { id: 'messages', label: 'Messages', icon: Mail, badge: null },
                  { id: 'bookmarks', label: 'Bookmarks', icon: Bookmark, badge: null },
                  { id: 'lists', label: 'Lists', icon: FileText, badge: null },
                  { id: 'profile', label: 'Profile', icon: User, badge: null },
                  { id: 'settings', label: 'Settings', icon: Settings, badge: null }
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = (item.id === 'feed' && activeTab === 'feed') || (item.id === 'profile' && activeTab === 'profile');
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.id === 'feed') setActiveTab('feed');
                        else if (item.id === 'profile') setActiveTab('profile');
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
 
              {/* Nút Create Post (Vizo Gradient) */}
              <button 
                onClick={() => {
                  if (activeTab !== 'feed') setActiveTab('feed');
                  triggerToast("Hãy viết suy nghĩ của bạn vào khung đăng bài ở giữa nhé!");
                }}
                title="Create Post"
                className="w-full py-2.5 mt-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-[13px] font-bold shadow-md shadow-indigo-500/10 transition-all flex items-center justify-center space-x-2 cursor-pointer hover-lift animate-fade-in"
              >
                <PenSquare className="h-5 w-5 shrink-0" />
                <span className="animate-fade-in hidden lg:block">Create Post</span>
              </button>
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
            <main className="flex-grow w-full max-w-[720px] lg:max-w-[760px] 2xl:max-w-[820px] py-6 min-h-screen transition-all duration-300">
            {/* Top Bar toàn năng (Khớp 100% TrangChu4.png) */}
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="relative flex-grow max-w-[420px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search for people, posts, games..." 
                  className="w-full pl-10 pr-16 py-2 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-xs text-slate-700 transition-all font-medium shadow-sm"
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
                <button 
                  onClick={() => triggerToast("Bạn có 3 thông báo mới!")} 
                  className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 relative transition-all cursor-pointer shadow-sm"
                >
                  <Bell className="h-4.5 w-4.5" />
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500"></span>
                </button>
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
              ) : (
                <ProfilePage initialUser={user} onLogout={() => setUser(null)} />
              )}
            </div>
          </main>

          {/* CỘT PHẢI: SUGGESTED FRIENDS & TRENDING NOW */}
          <aside className="w-[320px] lg:w-[350px] shrink-0 sticky top-3 h-[calc(100vh-24px)] py-3 pl-4 hidden lg:flex flex-col justify-between border-l border-slate-200/60 transition-all duration-300">
            <div className="space-y-4 overflow-y-auto pr-1">
              
              {/* Widget 1: Trending Now (Khớp 100% TrangChu4.png) */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-sm font-outfit">Trending Now</span>
                  <button 
                    onClick={() => triggerToast("Xem danh mục xu hướng chi tiết...")}
                    className="text-[11px] font-bold text-violet-600 hover:text-violet-500 transition cursor-pointer"
                  >
                    View all
                  </button>
                </div>
                <div className="space-y-3.5 pt-1">
                  {[
                    { tag: '#MiniGame', posts: '2.5K posts', color: 'text-amber-500 bg-amber-50 border-amber-100' },
                    { tag: '#Frontend', posts: '1.2K posts', color: 'text-violet-500 bg-violet-50 border-violet-100' },
                    { tag: '#JavaScript', posts: '986 posts', color: 'text-yellow-500 bg-yellow-50/50 border-yellow-100/50' },
                    { tag: '#UI/UX', posts: '756 posts', color: 'text-orange-500 bg-orange-50 border-orange-100' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between cursor-pointer group">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg border ${item.color} shrink-0`}>
                          <Flame className="h-3.5 w-3.5" />
                        </div>
                        <div className="text-left">
                          <h4 className="font-bold text-slate-700 text-xs group-hover:text-violet-600 transition">{item.tag}</h4>
                          <p className="text-slate-400 text-[10px]">{item.posts}</p>
                        </div>
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
                    onClick={() => triggerToast("Danh sách gợi ý kết bạn nâng cao sẽ ra mắt ở Phase 4 (Neo4j)!")}
                    className="text-[11px] font-bold text-violet-600 hover:text-violet-500 transition cursor-pointer"
                  >
                    View all
                  </button>
                </div>

                <div className="space-y-4 pt-1">
                  {suggestedFriends.map((friend) => (
                    <div key={friend.id} className="flex items-center justify-between group">
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <div className="h-10 w-10 rounded-full border border-slate-100 overflow-hidden bg-slate-50 shrink-0">
                          <img src={friend.avatarUrl} alt={friend.name} className="h-full w-full object-cover" />
                        </div>
                        <div className="text-left overflow-hidden">
                          <h4 className="font-bold text-slate-700 text-xs leading-snug group-hover:text-violet-600 transition truncate">{friend.name}</h4>
                          <p className="text-slate-400 text-[10px] truncate mt-0.5">{friend.mutualFriends} mutual friends</p>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleAddFriend(friend.id, friend.name)}
                        disabled={friend.state === 'loading' || friend.state === 'requested'}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center shrink-0 cursor-pointer ${
                          friend.state === 'requested'
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 cursor-default'
                            : 'bg-white text-violet-600 border border-violet-200 hover:bg-violet-50 hover:border-violet-300 shadow-sm hover-lift'
                        }`}
                      >
                        {friend.state === 'loading' && <Loader2 className="h-3 w-3 animate-spin mr-1 text-violet-600" />}
                        {friend.state === 'requested' ? 'Requested' : 'Add Friend'}
                      </button>
                    </div>
                  ))}
                </div>

                {/* Nút Show More */}
                <button 
                  onClick={() => triggerToast("Đang tải thêm danh sách gợi ý kết bạn...")}
                  className="w-full flex items-center justify-center space-x-1 py-2 text-slate-400 hover:text-slate-700 text-xs font-bold transition-colors cursor-pointer border-t border-slate-100 pt-3 mt-2"
                >
                  <span>Show more</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              {/* Widget 3: Unlock Vizo Pro Banner (Khớp 100% TrangChu4.png) */}
              <div className="bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl p-5 text-white relative overflow-hidden shadow-md shadow-indigo-500/10">
                <div className="absolute top-[-20%] right-[-10%] w-[120px] h-[120px] rounded-full bg-white/10 blur-[30px] pointer-events-none"></div>
                <div className="space-y-4 relative z-10">
                  <div className="flex justify-between items-start">
                    <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md text-amber-300 shrink-0">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                    <button 
                      onClick={() => triggerToast("Đã đóng biểu ngữ quảng cáo!")}
                      className="text-white/60 hover:text-white transition cursor-pointer"
                    >
                      <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="text-left space-y-1.5">
                    <h4 className="font-extrabold text-sm tracking-tight font-outfit">Unlock More with Vizo Pro</h4>
                    <p className="text-white/80 text-[10px] leading-relaxed">Get exclusive features and boost your experience today.</p>
                  </div>
                  <button 
                    onClick={() => triggerToast("Cổng thanh toán Vizo Pro sẽ sớm được tích hợp ở Phase 3!")}
                    className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-50 text-indigo-600 text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    Upgrade Now
                  </button>
                </div>
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
                <a href="#ads" className="hover:underline">Ads</a>·
                <a href="#more" className="hover:underline">More</a>
              </div>
              <p className="mt-2 text-slate-400">© 2026 Vizo (MiniFaceBook)</p>
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
                {isLogin ? (
                  <LoginForm onToggleForm={() => setIsLogin(false)} onLoginSuccess={(u) => setUser(u)} />
                ) : (
                  <RegisterForm onToggleForm={() => setIsLogin(true)} />
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
