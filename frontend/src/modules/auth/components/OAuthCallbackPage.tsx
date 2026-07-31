import React, { useEffect, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../core/auth/AuthContext';
import { authService } from '../services/authService';

const OAuthCallbackPage: React.FC = () => {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    const completeSignIn = async () => {
      try {
        const response = await authService.getMe();
        if (!isCurrent) return;

        setUser(response.data);
        navigate('/', { replace: true });
      } catch {
        if (isCurrent) setHasError(true);
      }
    };

    void completeSignIn();
    return () => {
      isCurrent = false;
    };
  }, [navigate, setUser]);

  return (
    <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl border border-slate-200 bg-white shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)] animate-fade-in-up text-center">
      {hasError ? (
        <div className="space-y-5">
          <AlertCircle className="h-10 w-10 mx-auto text-red-500" aria-hidden="true" />
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 font-outfit">Không thể hoàn tất đăng nhập</h2>
            <p className="mt-2 text-sm text-slate-500">Vui lòng thử đăng nhập bằng Google lại.</p>
          </div>
          <Link
            to="/login"
            className="inline-flex items-center justify-center w-full py-2.5 px-4 rounded-lg bg-violet-600 hover:bg-violet-700 text-sm font-bold text-white transition-all"
          >
            Quay lại đăng nhập
          </Link>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-9 w-9 text-violet-600 animate-spin" aria-hidden="true" />
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 font-outfit">Đang đăng nhập</h2>
            <p className="mt-2 text-sm text-slate-500">Đang xác nhận phiên Google của bạn...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OAuthCallbackPage;
