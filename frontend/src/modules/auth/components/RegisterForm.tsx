import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import { registerSchema } from '../schemas/authSchema';
import { authService } from '../services/authService';

interface RegisterFormProps {
  onToggleForm: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onToggleForm }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Trạng thái cho Password Strength Meter
  const [passwordStrength, setPasswordStrength] = useState(0); // 0 -> 4
  const [strengthLabel, setStrengthLabel] = useState('Yếu');
  const [strengthColor, setStrengthColor] = useState('bg-red-500');

  // Lắng nghe thay đổi mật khẩu để tính toán độ mạnh thời gian thực
  useEffect(() => {
    let score = 0;
    if (!password) {
      setPasswordStrength(0);
      setStrengthLabel('Rỗng');
      setStrengthColor('bg-slate-700');
      return;
    }

    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;

    setPasswordStrength(score);

    switch (score) {
      case 1:
        setStrengthLabel('Rất yếu');
        setStrengthColor('bg-red-500 w-1/4');
        break;
      case 2:
        setStrengthLabel('Yếu');
        setStrengthColor('bg-orange-500 w-2/4');
        break;
      case 3:
        setStrengthLabel('Trung bình');
        setStrengthColor('bg-yellow-500 w-3/4');
        break;
      case 4:
        setStrengthLabel('Mạnh (Đạt chuẩn)');
        setStrengthColor('bg-green-500 w-full');
        break;
      default:
        setStrengthLabel('Rất yếu');
        setStrengthColor('bg-red-500 w-1/4');
    }
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setAuthError(null);

    // Validate dữ liệu đầu vào bằng Zod (Luật validate nghiêm ngặt)
    const result = registerSchema.safeParse({
      name,
      email,
      password,
      confirmPassword,
    });

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
      await authService.register({ name, email, password });
      alert('Đăng ký thành công! Hãy kiểm tra hòm thư Mailpit (http://localhost:8025) để kích hoạt tài khoản.');
      onToggleForm(); // Quay lại trang đăng nhập
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Đăng ký thất bại. Email có thể đã được sử dụng.';
      setAuthError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl border border-slate-800/80 bg-[hsl(var(--card))]/70 shadow-[0_0_50px_-12px_rgba(59,130,246,0.15)] backdrop-blur-xl animate-fade-in-up hover:border-slate-700/60 transition-all duration-300">
      {/* Tiêu đề chính */}
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2 font-outfit">Tạo tài khoản mới</h2>
        <p className="text-[hsl(var(--muted))] text-sm">Trở thành thành viên của gia đình MiniFaceBook</p>
      </div>

      {authError && (
        <div className="p-3.5 mb-5 rounded-lg text-sm bg-red-500/10 border border-red-500/20 text-red-400 flex items-center space-x-2 animate-shake">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{authError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4.5">
        {/* Name Input */}
        <div className="space-y-1.5">
          <label className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted))]">
            Họ và tên
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
              <User className="h-5 w-5" />
            </span>
            <input
              type="text"
              placeholder="Nguyễn Văn A"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-lg border border-slate-800/80 bg-slate-950/50 text-white placeholder-slate-600 glass-focus-glow text-sm sm:text-base"
              disabled={isLoading}
            />
          </div>
          {errors.name && <span className="text-red-400 text-xs font-medium block">{errors.name}</span>}
        </div>

        {/* Email Input */}
        <div className="space-y-1.5">
          <label className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted))]">
            Địa chỉ Email
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
              <Mail className="h-5 w-5" />
            </span>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-lg border border-slate-800/80 bg-slate-950/50 text-white placeholder-slate-600 glass-focus-glow text-sm sm:text-base"
              disabled={isLoading}
            />
          </div>
          {errors.email && <span className="text-red-400 text-xs font-medium block">{errors.email}</span>}
        </div>

        {/* Mật khẩu Input */}
        <div className="space-y-1.5">
          <label className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted))]">
            Mật khẩu
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
              <Lock className="h-5 w-5" />
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 sm:py-3 rounded-lg border border-slate-800/80 bg-slate-950/50 text-white placeholder-slate-600 glass-focus-glow text-sm sm:text-base"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-white"
              disabled={isLoading}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.password && <span className="text-red-400 text-xs font-medium block">{errors.password}</span>}

          {/* Password Strength Meter (Thanh đo độ mạnh mật khẩu mượt mà) */}
          {password && (
            <div className="space-y-1 mt-2.5 animate-fade-in">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                <span className="text-[hsl(var(--muted))]">Độ mạnh mật khẩu:</span>
                <span
                  className={
                    passwordStrength >= 4
                      ? 'text-green-400'
                      : passwordStrength >= 3
                      ? 'text-yellow-400'
                      : 'text-red-400'
                  }
                >
                  {strengthLabel}
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ease-out ${strengthColor}`}></div>
              </div>
            </div>
          )}
        </div>

        {/* Xác nhận mật khẩu Input */}
        <div className="space-y-1.5">
          <label className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted))]">
            Xác nhận Mật khẩu
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
              <Lock className="h-5 w-5" />
            </span>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 sm:py-3 rounded-lg border border-slate-800/80 bg-slate-950/50 text-white placeholder-slate-600 glass-focus-glow text-sm sm:text-base"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-white"
              disabled={isLoading}
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <span className="text-red-400 text-xs font-medium block">{errors.confirmPassword}</span>
          )}
        </div>

        {/* Nút bấm Đăng ký */}
        <button
          type="submit"
          className="w-full py-2.5 sm:py-3 px-4 rounded-lg bg-[hsl(var(--primary))] text-white font-bold flex items-center justify-center space-x-2 hover-lift cursor-pointer text-sm sm:text-base mt-3"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin h-5 w-5" />
              <span>Đang tạo tài khoản...</span>
            </>
          ) : (
            <>
              <span>Đăng ký ngay</span>
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>
      </form>

      {/* Liên kết sang Form đăng nhập */}
      <div className="mt-6 sm:mt-8 text-center text-sm text-[hsl(var(--muted))]">
        Đã có tài khoản?{' '}
        <button
          onClick={onToggleForm}
          className="font-bold text-[hsl(var(--primary))] hover:underline cursor-pointer"
          disabled={isLoading}
        >
          Đăng nhập ngay
        </button>
      </div>
    </div>
  );
};

export default RegisterForm;
