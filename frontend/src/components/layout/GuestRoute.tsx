import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../core/auth/AuthContext';
import { Flame, Loader2 } from 'lucide-react';

export const GuestRoute: React.FC = () => {
  const { user, isCheckingAuth } = useAuth();

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

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default GuestRoute;
