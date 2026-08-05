// Test edit for permission approval
import React, { useState, useEffect, useLayoutEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Bell, 
  User, 
  Settings, 
  Loader2, 
  LogOut, 
  ChevronDown,
  MessageCircle,
  Users,
  UserPlus,
  Home,
  X,
  Heart,
  UserCheck,
  CheckCheck,
  Shield
} from 'lucide-react';
import { useAuth } from '../../core/auth/AuthContext';
import { useToast } from '../../core/toast/ToastContext';
import { useWebSocket } from '../../modules/chat/hooks/useWebSocket';
import { useChatUnread } from '../../modules/chat/hooks/useChatUnread';
import { useNotifications } from '../../modules/notification/hooks/useNotifications';
import { friendService } from '../../modules/friends/services/friendService';
import { postService } from '../../modules/post/services/postService';
import { presenceService } from '../../modules/chat/services/presenceService';
import { webSocketService } from '../../modules/chat/services/webSocketService';
import { NetworkStatusBanner } from '../NetworkStatusBanner';
import MobileHeader from './MobileHeader';
import MobileBottomNav from './MobileBottomNav';
import type { NotificationResponse } from '../../modules/notification/types/notification.types';
import type { FriendshipResponse } from '../../modules/friends/types/friend.types';
import type { PostSuggestionResponse } from '../../modules/post/types/post.types';
import { useRef } from 'react';

