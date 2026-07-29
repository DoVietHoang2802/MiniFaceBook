import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../core/auth/AuthContext';
import { ShieldAlert, Loader2 } from 'lucide-react';

export const AdminRoute: React.FC = () => {
  const { user, isCheckingAuth } = useAuth();

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 text-violet-500 animate-spin mb-2" />
        <span className="text-sm font-medium text-slate-400">Đang xác thực quyền Admin...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isAdmin = user.roles?.includes('ADMIN') || (user as any).roles?.includes('ADMIN');

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md text-center shadow-2xl">
          <ShieldAlert className="w-16 h-16 text-rose-500 mx-auto mb-4 animate-bounce" />
          <h2 className="text-xl font-bold text-slate-100 mb-2">Truy cập bị Từ chối!</h2>
          <p className="text-sm text-slate-400 mb-6">
            Bạn không có quyền truy cập Trang Quản trị Admin. Trang này chỉ dành riêng cho Quản trị viên hệ thống.
          </p>
          <a
            href="/"
            className="inline-flex items-center px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-sm transition-all shadow-lg shadow-violet-600/30"
          >
            Về Trang chủ
          </a>
        </div>
      </div>
    );
  }

  return <Outlet />;
};
