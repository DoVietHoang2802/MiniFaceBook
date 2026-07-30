import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  Shield,
  ArrowLeft,
  LogOut,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../core/auth/AuthContext';
import { useToast } from '../../core/toast/ToastContext';
import { webSocketService } from '../../modules/chat/services/webSocketService';

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { triggerToast } = useToast();
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    webSocketService.connect();
    const unsubBroadcast = webSocketService.subscribe<{ title: string; content: string }>(
      '/topic/broadcast',
      (payload) => {
        if (payload?.title && payload?.content) {
          triggerToast(`📢 ${payload.title}: ${payload.content}`);
        }
      }
    );
    return () => unsubBroadcast();
  }, [triggerToast]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#090d16] text-slate-100 font-sans flex flex-col selection:bg-purple-600 selection:text-white">
      {/* TOPBAR ADMIN DASHBOARD */}
      <header className="min-h-16 border-b border-slate-800/80 bg-[#0f172a]/90 backdrop-blur-xl px-3 sm:px-6 flex items-center justify-between sticky top-0 z-50 shadow-2xl pt-[env(safe-area-inset-top)]">
        {/* Left: Brand Identity */}
        <div className="flex min-w-0 items-center space-x-2 sm:space-x-4">
          <button type="button" className="flex min-w-0 items-center space-x-2 sm:space-x-3 cursor-pointer text-left" onClick={() => navigate('/')} aria-label="Về trang chủ MiniFaceBook">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 p-0.5 shadow-lg shadow-purple-900/30 flex items-center justify-center">
              <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Shield className="h-5 w-5 text-purple-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-indigo-300 to-pink-400">
                  MINIFACE
                </span>
                <span className="hidden sm:inline-flex text-[10px] font-black tracking-widest px-2 py-0.5 rounded-full bg-purple-950/80 border border-purple-500/30 text-purple-300">
                  PORTAL
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-400 hidden sm:block">Hệ thống Quản trị & Điều hành Toàn cục</p>
            </div>
          </button>
        </div>

        {/* Right: Live Clock & User Controls */}
        <div className="flex items-center space-x-1 sm:space-x-4">
          {/* Live System Time */}
          <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
            <Clock className="h-3.5 w-3.5 text-purple-400" />
            <span className="font-mono font-bold tracking-widest text-purple-300">{time}</span>
            <span className="text-[10px] font-semibold text-slate-400">ICT</span>
          </div>

          {/* Return to Main Site Button */}
          <button
            onClick={() => navigate('/')}
            className="flex h-11 min-w-11 items-center justify-center space-x-2 px-3 rounded-xl bg-slate-800/80 hover:bg-purple-900/40 text-slate-300 hover:text-purple-300 border border-slate-700/60 hover:border-purple-500/40 text-xs font-semibold transition cursor-pointer"
            title="Quay lại giao diện người dùng MiniFaceBook"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Về trang chủ MiniFaceBook</span>
          </button>

          {/* User Profile Pill */}
          <div className="flex items-center space-x-1 sm:space-x-3 sm:pl-3 sm:border-l border-slate-800">
            <div className="hidden sm:block h-8 w-8 rounded-full border border-purple-500/30 overflow-hidden bg-slate-900 shrink-0">
              {user?.avatar ? (
                <img src={user.avatar} alt="Admin" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center font-bold text-xs text-purple-400 bg-purple-950/50">
                  {user?.name?.charAt(0) || 'A'}
                </div>
              )}
            </div>
            <div className="hidden md:block">
              <div className="text-xs font-bold text-slate-200">{user?.name || 'Administrator'}</div>
              <div className="text-[10px] text-emerald-400 font-semibold flex items-center space-x-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping inline-block"></span>
                <span>Super Admin</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition cursor-pointer sm:ml-1"
              title="Đăng xuất khỏi hệ thống"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* BODY CONTENT AREA */}
      <div className="flex-1 flex overflow-hidden">
        {/* MAIN DISPLAY AREA */}
        <main className="flex-1 overflow-y-auto bg-[#090d16] p-3 sm:p-6 md:p-8 pb-[max(0.75rem,env(safe-area-inset-bottom))] scrollbar-thin scrollbar-thumb-slate-800">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