const TYPE_META = {
  LIKE: { icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50' },
  COMMENT: { icon: MessageCircle, color: 'text-sky-500', bg: 'bg-sky-50' },
  FRIEND_REQUEST: { icon: UserPlus, color: 'text-violet-500', bg: 'bg-violet-50' },
  FRIEND_ACCEPTED: { icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  SYSTEM_ANNOUNCEMENT: { icon: Shield, color: 'text-purple-600', bg: 'bg-purple-50' },
  SYSTEM_MODERATION: { icon: Shield, color: 'text-amber-600', bg: 'bg-amber-50' },
};

const normalizeSearchQuery = (value: string) => value.normalize('NFC').trim().replace(/\s+/g, ' ');

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
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileContentRef = useRef<HTMLDivElement>(null);
  const { triggerToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const isAdmin = Boolean(
    user && (
      user.roles?.includes('ADMIN') ||
      (user as any).roles?.includes('ROLE_ADMIN') ||
      (Array.isArray(user.roles) && user.roles.some((r: any) => String(r).toUpperCase().includes('ADMIN'))) ||
      user.email === 'nguyen.van.an@seed.miniface.com'
    )
  );

  // Kích hoạt kết nối WebSocket & heartbeat cho presence
  useWebSocket(!!user);

  // Tổng tin nhắn chưa đọc cho chấm đỏ nút Chats sidebar (Phase 5.4 - realtime).
  const { totalUnread: chatUnread } = useChatUnread(!!user, user?.id);

  // Trạng thái giao diện cao cấp
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<PostSuggestionResponse[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);

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

  // Bạn bè online thật: Redis presence + WS /topic/presence
  const [friends, setFriends] = useState<FriendshipResponse[]>([]);
  const [onlineFriendIds, setOnlineFriendIds] = useState<Set<string>>(new Set());
  const friendsRef = useRef<FriendshipResponse[]>([]);

  // Xác định activeTab dựa trên URL path
  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/') return 'feed';
    if (path.startsWith('/friends')) return 'friends';
    if (path.startsWith('/chats')) return 'chats';
    if (path.startsWith('/profile')) return 'profile';
    if (path.startsWith('/settings')) return 'settings';
    if (path.startsWith('/search')) return 'search';
    return 'feed';
  };
  const activeTab = getActiveTab();
  const isMobileChatThread = /^\/chats\/[^/]+/.test(location.pathname);

  const resetMobileRouteScroll = () => {
    mobileContentRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  };

  useLayoutEffect(() => {
    resetMobileRouteScroll();
    const frame = window.requestAnimationFrame(resetMobileRouteScroll);
    return () => window.cancelAnimationFrame(frame);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const syncMobileViewport = () => {
      if (window.matchMedia('(max-width: 767px)').matches) {
        document.documentElement.style.setProperty('--mobile-visual-viewport-height', `${viewport.height}px`);
      }
    };

    syncMobileViewport();
    viewport.addEventListener('resize', syncMobileViewport);
    viewport.addEventListener('scroll', syncMobileViewport);
    return () => {
      viewport.removeEventListener('resize', syncMobileViewport);
      viewport.removeEventListener('scroll', syncMobileViewport);
      document.documentElement.style.removeProperty('--mobile-visual-viewport-height');
    };
  }, []);

  // Notification Center (Phase 5.1): badge realtime + dropdown chuông.
  const {
    notifications,
    unreadCount,
    loading: notifLoading,
    loaded: notifLoaded,
    loadNotifications,
    markAsRead: markNotifAsRead,
    markAllAsRead: markAllNotifAsRead,
  } = useNotifications(user?.id, (n) => {
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

  // Load friends + poll presence + subscribe WS presence (realtime)
  useEffect(() => {
    if (!user) {
      setFriends([]);
      setOnlineFriendIds(new Set());
      friendsRef.current = [];
      return;
    }

    let cancelled = false;
    let pollTimer: number | null = null;

    const refreshOnline = (list: FriendshipResponse[]) => {
      const ids = list.map((f) => f.userId).filter(Boolean);
      if (ids.length === 0) {
        if (!cancelled) setOnlineFriendIds(new Set());
        return;
      }
      presenceService
        .checkOnlineStatus(ids)
        .then((onlineIds) => {
          if (!cancelled) setOnlineFriendIds(new Set(onlineIds));
        })
        .catch(() => {});
    };

    friendService
      .getFriends()
      .then((list) => {
        if (cancelled) return;
        const friendsList = list || [];
        setFriends(friendsList);
        friendsRef.current = friendsList;
        refreshOnline(friendsList);
        pollTimer = window.setInterval(() => refreshOnline(friendsRef.current), 20000);
      })
      .catch(() => {
        if (!cancelled) {
          setFriends([]);
          friendsRef.current = [];
        }
      });

    const unsub = webSocketService.subscribe<{ userId: string; status: string }>(
      '/topic/presence',
      (payload) => {
        if (!payload?.userId) return;
        const isFriend = friendsRef.current.some((f) => f.userId === payload.userId);
        if (!isFriend) return;
        setOnlineFriendIds((prev) => {
          const next = new Set(prev);
          if (payload.status === 'ONLINE') next.add(payload.userId);
          else next.delete(payload.userId);
          return next;
        });
      }
    );

    const unsubBroadcast = webSocketService.subscribe<{ title: string; content: string }>(
      '/topic/broadcast',
      (payload) => {
        if (payload?.title && payload?.content) {
          triggerToast(`📢 ${payload.title}: ${payload.content}`);
        }
      }
    );

    return () => {
      cancelled = true;
      if (pollTimer) clearInterval(pollTimer);
      unsub();
      unsubBroadcast();
    };
  }, [user, triggerToast]);

  useEffect(() => {
    if (!showNotifDropdown) return;

    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('#sidebar-notifications-btn')) return;
      if (target.closest('#header-notifications-btn')) return;
      if (target.closest('#mobile-notifications-btn')) return;
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifDropdown(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowNotifDropdown(false);
    };

    const shouldLockBody = window.matchMedia('(max-width: 767px)').matches;
    const previousOverflow = document.body.style.overflow;
    if (shouldLockBody) document.body.style.overflow = 'hidden';

    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', handleKeyDown);
      if (shouldLockBody) document.body.style.overflow = previousOverflow;
    };
  }, [showNotifDropdown]);

  useEffect(() => {
    const query = normalizeSearchQuery(searchQuery);
    if (query.length < 2) {
      setSearchSuggestions([]);
      setIsSearching(false);
      setActiveSuggestion(-1);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setIsSearching(true);
      postService.getSearchSuggestions(query, controller.signal)
        .then((response) => setSearchSuggestions(response.data))
        .catch((error: any) => {
          if (error?.code !== 'ERR_CANCELED') setSearchSuggestions([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsSearching(false);
        });
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  useEffect(() => {
    if (!isSearchOpen) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setIsSearchOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsSearchOpen(false);
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isSearchOpen]);

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

  const submitPostSearch = () => {
    const query = normalizeSearchQuery(searchQuery);
    if (query.length < 2) {
      triggerToast('Nhập ít nhất 2 ký tự để tìm bài viết.');
      return;
    }
    setIsSearchOpen(false);
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const selectSuggestion = () => submitPostSearch();

  const handleTabClick = (tabId: string) => {
    if (tabId === 'feed') {
      resetMobileRouteScroll();
      navigate('/');
    } else if (tabId === 'profile') {
      resetMobileRouteScroll();
      navigate('/profile');
    } else if (tabId === 'friends') {
      resetMobileRouteScroll();
      navigate('/friends');
    } else if (tabId === 'chats') {
      resetMobileRouteScroll();
      navigate('/chats');
    } else if (tabId === 'admin') {
      resetMobileRouteScroll();
      navigate('/admin');
    } else if (tabId === 'settings') {
      resetMobileRouteScroll();
      navigate('/settings');
    } else if (tabId === 'logout') handleLogout();
    else if (tabId === 'notifications') {
      toggleNotifDropdown();
    } else {
      triggerToast(`Tính năng này sẽ ra mắt ở Phase tiếp theo!`);
    }
  };

  if (!user) return null;

  return (
    <div
      data-testid="app-shell"
      className="app-dynamic-height relative flex flex-col overflow-hidden bg-[hsl(var(--background))] text-slate-800 dark:text-slate-100 md:h-auto md:min-h-screen md:overflow-x-hidden md:overflow-y-visible"
    >
      {/* Banner mất kết nối Internet (chuẩn Facebook/Discord) */}
      <NetworkStatusBanner />
      
      {/* Hiệu ứng hào quang nền nhẹ nhàng (Minimalist Light Radial Glow) */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 dark:bg-indigo-500/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-500/5 dark:bg-violet-500/10 blur-[120px] pointer-events-none"></div>

      <MobileHeader
        onHome={() => navigate('/')}
        onSearch={() => navigate('/search')}
        showSearch={activeTab === 'feed'}
      />

      {/* Top Header Full-Width */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-[190] hidden md:flex items-center justify-between px-4 lg:px-6 shadow-sm">
        {/* Left Section: Logo + Search bar */}
        <div className="flex items-center">
          <div 
            onClick={() => navigate('/')}
            className="flex items-center space-x-2.5 cursor-pointer hover:opacity-90 transition shrink-0"
          >
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-500/20">
              <span className="text-white font-black text-lg font-outfit">H</span>
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100 font-outfit hidden sm:block">
              Hizo
            </span>
          </div>
          {activeTab === 'feed' && (
            <div ref={searchRef} className="relative ml-4 h-9 w-48 sm:w-64 md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <form onSubmit={(event) => { event.preventDefault(); submitPostSearch(); }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onFocus={() => setIsSearchOpen(true)}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowDown' && searchSuggestions.length > 0) {
                      event.preventDefault();
                      setActiveSuggestion((current) => Math.min(current + 1, searchSuggestions.length - 1));
                    } else if (event.key === 'ArrowUp' && searchSuggestions.length > 0) {
                      event.preventDefault();
                      setActiveSuggestion((current) => Math.max(current - 1, 0));
                    } else if (event.key === 'Escape') {
                      setIsSearchOpen(false);
                    }
                  }}
                  role="combobox"
                  aria-label="Tìm bài viết"
                  aria-expanded={isSearchOpen && normalizeSearchQuery(searchQuery).length >= 2}
                  aria-controls="post-search-suggestions"
                  aria-activedescendant={activeSuggestion >= 0 ? `post-search-suggestion-${activeSuggestion}` : undefined}
                  placeholder="Tìm bài viết..."
                  className="h-full w-full rounded-full border border-transparent bg-slate-100/60 pl-9 pr-4 text-xs font-medium text-slate-700 transition-all focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-500/10 dark:bg-slate-800 dark:text-slate-200 dark:focus:bg-slate-900"
                />
              </form>
              {isSearchOpen && normalizeSearchQuery(searchQuery).length >= 2 && (
                <div id="post-search-suggestions" role="listbox" className="absolute left-0 top-11 z-[210] w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900">
                  {isSearching ? (
                    <div className="flex items-center gap-2 px-3 py-3 text-xs font-medium text-slate-400"><Loader2 className="h-4 w-4 animate-spin text-violet-500" />Đang tìm kiếm...</div>
                  ) : searchSuggestions.length > 0 ? (
                    <>
                      {searchSuggestions.map((suggestion, index) => (
                        <button
                          key={suggestion.id}
                          id={`post-search-suggestion-${index}`}
                          type="button"
                          role="option"
                          aria-selected={activeSuggestion === index}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={selectSuggestion}
                          className={`block w-full rounded-xl px-3 py-2 text-left transition ${activeSuggestion === index ? 'bg-violet-50 dark:bg-violet-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                          <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">{suggestion.authorName}</p>
                          <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">{suggestion.excerpt}</p>
                        </button>
                      ))}
                      <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={submitPostSearch} className="mt-1 w-full rounded-xl border-t border-slate-100 px-3 py-2 text-left text-xs font-bold text-violet-600 hover:bg-violet-50 dark:border-slate-800 dark:hover:bg-violet-500/10">Xem tất cả kết quả</button>
                    </>
                  ) : (
                    <p className="px-3 py-3 text-xs text-slate-400">Không tìm thấy bài viết phù hợp.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Section: Messenger + Notifications + Profile Avatar */}
        <div className="flex items-center space-x-2.5">
          {/* Messenger Icon */}
          <button 
            onClick={() => {
              if (activeTab === 'chats') {
                navigate('/');
              } else {
                navigate('/chats');
              }
            }}
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

          {/* Admin Portal Direct Header Button */}
          {isAdmin && (
            <button
              onClick={() => navigate('/admin')}
              title="Trang Quản trị Admin"
              className="h-9 px-3 flex items-center space-x-1.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition cursor-pointer shrink-0 animate-pulse"
            >
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Admin Portal</span>
            </button>
          )}

          {/* User Profile Pill */}
          <button 
            onClick={() => navigate('/profile')}
            title="Trang cá nhân của bạn"
            className="flex items-center space-x-2 px-2.5 h-9 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition cursor-pointer shadow-sm"
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
            <span className="text-xs font-bold text-slate-700 hidden lg:inline max-w-[110px] truncate">{user.name || 'User'}</span>
          </button>
        </div>
      </header>

      <div
        ref={mobileContentRef}
        data-testid="mobile-route-scroll"
        className={`app-header-offset flex-1 min-h-0 w-full max-w-[1600px] mx-auto flex justify-start relative ${
        activeTab === 'chats' 
          ? 'px-0 md:px-2 lg:px-3 gap-3 flex-1 min-h-0 overflow-hidden lg:justify-between'
          : 'px-4 lg:px-6 xl:px-8 gap-6 overflow-y-auto overscroll-contain md:overflow-visible'
      }`}
      >
        
        {/* CỘT TRÁI: SIDEBAR ĐIỀU HƯỚNG */}
        <aside className="hidden md:flex flex-col w-[80px] lg:w-[240px] shrink-0 sticky top-14 h-[calc(100vh-56px)] py-3 lg:pr-2 transition-all duration-300 justify-between overflow-y-auto scrollbar-none">
          <div className="space-y-4">
            {/* Menu Items */}
            <nav className="space-y-1">
              {[
                { id: 'feed', label: 'Trang chủ', icon: Home, badge: null },
                { id: 'friends', label: 'Bạn bè', icon: Users, badge: null },
                { id: 'chats', label: 'Trò chuyện', icon: MessageCircle, badge: chatUnread > 0 ? (chatUnread > 99 ? '99+' : String(chatUnread)) : null },
                { id: 'notifications', label: 'Thông báo', icon: Bell, badge: unreadCount > 0 ? (unreadCount > 99 ? '99+' : String(unreadCount)) : null },
                { id: 'profile', label: 'Trang cá nhân', icon: User, badge: null },
                ...(isAdmin ? [{ id: 'admin', label: 'Trang Quản trị', icon: Shield, badge: null }] : []),
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
        </aside>

        {/* Floating Notification Panel */}
        {showNotifDropdown && (
          <>
          <button
            type="button"
            aria-label="Đóng bảng thông báo"
            onClick={() => setShowNotifDropdown(false)}
            className="fixed inset-0 z-[194] bg-slate-950/35 backdrop-blur-[2px] md:hidden"
          />
          <div
            ref={notifRef}
            data-testid="notification-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="notification-panel-title"
            className="fixed inset-x-0 bottom-0 z-[195] flex max-h-[var(--sheet-max-height)] flex-col overflow-hidden rounded-t-3xl border border-b-0 border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl animate-fade-in md:inset-x-auto md:bottom-auto md:right-6 md:top-[58px] md:h-[calc(100vh-80px)] md:w-[360px] md:max-w-[calc(100vw-2rem)] md:rounded-2xl md:border-b md:pb-0"
          >
            <div className="flex h-5 items-center justify-center md:hidden" aria-hidden="true">
              <span className="h-1 w-10 rounded-full bg-slate-300" />
            </div>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 md:py-3.5 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-violet-600 fill-violet-50/50" />
                <span id="notification-panel-title" className="font-bold text-slate-800 text-sm font-outfit">Thông báo</span>
              </div>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllNotifAsRead}
                    className="touch-target flex items-center gap-1 text-xs font-bold text-violet-600 hover:text-violet-500 transition cursor-pointer"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Đọc tất cả
                  </button>
                )}
                <button 
                  onClick={() => setShowNotifDropdown(false)}
                  aria-label="Đóng bảng thông báo"
                  className="touch-target flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition cursor-pointer"
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
                  const isAdmin = n.actorId === 'ADMIN' || n.type === 'SYSTEM_ANNOUNCEMENT' || n.type === 'SYSTEM_MODERATION';
                  const displayName = isAdmin ? 'Ban Quản Trị (Admin)' : (n.actorName || 'Người dùng');

                  return (
                    <button
                      key={n.id}
                      onClick={() => {
                        if (!n.isRead) markNotifAsRead(n.id);
                        handleNotifNavigate(n);
                        setShowNotifDropdown(false);
                      }}
                      className={`w-full flex items-start gap-3 px-3 py-2.5 text-left transition cursor-pointer hover:bg-slate-50 border-b border-slate-100/50 rounded-xl ${
                        n.isRead ? 'text-slate-600' : 'bg-purple-50/40 font-semibold text-slate-900'
                      }`}
                      aria-label={`${displayName} ${n.content ?? ''}`}
                    >
                      {/* Avatar actor */}
                      <div className="relative shrink-0">
                        {isAdmin || (n.actorAvatar && n.actorAvatar.includes('ADMIN')) ? (
                          <div className="h-9 w-9 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-600 font-bold">
                            <Shield className="h-5 w-5 text-purple-600 fill-purple-200/50" />
                          </div>
                        ) : (
                          <div className="h-9 w-9 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 font-bold">
                            {n.actorAvatar ? (
                              <img src={n.actorAvatar} alt={displayName} className="h-full w-full object-cover" />
                            ) : (
                              displayName.charAt(0).toUpperCase()
                            )}
                          </div>
                        )}
                        {!isAdmin && (
                          <span className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center border-2 border-white ${meta.bg}`}>
                            <Icon className={`h-2.5 w-2.5 ${meta.color}`} />
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs leading-snug">
                          <span className={`font-bold ${isAdmin ? 'text-purple-700 font-black' : 'text-slate-800'}`}>{displayName}</span>{' '}
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
          </>
        )}

        {/* CỘT GIỮA: RENDER ROUTE CON */}
        <main className={`flex-1 w-full min-w-0 transition-all duration-300 ${
          activeTab === 'chats' 
            ? 'lg:max-w-full py-0 md:py-1 h-full overflow-hidden flex flex-col'
            : (activeTab === 'profile' || activeTab === 'settings')
            ? 'lg:max-w-[1000px] py-3 min-h-0 md:min-h-screen'
            : 'lg:max-w-[680px] py-3 min-h-0 md:min-h-screen'
        }`}>


          {/* Render trang con */}
          <div className={`w-full ${activeTab === 'chats' ? 'flex-1 min-h-0 flex flex-col' : ''}`}>
            <Outlet />
          </div>
        </main>

        {/* CỘT PHẢI: GỢI Ý KẾT BẠN & BẠN ONLINE */}
        <aside className={`hidden lg:flex flex-col w-[300px] xl:w-[340px] shrink-0 sticky top-14 h-[calc(100vh-56px)] justify-between py-3 pl-1 transition-all duration-300 ${(activeTab === 'chats' || activeTab === 'profile' || activeTab === 'settings') ? '!hidden' : ''}`}>
          <div className="space-y-4 overflow-y-auto pr-1 scrollbar-none">
            
            {/* Widget 1: Suggested Friends */}
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

            {/* Widget 3: Bạn bè online (Redis presence + WebSocket realtime) */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="font-bold text-slate-800 text-sm font-outfit">Bạn bè đang online</span>
                </div>
                {onlineFriendIds.size > 0 && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {onlineFriendIds.size}
                  </span>
                )}
              </div>
              {(() => {
                const onlineFriends = friends.filter((f) => onlineFriendIds.has(f.userId));
                const shown = onlineFriends.slice(0, 8);
                const extra = onlineFriends.length - shown.length;

                if (onlineFriends.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center py-3 text-center space-y-1.5 bg-slate-50/50 rounded-xl p-3 border border-slate-100/60">
                      <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                        <Users className="h-4 w-4" />
                      </div>
                      <p className="text-slate-400 text-[11px] leading-snug">
                        Chưa có bạn bè nào online.<br />
                        <span className="text-violet-600 font-bold cursor-pointer hover:underline" onClick={() => navigate('/friends')}>Kết bạn thêm</span> từ gợi ý trên!
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    {shown.map((f) => (
                      <button
                        key={f.userId}
                        type="button"
                        title={f.name || 'Bạn bè'}
                        onClick={() => navigate(`/profile/${f.userId}`)}
                        className="relative h-9 w-9 rounded-full border-2 border-white overflow-hidden bg-slate-100 shadow-sm ring-1 ring-slate-100 shrink-0 cursor-pointer hover:ring-violet-300 transition"
                      >
                        {f.avatar ? (
                          <img
                            src={f.avatar}
                            alt={f.name || 'Bạn bè'}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="h-full w-full flex items-center justify-center text-[11px] font-black text-slate-500 bg-slate-50">
                            {(f.name || 'U').charAt(0).toUpperCase()}
                          </span>
                        )}
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white"></span>
                      </button>
                    ))}
                    {extra > 0 && (
                      <button
                        type="button"
                        onClick={() => navigate('/friends')}
                        className="h-9 w-9 rounded-full bg-violet-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-violet-600 shadow-sm ring-1 ring-slate-100 cursor-pointer shrink-0 hover:bg-violet-200 transition"
                        title={`Còn ${extra} bạn online`}
                      >
                        +{extra}
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>

          </div>
        </aside>

      </div>

      <MobileBottomNav
        activeTab={activeTab}
        chatUnread={chatUnread}
        notificationUnread={unreadCount}
        notificationsOpen={showNotifDropdown}
        hidden={isMobileChatThread}
        onSelect={handleTabClick}
      />
    </div>
  );
};

export default MainLayout;
