import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, UserPlus, UserCheck, UserX, Clock, Users, Loader2, Ban } from 'lucide-react';
import { friendService } from '../services/friendService';
import type {
  FriendshipResponse,
  UserSearchResponse,
  RelationshipStatus,
} from '../types/friend.types';
import { useToast } from '../../../core/toast/ToastContext';
import { useNavigate } from 'react-router-dom';

type TabKey = 'search' | 'friends' | 'pending' | 'sent';

interface FriendsPageProps {
  triggerToast?: (msg: string) => void;
  onStartChat?: (userId: string) => void;
}

/**
 * Trang quản lý Bạn bè (UI Phase 3). Gồm 4 tab:
 * - Tìm kiếm: search theo tên, nút hành động động theo relationshipStatus.
 * - Bạn bè: danh sách đã kết nối (unfriend).
 * - Lời mời: lời mời đến chờ duyệt (accept/reject).
 * - Đã gửi: lời mời mình đã gửi (thu hồi).
 */
export default function FriendsPage({ triggerToast: propTriggerToast, onStartChat: propOnStartChat }: FriendsPageProps) {
  const { triggerToast: contextTriggerToast } = useToast();
  const navigate = useNavigate();
  
  const triggerToast = propTriggerToast || contextTriggerToast;
  const onStartChat = propOnStartChat || ((userId: string) => {
    navigate(`/chats/${userId}`);
  });

  const [activeTab, setActiveTab] = useState<TabKey>('search');

  // Search state
  const [keyword, setKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // List states
  const [friends, setFriends] = useState<FriendshipResponse[]>([]);
  const [pending, setPending] = useState<FriendshipResponse[]>([]);
  const [sent, setSent] = useState<FriendshipResponse[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);

  // Track per-row loading để chống double-click
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const setBusy = (id: string, busy: boolean) =>
    setBusyIds((prev) => {
      const next = new Set(prev);
      if (busy) next.add(id);
      else next.delete(id);
      return next;
    });

  // ===== Search với debounce 300ms =====
  const runSearch = useCallback((q: string) => {
    if (!q.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    friendService
      .searchUsers(q.trim())
      .then((page) => setSearchResults(page.content))
      .catch(() => triggerToast('Tìm kiếm thất bại, vui lòng thử lại.'))
      .finally(() => setIsSearching(false));
  }, [triggerToast]);

  useEffect(() => {
    if (activeTab !== 'search') return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(keyword), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [keyword, activeTab, runSearch]);

  // ===== Load danh sách theo tab =====
  const loadList = useCallback((tab: TabKey) => {
    if (tab === 'search') return;
    setIsLoadingList(true);
    const loader =
      tab === 'friends'
        ? friendService.getFriends()
        : tab === 'pending'
          ? friendService.getPendingRequests()
          : friendService.getSentRequests();

    loader
      .then((data) => {
        if (tab === 'friends') setFriends(data);
        else if (tab === 'pending') setPending(data);
        else setSent(data);
      })
      .catch(() => triggerToast('Không tải được danh sách.'))
      .finally(() => setIsLoadingList(false));
  }, [triggerToast]);

  useEffect(() => {
    loadList(activeTab);
  }, [activeTab, loadList]);

  // ===== Helper cập nhật relationshipStatus 1 dòng trong search (Optimistic) =====
  const patchSearchRow = (userId: string, patch: Partial<UserSearchResponse>) => {
    setSearchResults((prev) =>
      prev.map((u) => (u.userId === userId ? { ...u, ...patch } : u))
    );
  };

  // ===== Action handlers (Optimistic UI) =====
  const handleSendRequest = async (user: UserSearchResponse) => {
    setBusy(user.userId, true);
    try {
      const fr = await friendService.sendRequest(user.userId);
      patchSearchRow(user.userId, {
        relationshipStatus: 'PENDING_SENT',
        friendshipId: fr.friendshipId,
      });
      triggerToast(`Đã gửi lời mời kết bạn đến ${user.name}!`);
    } catch {
      triggerToast('Gửi lời mời thất bại.');
    } finally {
      setBusy(user.userId, false);
    }
  };

  const handleCancelFromSearch = async (user: UserSearchResponse) => {
    if (!user.friendshipId) return;
    setBusy(user.userId, true);
    try {
      await friendService.cancelRequest(user.friendshipId);
      patchSearchRow(user.userId, { relationshipStatus: 'NONE', friendshipId: null });
      triggerToast('Đã thu hồi lời mời.');
    } catch {
      triggerToast('Thu hồi thất bại.');
    } finally {
      setBusy(user.userId, false);
    }
  };

  const handleAcceptFromSearch = async (user: UserSearchResponse) => {
    if (!user.friendshipId) return;
    setBusy(user.userId, true);
    try {
      await friendService.acceptRequest(user.friendshipId);
      patchSearchRow(user.userId, { relationshipStatus: 'FRIEND' });
      triggerToast(`Đã chấp nhận kết bạn với ${user.name}!`);
    } catch {
      triggerToast('Chấp nhận thất bại.');
    } finally {
      setBusy(user.userId, false);
    }
  };

  const handleUnblockFromSearch = async (user: UserSearchResponse) => {
    setBusy(user.userId, true);
    try {
      await friendService.unblockUser(user.userId);
      patchSearchRow(user.userId, { relationshipStatus: 'NONE', friendshipId: null });
      triggerToast(`Đã bỏ chặn ${user.name}.`);
    } catch {
      triggerToast('Bỏ chặn thất bại.');
    } finally {
      setBusy(user.userId, false);
    }
  };

  // List actions
  const handleAcceptInList = async (item: FriendshipResponse) => {
    setBusy(item.friendshipId, true);
    try {
      await friendService.acceptRequest(item.friendshipId);
      setPending((prev) => prev.filter((p) => p.friendshipId !== item.friendshipId));
      triggerToast(`Đã chấp nhận kết bạn với ${item.name}!`);
    } catch {
      triggerToast('Chấp nhận thất bại.');
    } finally {
      setBusy(item.friendshipId, false);
    }
  };

  const handleRejectInList = async (item: FriendshipResponse) => {
    setBusy(item.friendshipId, true);
    try {
      await friendService.rejectRequest(item.friendshipId);
      setPending((prev) => prev.filter((p) => p.friendshipId !== item.friendshipId));
      triggerToast('Đã từ chối lời mời.');
    } catch {
      triggerToast('Từ chối thất bại.');
    } finally {
      setBusy(item.friendshipId, false);
    }
  };

  const handleCancelInList = async (item: FriendshipResponse) => {
    setBusy(item.friendshipId, true);
    try {
      await friendService.cancelRequest(item.friendshipId);
      setSent((prev) => prev.filter((p) => p.friendshipId !== item.friendshipId));
      triggerToast('Đã thu hồi lời mời.');
    } catch {
      triggerToast('Thu hồi thất bại.');
    } finally {
      setBusy(item.friendshipId, false);
    }
  };

  const handleUnfriend = async (item: FriendshipResponse) => {
    setBusy(item.friendshipId, true);
    try {
      await friendService.unfriend(item.userId);
      setFriends((prev) => prev.filter((p) => p.userId !== item.userId));
      triggerToast(`Đã hủy kết bạn với ${item.name}.`);
    } catch {
      triggerToast('Hủy kết bạn thất bại.');
    } finally {
      setBusy(item.friendshipId, false);
    }
  };

  // ===== Sub-components =====
  const Avatar = ({ name, avatar }: { name: string; avatar?: string }) => (
    <div className="h-11 w-11 rounded-full border border-slate-200 overflow-hidden bg-slate-100 shrink-0 shadow-sm">
      {avatar ? (
        <img src={avatar} alt={name} className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full flex items-center justify-center text-slate-500 font-bold bg-slate-50">
          {name?.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );

  /** Nút hành động động theo relationshipStatus trong tab Tìm kiếm. */
  const SearchActionButton = ({ user }: { user: UserSearchResponse }) => {
    const busy = busyIds.has(user.userId);
    const base =
      'px-3.5 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-60';

    if (busy) {
      return (
        <button disabled title="Đang tải" className={`${base} bg-slate-100 text-slate-400`}>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        </button>
      );
    }

    switch (user.relationshipStatus as RelationshipStatus) {
      case 'NONE':
        return (
          <button onClick={() => handleSendRequest(user)} className={`${base} bg-violet-600 text-white hover:bg-violet-500 shadow-sm hover-lift`}>
            <UserPlus className="h-3.5 w-3.5 mr-1" /> Kết bạn
          </button>
        );
      case 'PENDING_SENT':
        return (
          <button onClick={() => handleCancelFromSearch(user)} className={`${base} bg-white text-slate-600 border border-slate-200 hover:bg-slate-50`}>
            <Clock className="h-3.5 w-3.5 mr-1" /> Thu hồi
          </button>
        );
      case 'PENDING_RECEIVED':
        return (
          <button onClick={() => handleAcceptFromSearch(user)} className={`${base} bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm`}>
            <UserCheck className="h-3.5 w-3.5 mr-1" /> Phản hồi
          </button>
        );
      case 'FRIEND':
        return (
          <span className={`${base} bg-emerald-50 text-emerald-600 border border-emerald-100 cursor-default`}>
            <UserCheck className="h-3.5 w-3.5 mr-1" /> Bạn bè
          </span>
        );
      case 'BLOCKED':
        return (
          <button onClick={() => handleUnblockFromSearch(user)} className={`${base} bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100`}>
            <Ban className="h-3.5 w-3.5 mr-1" /> Bỏ chặn
          </button>
        );
      default:
        return null;
    }
  };

  const tabs: { key: TabKey; label: string; icon: typeof Search; count?: number }[] = [
    { key: 'search', label: 'Tìm kiếm', icon: Search },
    { key: 'friends', label: 'Bạn bè', icon: Users, count: friends.length },
    { key: 'pending', label: 'Lời mời', icon: UserPlus, count: pending.length },
    { key: 'sent', label: 'Đã gửi', icon: Clock, count: sent.length },
  ];

  return (
    <div className="w-full animate-fade-in-up">
      {/* Tabs */}
      <div className="flex items-center gap-2 mb-5 border-b border-slate-200 pb-1 overflow-x-auto">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-[13px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                active ? 'text-violet-600' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className="h-5 min-w-5 px-1.5 flex items-center justify-center text-[10px] font-black bg-violet-100 text-violet-600 rounded-full">
                  {t.count}
                </span>
              )}
              {active && <span className="absolute bottom-[-5px] left-0 right-0 h-0.5 bg-violet-600 rounded-full" />}
            </button>
          );
        })}
      </div>

      {/* TAB: SEARCH */}
      {activeTab === 'search' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              autoFocus
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Nhập tên người bạn muốn tìm..."
              className="w-full pl-10 pr-10 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-sm text-slate-700 transition-all shadow-sm"
            />
            {isSearching && <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-violet-500 animate-spin" />}
          </div>

          {!keyword.trim() && (
            <div className="text-center py-12 text-slate-400">
              <Search className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">Nhập tên để tìm kiếm bạn bè</p>
            </div>
          )}

          {keyword.trim() && !isSearching && searchResults.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <UserX className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">Không tìm thấy ai với tên "{keyword}"</p>
            </div>
          )}

          <div className="space-y-2">
            {searchResults.map((u) => (
              <div key={u.userId} className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all">
                <div 
                  onClick={() => navigate(`/profile/${u.userId}`)}
                  className="flex items-center space-x-3 overflow-hidden cursor-pointer group/item"
                >
                  <Avatar name={u.name} avatar={u.avatar} />
                  <div className="text-left overflow-hidden">
                    <h4 className="font-bold text-slate-800 text-sm truncate group-hover/item:text-violet-600 transition-colors">{u.name}</h4>
                    <p className="text-slate-400 text-xs truncate mt-0.5">{u.bio || u.email}</p>
                  </div>
                </div>
                <SearchActionButton user={u} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: LISTS (friends / pending / sent) */}
      {activeTab !== 'search' && (
        <div className="space-y-2">
          {isLoadingList ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <>
              {activeTab === 'friends' && friends.length === 0 && (
                <EmptyState icon={Users} text="Bạn chưa có người bạn nào. Hãy tìm kiếm và kết bạn nhé!" />
              )}
              {activeTab === 'pending' && pending.length === 0 && (
                <EmptyState icon={UserPlus} text="Không có lời mời kết bạn nào đang chờ." />
              )}
              {activeTab === 'sent' && sent.length === 0 && (
                <EmptyState icon={Clock} text="Bạn chưa gửi lời mời kết bạn nào." />
              )}

              {(activeTab === 'friends' ? friends : activeTab === 'pending' ? pending : sent).map((item) => {
                const busy = busyIds.has(item.friendshipId);
                return (
                  <div key={item.friendshipId} className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all">
                    <div 
                      onClick={() => navigate(`/profile/${item.userId}`)}
                      className="flex items-center space-x-3 overflow-hidden cursor-pointer group/item"
                    >
                      <Avatar name={item.name} avatar={item.avatar} />
                      <div className="text-left overflow-hidden">
                        <h4 className="font-bold text-slate-800 text-sm truncate group-hover/item:text-violet-600 transition-colors">{item.name}</h4>
                        <p className="text-slate-400 text-xs truncate mt-0.5">{item.bio || item.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {busy ? (
                        <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
                      ) : activeTab === 'friends' ? (
                        <div className="flex items-center gap-2">
                          <button onClick={() => onStartChat?.(item.userId)} className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-violet-600 text-white hover:bg-violet-500 transition cursor-pointer flex items-center shadow-sm">
                            Nhắn tin
                          </button>
                          <button onClick={() => handleUnfriend(item)} className="px-3.5 py-1.5 rounded-lg text-[11px] font-bold bg-white text-rose-600 border border-rose-100 hover:bg-rose-50 transition cursor-pointer flex items-center">
                            <UserX className="h-3.5 w-3.5 mr-1" /> Hủy kết bạn
                          </button>
                        </div>
                      ) : activeTab === 'pending' ? (
                        <>
                          <button onClick={() => handleAcceptInList(item)} className="px-3.5 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition cursor-pointer flex items-center shadow-sm">
                            <UserCheck className="h-3.5 w-3.5 mr-1" /> Chấp nhận
                          </button>
                          <button onClick={() => handleRejectInList(item)} className="px-3.5 py-1.5 rounded-lg text-[11px] font-bold bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition cursor-pointer flex items-center">
                            <UserX className="h-3.5 w-3.5 mr-1" /> Từ chối
                          </button>
                        </>
                      ) : (
                        <button onClick={() => handleCancelInList(item)} className="px-3.5 py-1.5 rounded-lg text-[11px] font-bold bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition cursor-pointer flex items-center">
                          <Clock className="h-3.5 w-3.5 mr-1" /> Thu hồi
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/** Trạng thái rỗng cho các tab danh sách. */
function EmptyState({ icon: Icon, text }: { icon: typeof Search; text: string }) {
  return (
    <div className="text-center py-12 text-slate-400">
      <Icon className="h-10 w-10 mx-auto mb-3 opacity-40" />
      <p className="text-sm font-medium">{text}</p>
    </div>
  );
}
