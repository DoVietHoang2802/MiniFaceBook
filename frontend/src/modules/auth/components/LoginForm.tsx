import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import { loginSchema } from '../schemas/authSchema';
import { authService } from '../services/authService';
import { useAuth } from '../../../core/auth/AuthContext';
import { useToast } from '../../../core/toast/ToastContext';
import { useNavigate, Link } from 'react-router-dom';

const LoginForm: React.FC = () => {
  const { setUser } = useAuth();
  const { triggerToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setAuthError(null);

    // Validate dữ liệu đầu vào bằng Zod Schema (Luật validate sạch 100%)
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: { [key: string]: string } = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.login({ email, password });
      // Response structure: { status, message, data: UserResponse }
      const loggedInUser = response.data;
      setUser(loggedInUser);
      triggerToast('Đăng nhập thành công!');
      navigate('/');
    } catch (err: any) {
      // Phân biệt Network Error vs API Error (chuẩn Facebook/Discord)
      if (!err.response) {
        // Network error: server tắt, mất mạng, timeout
        setAuthError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.');
      } else {
        // API error: server trả response lỗi (401, 400...)
        const errorMsg = err.response?.data?.message || 'Email hoặc mật khẩu không chính xác hoặc tài khoản chưa xác minh.';
        setAuthError(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl border border-slate-200 bg-white shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)] animate-fade-in-up hover:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.12)] transition-all duration-300">
      {/* Tiêu đề chính */}
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2 font-outfit">Chào mừng trở lại</h2>
        <p className="text-slate-500 text-sm">Kết nối và trò chuyện cùng bạn bè trên MiniFaceBook</p>
      </div>

      {authError && (
        <div className="p-3.5 mb-5 rounded-lg text-sm bg-red-50 border border-red-200 text-red-600 flex items-center space-x-2 animate-shake">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{authError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        {/* Email Input */}
        <div className="space-y-1.5">
          <label htmlFor="login-email" className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500">
            Địa chỉ Email
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
              <Mail className="h-5 w-5" />
            </span>
            <input
              id="login-email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-lg border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-sm sm:text-base"
              disabled={isLoading}
            />
          </div>
          {errors.email && <span className="text-red-500 text-xs font-medium block">{errors.email}</span>}
        </div>

        {/* Mật khẩu Input */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label htmlFor="login-password" className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500">
              Mật khẩu
            </label>
            <Link
              to="/forgot-password"
              className="text-[10px] sm:text-xs font-semibold text-violet-600 hover:text-violet-700 hover:underline"
            >
              Quên mật khẩu?
            </Link>
          </div>

          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
              <Lock className="h-5 w-5" />
            </span>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 sm:py-3 rounded-lg border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-sm sm:text-base"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
              disabled={isLoading}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.password && <span className="text-red-500 text-xs font-medium block">{errors.password}</span>}
        </div>

        {/* Nút bấm Đăng nhập */}
        <button
          type="submit"
          className="w-full py-2.5 sm:py-3 px-4 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-bold flex items-center justify-center space-x-2 transition-all hover:shadow-lg hover:shadow-violet-500/25 active:scale-[0.98] cursor-pointer text-sm sm:text-base mt-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin h-5 w-5" />
              <span>Đang xác thực...</span>
            </>
          ) : (
            <>
              <span>Đăng nhập</span>
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>
      </form>

      {/* Đăng nhập bằng Google */}
      <div className="mt-5 sm:mt-6">
        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-slate-200 w-full"></div>
          <span className="absolute bg-white px-3 text-[10px] sm:text-xs uppercase tracking-wider text-slate-400">
            Hoặc tiếp tục với
          </span>
        </div>

        <button
          type="button"
          onClick={() => alert('Đăng nhập với Google (Mockup Flow)')}
          className="w-full py-2.5 sm:py-3 px-4 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold flex items-center justify-center space-x-2.5 transition-all duration-200 cursor-pointer bg-white shadow-sm text-sm sm:text-base"
          disabled={isLoading}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" width="24" height="24">
            <g transform="matrix(1, 0, 0, 1, 0, 0)">
              <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.56h3.29c1.92,-1.78 3.03,-4.39 3.03,-7.4C21.65,11.75 21.54,11.4 21.35,11.1z" fill="#4285F4" />
              <path d="M12,20.65c2.61,0 4.79,-0.87 6.39,-2.36l-3.29,-2.56c-0.91,0.61 -2.08,0.98 -3.1,0.98 -2.39,0 -4.41,-1.61 -5.14,-3.78H3.45v2.64c1.6,3.17 4.88,5.33 8.55,5.33z" fill="#34A853" />
              <path d="M6.86,12.93c-0.19,-0.57 -0.29,-1.18 -0.29,-1.81c0,-0.63 0.1,-1.24 0.29,-1.81V6.67H3.45C2.81,7.94 2.45,9.39 2.45,10.93c0,1.54 0.36,2.99 1,4.26l3.41,-2.26z" fill="#FBBC05" />
              <path d="M12,3.31c1.42,0 2.69,0.49 3.7,1.45l2.77,-2.77C16.79,0.78 14.61,0 12,0 8.33,0 5.05,2.16 3.45,5.33l3.41,2.64c0.73,-2.17 2.75,-3.78 5.14,-3.78z" fill="#EA4335" />
            </g>
          </svg>
          <span>Google</span>
        </button>
      </div>

      {/* Liên kết sang Form đăng ký */}
      <div className="mt-6 sm:mt-8 text-center text-sm text-slate-500">
        Chưa có tài khoản?{' '}
        <Link
          to="/register"
          className="font-bold text-violet-600 hover:text-violet-700 hover:underline cursor-pointer"
        >
          Đăng ký miễn phí
        </Link>
      </div>
    </div>
  );
};

export default LoginForm;
