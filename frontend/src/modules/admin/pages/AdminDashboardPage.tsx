import React, { useState, useEffect } from 'react';
import {
  Users,
  FileText,
  MessageSquare,
  Radio,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Ban,
  Unlock,
  Trash2,
  Send,
  Loader2,
  RefreshCw,
  TrendingUp,
  UserCheck,
  CheckCircle2,
  Activity,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Mail,
  User,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { adminService } from '../services/adminService';
import type { AdminStats, AdminUser, AdminPost } from '../services/adminService';
import { webSocketService } from '../../chat/services/webSocketService';

export const AdminDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'posts' | 'broadcast'>('stats');

  // Stats State
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Users State & Pagination
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(0);
  const [userTotalPages, setUserTotalPages] = useState(0);
  const [userTotalElements, setUserTotalElements] = useState(0);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  // Posts State & Pagination
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [postSearch, setPostSearch] = useState('');
  const [postPage, setPostPage] = useState(0);
  const [postTotalPages, setPostTotalPages] = useState(0);
  const [postTotalElements, setPostTotalElements] = useState(0);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  // Broadcast State
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastContent, setBroadcastContent] = useState('');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // Fetch Stats (Realtime Auto Sync)
  const fetchStats = async (isSilent = false) => {
    try {
      if (!isSilent) setLoadingStats(true);
      const res = await adminService.getStats();
      setStats(res);
    } catch (err) {
      console.error('Failed to fetch admin stats:', err);
    } finally {
      if (!isSilent) setLoadingStats(false);
    }
  };

  // Fetch Users (Realtime Auto Sync)
  const fetchUsers = async (isSilent = false, page = userPage) => {
    try {
      if (!isSilent) setLoadingUsers(true);
      const res = await adminService.getUsers(userSearch, page, 10);
      setUsers(res.content || []);
      setUserTotalPages(res.totalPages || 0);
      setUserTotalElements(res.totalElements || 0);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      if (!isSilent) setLoadingUsers(false);
    }
  };

  // Fetch Posts (Realtime Auto Sync)
  const fetchPosts = async (isSilent = false, page = postPage) => {
    try {
      if (!isSilent) setLoadingPosts(true);
      const res = await adminService.getPosts(postSearch, page, 10);
      setPosts(res.content || []);
      setPostTotalPages(res.totalPages || 0);
      setPostTotalElements(res.totalElements || 0);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      if (!isSilent) setLoadingPosts(false);
    }
  };

  // Smart Tối ưu Server: Đồng bộ ngầm 10s/lần khi xem Tab Admin, tự động PAUSE ngắt kết nối khi ẩn Tab
  useEffect(() => {
    const runSync = (isSilent = true) => {
      if (document.hidden) return; // Tự động tạm dừng 100% request khi người dùng mở tab khác
      if (activeTab === 'stats') fetchStats(isSilent);
      else if (activeTab === 'users') fetchUsers(isSilent, userPage);
      else if (activeTab === 'posts') fetchPosts(isSilent, postPage);
    };

    runSync(false);
    const interval = setInterval(() => runSync(true), 10000);

    const handleVisibilityChange = () => {
      if (!document.hidden) runSync(true);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeTab, userSearch, postSearch, userPage, postPage]);

  // Lắng nghe luồng WebSocket STOMP Realtime PUSH liên tục (/topic/admin/stats)
  useEffect(() => {
    webSocketService.connect();
    const unsub = webSocketService.subscribe<AdminStats>('/topic/admin/stats', (data) => {
      if (data) {
        setStats(data);
      }
    });
    return () => unsub();
  }, []);

  // Lắng nghe phím ESC để đóng Modal tức thì
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedUser(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUserPage(0);
    fetchUsers(false, 0);
  };

  const handleSearchPostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPostPage(0);
    fetchPosts(false, 0);
  };

  const handleUserPageChange = (newPage: number) => {
    if (newPage < 0 || newPage >= userTotalPages) return;
    setUserPage(newPage);
    fetchUsers(false, newPage);
  };

  const handlePostPageChange = (newPage: number) => {
    if (newPage < 0 || newPage >= postTotalPages) return;
    setPostPage(newPage);
    fetchPosts(false, newPage);
  };

  const handleToggleBan = async (userId: string) => {
    try {
      const updated = await adminService.toggleBanUser(userId);
      if (selectedUser?.id === userId) {
        setSelectedUser(updated);
      }
      fetchUsers(true, userPage);
    } catch (err) {
      alert('Thao tác Ban/Unban thất bại!');
    }
  };

  const handleChangeRole = async (userId: string, currentRoles: string[]) => {
    const newRole = currentRoles.includes('ADMIN') ? 'USER' : 'ADMIN';
    if (!confirm(`Bạn có chắc muốn chuyển vai trò tài khoản thành ${newRole}?`)) return;

    try {
      const updated = await adminService.changeUserRole(userId, newRole);
      if (selectedUser?.id === userId) {
        setSelectedUser(updated);
      }
      fetchUsers(true, userPage);
    } catch (err) {
      alert('Thao tác đổi quyền thất bại!');
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await adminService.deletePost(postId, deleteReason);
      setDeletingPostId(null);
      setDeleteReason('');
      fetchPosts();
    } catch (err) {
      alert('Xóa bài viết thất bại!');
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastContent.trim()) return;

    try {
      setSendingBroadcast(true);
      await adminService.broadcastNotification({
        title: broadcastTitle,
        content: broadcastContent,
      });
      setBroadcastSuccess(true);
      setBroadcastTitle('');
      setBroadcastContent('');
      setTimeout(() => setBroadcastSuccess(false), 4000);
    } catch (err) {
      alert('Gửi thông báo toàn hệ thống thất bại!');
    } finally {
      setSendingBroadcast(false);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-8 animate-fade-in">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2 sm:gap-3">
              <Shield className="h-7 w-7 sm:h-8 sm:w-8 text-purple-500" />
              <span>Admin Control Center</span>
            </h1>
            <span className="hidden sm:inline-flex px-2.5 py-1 rounded-full text-xs font-extrabold bg-purple-950 text-purple-300 border border-purple-800/60">
              MODERATION PORTAL
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Quản trị tổng quan hệ thống, người dùng, nội dung bài viết và truyền thông Realtime
          </p>
        </div>

        <button
          onClick={() => {
            if (activeTab === 'stats') fetchStats();
            if (activeTab === 'users') fetchUsers();
            if (activeTab === 'posts') fetchPosts();
          }}
          className="min-h-11 w-full md:w-auto flex items-center justify-center space-x-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-bold transition shadow-lg cursor-pointer shrink-0"
        >
          <RefreshCw className={`h-4 w-4 text-purple-400 ${loadingStats || loadingUsers || loadingPosts ? 'animate-spin' : ''}`} />
          <span>Làm mới dữ liệu</span>
        </button>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex space-x-2 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-xl overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex items-center space-x-2.5 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === 'stats'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/50'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          <span>Tổng quan & Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center space-x-2.5 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === 'users'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/50'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Quản lý Người dùng</span>
        </button>

        <button
          onClick={() => setActiveTab('posts')}
          className={`flex items-center space-x-2.5 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === 'posts'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/50'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Kiểm duyệt Bài viết</span>
        </button>

        <button
          onClick={() => setActiveTab('broadcast')}
          className={`flex items-center space-x-2.5 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === 'broadcast'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/50'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Radio className="h-4 w-4" />
          <span>Phát Thông báo Toàn hệ thống</span>
        </button>
      </div>

      {/* TAB 1: ANALYTICS & STATS */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          {/* KPI CARDS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: Total Users */}
            <div className="relative p-4 sm:p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-purple-500/20 shadow-xl overflow-hidden group hover:border-purple-500/40 transition">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition"></div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Tổng Người Dùng</span>
                <div className="p-2.5 rounded-xl bg-purple-950/80 border border-purple-500/30 text-purple-400">
                  <Users className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 text-3xl font-black text-white tracking-tight">
                {loadingStats ? <Loader2 className="h-7 w-7 animate-spin text-purple-400" /> : stats?.totalUsers ?? 0}
              </div>
              <p className="text-[11px] text-slate-500 mt-2">Tài khoản đã đăng ký trên hệ thống</p>
            </div>

            {/* Card 2: Total Posts */}
            <div className="relative p-4 sm:p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-indigo-500/20 shadow-xl overflow-hidden group hover:border-indigo-500/40 transition">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition"></div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Tổng Bài Viết</span>
                <div className="p-2.5 rounded-xl bg-indigo-950/80 border border-indigo-500/30 text-indigo-400">
                  <FileText className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 text-3xl font-black text-white tracking-tight">
                {loadingStats ? <Loader2 className="h-7 w-7 animate-spin text-indigo-400" /> : stats?.totalPosts ?? 0}
              </div>
              <p className="text-[11px] text-slate-500 mt-2">Bài viết chia sẻ trên Feed</p>
            </div>

            {/* Card 3: Total Comments */}
            <div className="relative p-4 sm:p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-pink-500/20 shadow-xl overflow-hidden group hover:border-pink-500/40 transition">
              <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/10 rounded-full blur-2xl group-hover:bg-pink-500/20 transition"></div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Tổng Bình Luận</span>
                <div className="p-2.5 rounded-xl bg-pink-950/80 border border-pink-500/30 text-pink-400">
                  <MessageSquare className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 text-3xl font-black text-white tracking-tight">
                {loadingStats ? <Loader2 className="h-7 w-7 animate-spin text-pink-400" /> : stats?.totalComments ?? 0}
              </div>
              <p className="text-[11px] text-slate-500 mt-2">Lượt thảo luận & phản hồi</p>
            </div>

            {/* Card 4: Online Users */}
            <div className="relative p-4 sm:p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-emerald-500/20 shadow-xl overflow-hidden group hover:border-emerald-500/40 transition">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition"></div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Online Realtime</span>
                <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <Activity className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 text-3xl font-black text-emerald-400 tracking-tight flex items-center space-x-2">
                <span>{loadingStats ? <Loader2 className="h-7 w-7 animate-spin text-emerald-400" /> : stats?.onlineUsers ?? 0}</span>
                <span className="h-3 w-3 rounded-full bg-emerald-500 animate-ping inline-block"></span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">Đang kết nối WebSocket song song</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* SEARCH BAR */}
          <form onSubmit={handleSearchUserSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Tìm kiếm người dùng theo Tên hoặc Email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="min-h-11 w-full pl-10 pr-4 bg-slate-900 border border-slate-800 rounded-xl text-base sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
              />
            </div>
            <button
              type="submit"
              className="min-h-11 px-5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-lg cursor-pointer"
            >
              Tìm kiếm
            </button>
          </form>

          {/* USER TABLE */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-extrabold border-b border-slate-800">
                  <tr>
                    <th className="py-4 px-6">Người dùng</th>
                    <th className="py-4 px-4">Email</th>
                    <th className="py-4 px-4">Vai trò (Role)</th>
                    <th className="py-4 px-4">Trạng thái</th>
                    <th className="py-4 px-4 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {loadingUsers ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-purple-400 mb-2" />
                        Đang tải danh sách người dùng...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500 font-bold">
                        Không tìm thấy người dùng nào!
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-800/40 transition">
                        <td
                          onClick={() => setSelectedUser(u)}
                          className="py-4 px-6 flex items-center space-x-3 cursor-pointer group"
                        >
                          <div className="h-9 w-9 rounded-full overflow-hidden bg-slate-800 border border-slate-700 shrink-0 group-hover:border-purple-500 transition">
                            {u.avatar ? (
                              <img src={u.avatar} alt="Avatar" className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center font-bold text-xs text-purple-400 bg-purple-950">
                                {u.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-200 group-hover:text-purple-300 transition flex items-center space-x-1.5">
                              <span>{u.name}</span>
                              <Eye className="h-3.5 w-3.5 text-slate-500 group-hover:text-purple-400 opacity-0 group-hover:opacity-100 transition" />
                            </div>
                            <div className="text-[10px] text-slate-500">ID: {u.id}</div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-slate-400 font-mono text-[11px]">{u.email}</td>
                        <td className="py-4 px-4">
                          {u.roles?.includes('ADMIN') ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-950 text-purple-300 border border-purple-500/40">
                              <ShieldCheck className="h-3 w-3" />
                              <span>ADMIN</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                              <UserCheck className="h-3 w-3" />
                              <span>USER</span>
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          {u.banned ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-950 text-rose-300 border border-rose-500/40">
                              <Ban className="h-3 w-3" />
                              <span>BANNED</span>
                            </span>
                          ) : u.isOnline ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              <span>ONLINE</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400">
                              <span>OFFLINE</span>
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right space-x-2">
                          <button
                            onClick={() => setSelectedUser(u)}
                            className="h-11 w-11 inline-flex items-center justify-center rounded-xl bg-slate-800 hover:bg-purple-900/60 text-slate-300 hover:text-purple-300 border border-slate-700 transition cursor-pointer"
                            title="Xem chi tiết thông tin tài khoản"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleChangeRole(u.id, u.roles)}
                            className="h-11 w-11 inline-flex items-center justify-center rounded-xl bg-slate-800 hover:bg-purple-900/60 text-slate-300 hover:text-purple-300 border border-slate-700 transition cursor-pointer"
                            title="Đổi vai trò Role"
                          >
                            <Shield className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleToggleBan(u.id)}
                            className={`h-11 w-11 inline-flex items-center justify-center rounded-xl border transition cursor-pointer ${
                              u.banned
                                ? 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border-emerald-700/60'
                                : 'bg-rose-950/60 hover:bg-rose-900 text-rose-300 border-rose-700/60'
                            }`}
                            title={u.banned ? 'Mở khóa tài khoản' : 'Khóa tài khoản (Ban)'}
                          >
                            {u.banned ? <Unlock className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* USER PAGINATION */}
            {userTotalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-slate-800/80 bg-slate-950/40 text-xs text-slate-400">
                <div>
                  Hiển thị trang <span className="font-bold text-slate-200">{userPage + 1}</span> / <span className="font-bold text-slate-200">{userTotalPages}</span> (Tổng <span className="font-bold text-purple-400">{userTotalElements}</span> người dùng)
                </div>
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => handleUserPageChange(userPage - 1)}
                    disabled={userPage === 0}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center space-x-1 font-bold cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Trang trước</span>
                  </button>

                  {Array.from({ length: userTotalPages }, (_, i) => i)
                    .filter((p) => p === 0 || p === userTotalPages - 1 || Math.abs(p - userPage) <= 1)
                    .map((p, index, array) => (
                      <React.Fragment key={p}>
                        {index > 0 && array[index - 1] !== p - 1 && (
                          <span className="px-1 text-slate-600">...</span>
                        )}
                        <button
                          onClick={() => handleUserPageChange(p)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            userPage === p
                              ? 'bg-purple-600 text-white shadow-md'
                              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {p + 1}
                        </button>
                      </React.Fragment>
                    ))}

                  <button
                    onClick={() => handleUserPageChange(userPage + 1)}
                    disabled={userPage >= userTotalPages - 1}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center space-x-1 font-bold cursor-pointer"
                  >
                    <span>Trang sau</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CONTENT MODERATION */}
      {activeTab === 'posts' && (
        <div className="space-y-6">
          {/* SEARCH BAR */}
          <form onSubmit={handleSearchPostSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Tìm kiếm nội dung bài viết..."
                value={postSearch}
                onChange={(e) => setPostSearch(e.target.value)}
                className="min-h-11 w-full pl-10 pr-4 bg-slate-900 border border-slate-800 rounded-xl text-base sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
              />
            </div>
            <button
              type="submit"
              className="min-h-11 px-5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-lg cursor-pointer"
            >
              Tìm kiếm
            </button>
          </form>

          {/* POSTS GRID */}
          {loadingPosts ? (
            <div className="py-16 text-center text-slate-500">
              <Loader2 className="h-7 w-7 animate-spin mx-auto text-purple-400 mb-2" />
              Đang tải danh sách bài viết...
            </div>
          ) : posts.length === 0 ? (
            <div className="py-16 text-center text-slate-500 font-bold bg-slate-900/50 rounded-2xl border border-slate-800">
              Không có bài viết nào!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {posts.map((p) => (
                <div key={p.id} className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-full overflow-hidden bg-slate-800 border border-slate-700">
                          {p.authorAvatar ? (
                            <img src={p.authorAvatar} alt="Avatar" className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center font-bold text-xs text-purple-400">
                              {p.authorName.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-200">{p.authorName}</div>
                          <div className="text-[10px] text-slate-500">{new Date(p.createdAt).toLocaleString('vi-VN')}</div>
                        </div>
                      </div>

                      <button
                        onClick={() => setDeletingPostId(p.id)}
                        className="min-h-11 px-3 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 transition cursor-pointer text-xs font-bold flex items-center space-x-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Xóa bài</span>
                      </button>
                    </div>

                    <p className="text-xs text-slate-300 mt-3 line-clamp-3 leading-relaxed">{p.content}</p>

                    {p.images && p.images.length > 0 && (
                      <div className="mt-3 rounded-xl overflow-hidden border border-slate-800 h-40 bg-slate-950">
                        <img src={p.images[0]} alt="Media" className="h-full w-full object-cover" />
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                    <div>❤️ {p.likeCount} Thích • 💬 {p.commentCount} Bình luận</div>
                    <div className="text-[10px] font-mono text-slate-500">ID: {p.id}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* POST PAGINATION */}
          {postTotalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400">
              <div>
                Hiển thị trang <span className="font-bold text-slate-200">{postPage + 1}</span> / <span className="font-bold text-slate-200">{postTotalPages}</span> (Tổng <span className="font-bold text-purple-400">{postTotalElements}</span> bài viết)
              </div>
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => handlePostPageChange(postPage - 1)}
                  disabled={postPage === 0}
                  className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center space-x-1 font-bold cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Trang trước</span>
                </button>

                {Array.from({ length: postTotalPages }, (_, i) => i)
                  .filter((p) => p === 0 || p === postTotalPages - 1 || Math.abs(p - postPage) <= 1)
                  .map((p, index, array) => (
                    <React.Fragment key={p}>
                      {index > 0 && array[index - 1] !== p - 1 && (
                        <span className="px-1 text-slate-600">...</span>
                      )}
                      <button
                        onClick={() => handlePostPageChange(p)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          postPage === p
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {p + 1}
                      </button>
                    </React.Fragment>
                  ))}

                <button
                  onClick={() => handlePostPageChange(postPage + 1)}
                  disabled={postPage >= postTotalPages - 1}
                  className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center space-x-1 font-bold cursor-pointer"
                >
                  <span>Trang sau</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* MODAL REASON DELETE POST */}
          {deletingPostId && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-fade-in-up">
                <div className="flex items-center space-x-2 text-rose-400 font-bold text-base">
                  <ShieldAlert className="h-5 w-5" />
                  <span>Xác nhận xóa bài viết vi phạm</span>
                </div>
                <p className="text-xs text-slate-400">
                  Nhập lý do xóa bài viết để thông báo tự động tới tác giả:
                </p>
                <textarea
                  rows={3}
                  placeholder="Ví dụ: Bài viết chứa nội dung vi phạm tiêu chuẩn cộng đồng..."
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-rose-500"
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setDeletingPostId(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    onClick={() => handleDeletePost(deletingPostId)}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-lg"
                  >
                    Xóa ngay
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SYSTEM BROADCAST */}
      {activeTab === 'broadcast' && (
        <div className="max-w-2xl mx-auto p-6 sm:p-8 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-purple-950 text-purple-400 border border-purple-500/30">
              <Radio className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Phát thông báo Realtime toàn hệ thống</h2>
              <p className="text-xs text-slate-400">
                Gửi thông báo tới TẤT CẢ người dùng đang online qua luồng SSE/WebSocket
              </p>
            </div>
          </div>

          {broadcastSuccess && (
            <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center space-x-2 animate-fade-in">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span>Đã phát thông báo thành công tới toàn bộ người dùng trong hệ thống!</span>
            </div>
          )}

          <form onSubmit={handleSendBroadcast} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Tiêu đề thông báo</label>
              <input
                type="text"
                required
                placeholder="Ví dụ: 📢 BẢO TRÌ HỆ THỐNG ĐỊNH KỲ"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-purple-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Nội dung thông báo</label>
              <textarea
                rows={4}
                required
                placeholder="Nhập nội dung chi tiết muốn truyền tải tới tất cả thành viên..."
                value={broadcastContent}
                onChange={(e) => setBroadcastContent(e.target.value)}
                className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-purple-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={sendingBroadcast}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-xl flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {sendingBroadcast ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang truyền tín hiệu...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Phát thông báo ngay</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* MODAL USER DETAILS PREVIEW */}
      {selectedUser && (
        <div
          onClick={() => setSelectedUser(null)}
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-purple-500/30 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl animate-fade-in-up relative overflow-hidden cursor-default"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

            {/* Header & Close */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2 text-purple-400 font-bold text-sm">
                <User className="h-5 w-5 pointer-events-none" />
                <span>Hồ Sơ Chi Tiết Người Dùng</span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedUser(null);
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition cursor-pointer shrink-0 z-10"
                title="Đóng (hoặc nhấn ESC)"
              >
                <X className="h-5 w-5 pointer-events-none" />
              </button>
            </div>

            {/* User Info Card */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-5">
              <div className="h-20 w-20 rounded-full overflow-hidden bg-slate-800 border-2 border-purple-500/50 shrink-0 shadow-lg">
                {selectedUser.avatar ? (
                  <img src={selectedUser.avatar} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center font-black text-2xl text-purple-300 bg-purple-950">
                    {selectedUser.name.charAt(0)}
                  </div>
                )}
              </div>

              <div className="space-y-1.5 text-center sm:text-left flex-1">
                <h3 className="text-lg font-black text-white">{selectedUser.name}</h3>
                <div className="flex items-center justify-center sm:justify-start space-x-2 text-xs font-mono text-slate-400">
                  <Mail className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                  <span>{selectedUser.email}</span>
                </div>
                <div className="text-[11px] font-mono text-slate-500">ID: {selectedUser.id}</div>
              </div>
            </div>

            {/* Badges Grid */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              {/* Role */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Vai trò (Role)</span>
                <div>
                  {selectedUser.roles?.includes('ADMIN') ? (
                    <span className="inline-flex items-center space-x-1 text-xs font-black text-purple-300">
                      <ShieldCheck className="h-4 w-4 text-purple-400" />
                      <span>SUPER ADMIN</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 text-xs font-bold text-slate-300">
                      <UserCheck className="h-4 w-4 text-slate-400" />
                      <span>THÀNH VIÊN (USER)</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Ban Status */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Trạng thái tài khoản</span>
                <div>
                  {selectedUser.banned ? (
                    <span className="inline-flex items-center space-x-1 text-xs font-black text-rose-400">
                      <Ban className="h-4 w-4 text-rose-500" />
                      <span>ĐÃ BỊ KHÓA (BANNED)</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-400">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span>ĐANG HOẠT ĐỘNG</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Verification Status */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Xác thực Email</span>
                <div>
                  {selectedUser.verified ? (
                    <span className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-400">
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                      <span>ĐÃ XÁC THỰC EMAIL</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 text-xs font-bold text-amber-400">
                      <XCircle className="h-4 w-4 text-amber-400" />
                      <span>CHƯA XÁC THỰC EMAIL</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Online Status */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Trạng thái Online</span>
                <div>
                  {selectedUser.isOnline ? (
                    <span className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-400">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>ONLINE REALTIME</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 text-xs font-bold text-slate-400">
                      <span className="h-2 w-2 rounded-full bg-slate-600"></span>
                      <span>OFFLINE</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Date info */}
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center space-x-1.5">
                <Calendar className="h-4 w-4 text-purple-400" />
                <span>Ngày đăng ký tài khoản:</span>
              </span>
              <span className="font-mono font-bold text-slate-200">
                {new Date(selectedUser.createdAt).toLocaleString('vi-VN')}
              </span>
            </div>

            {/* Quick Action Footer */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => handleChangeRole(selectedUser.id, selectedUser.roles)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-purple-900/80 text-slate-200 hover:text-purple-200 border border-slate-700 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Shield className="h-4 w-4" />
                <span>{selectedUser.roles?.includes('ADMIN') ? 'Hạ quyền USER' : 'Nâng quyền ADMIN'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleToggleBan(selectedUser.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition border flex items-center space-x-1.5 cursor-pointer ${
                  selectedUser.banned
                    ? 'bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border-emerald-700'
                    : 'bg-rose-950 hover:bg-rose-900 text-rose-300 border-rose-700'
                }`}
              >
                {selectedUser.banned ? (
                  <>
                    <Unlock className="h-4 w-4" />
                    <span>Mở khóa</span>
                  </>
                ) : (
                  <>
                    <Ban className="h-4 w-4" />
                    <span>Khóa</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
