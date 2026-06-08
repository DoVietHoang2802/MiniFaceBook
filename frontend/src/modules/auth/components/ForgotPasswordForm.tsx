import React, { useState, useRef, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, ArrowLeft, AlertCircle, CheckCircle, ShieldCheck } from 'lucide-react';
import { authService } from '../services/authService';
import { forgotPasswordSchema, verifyOtpSchema, resetPasswordSchema } from '../schemas/authSchema';

interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
  triggerToast: (msg: string) => void;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onBackToLogin, triggerToast }) => {
  const [step, setStep] = useState<'EMAIL' | 'OTP' | 'PASSWORD'>('EMAIL');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(''));
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Redis token nhận được sau khi verify OTP đúng
  const [resetToken, setResetToken] = useState('');
  
  // Bộ đếm thời gian gửi lại OTP
  const [resendTimer, setResendTimer] = useState(0);
  
  // Refs cho 6 ô nhập OTP
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Tự động focus ô đầu tiên khi vào bước OTP
  useEffect(() => {
    if (step === 'OTP') {
      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 150);
    }
  }, [step]);

  // Xử lý gửi OTP qua Email (Bước 1)
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setFormError(null);

    const validation = forgotPasswordSchema.safeParse({ email });
    if (!validation.success) {
      setErrors({ email: validation.error.issues[0].message });
      return;
    }

    setIsLoading(true);
    try {
      await authService.forgotPassword(email);
      triggerToast('Mã OTP đã được gửi vào hòm thư của bạn!');
      setStep('OTP');
      setResendTimer(60);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.';
      setFormError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Gửi lại mã OTP
  const handleResendOtp = async () => {
    if (resendTimer > 0 || isLoading) return;
    
    setFormError(null);
    setIsLoading(true);
    try {
      await authService.forgotPassword(email);
      triggerToast('Mã OTP mới đã được gửi lại vào email!');
      setResendTimer(60);
      setOtp(new Array(6).fill(''));
      otpRefs.current[0]?.focus();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Không thể gửi lại mã OTP. Vui lòng thử lại sau.';
      setFormError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý thay đổi ký tự trong ô OTP
  const handleOtpChange = (index: number, value: string) => {
    // Chỉ chấp nhận số
    if (value !== '' && !/^[0-9]$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Nếu gõ số -> nhảy sang ô tiếp theo
    if (value !== '' && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  // Xử lý phím xoá Backspace nhảy ngược lại ô trước
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (otp[index] === '' && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        otpRefs.current[index - 1]?.focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  // Xử lý dán mã OTP từ Clipboard (Paste Event)
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (!/^\d{6}$/.test(pasteData)) {
      triggerToast('Mã OTP dán vào phải có đúng 6 chữ số');
      return;
    }

    const digits = pasteData.split('');
    setOtp(digits);
    otpRefs.current[5]?.focus();
  };

  // Gửi mã xác nhận OTP lên server (Bước 2)
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setFormError(null);

    const otpString = otp.join('');
    const validation = verifyOtpSchema.safeParse({ otp: otpString });
    if (!validation.success) {
      setFormError('Vui lòng nhập đủ mã xác nhận gồm 6 chữ số');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.verifyForgotPasswordOtp(email, otpString);
      // Backend trả về resetToken tạm thời làm dữ liệu xác thực cho bước đổi mật khẩu
      setResetToken(response.data);
      triggerToast('Xác thực mã OTP thành công!');
      setStep('PASSWORD');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Mã OTP không chính xác hoặc đã hết hạn.';
      setFormError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý Đặt lại mật khẩu mới (Bước 3)
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setFormError(null);

    const validation = resetPasswordSchema.safeParse({ newPassword, confirmPassword });
    if (!validation.success) {
      const fieldErrors: { [key: string]: string } = {};
      validation.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword(resetToken, newPassword);
      triggerToast('Đặt lại mật khẩu thành công! Hãy đăng nhập lại.');
      setTimeout(() => {
        onBackToLogin();
      }, 2000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Token đổi mật khẩu hết hiệu lực. Vui lòng thử lại từ đầu.';
      setFormError(errorMsg);
      if (err.response?.data?.code === 1023) {
        // Nếu token hết hạn hoặc sai, quay về nhập email
        setTimeout(() => {
          setStep('EMAIL');
          setResetToken('');
          setOtp(new Array(6).fill(''));
        }, 1500);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Kiểm tra độ mạnh mật khẩu realtime để hiện checkmark
  const hasMinLength = newPassword.length >= 8;
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);

  return (
    <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl border border-slate-800/80 bg-[hsl(var(--card))]/70 shadow-[0_0_50px_-12px_rgba(59,130,246,0.15)] backdrop-blur-xl animate-fade-in-up hover:border-slate-700/60 transition-all duration-300">
      
      {/* Nút quay lại */}
      {step !== 'PASSWORD' && (
        <button
          onClick={() => {
            if (step === 'OTP') {
              setStep('EMAIL');
              setOtp(new Array(6).fill(''));
              setFormError(null);
            } else {
              onBackToLogin();
            }
          }}
          className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại</span>
        </button>
      )}

      {/* Tiêu đề chính động */}
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2 font-outfit">
          {step === 'EMAIL' && 'Quên mật khẩu?'}
          {step === 'OTP' && 'Xác thực Email'}
          {step === 'PASSWORD' && 'Mật khẩu mới'}
        </h2>
        <p className="text-[hsl(var(--muted))] text-sm">
          {step === 'EMAIL' && 'Nhập email của bạn để nhận mã xác minh OTP 6 số'}
          {step === 'OTP' && `Chúng tôi đã gửi mã xác thực tới ${email}`}
          {step === 'PASSWORD' && 'Thiết lập mật khẩu cực kỳ bảo mật cho tài khoản của bạn'}
        </p>
      </div>

      {formError && (
        <div className="p-3.5 mb-5 rounded-lg text-sm bg-red-500/10 border border-red-500/20 text-red-400 flex items-center space-x-2 animate-shake">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* BƯỚC 1: NHẬP EMAIL */}
      {step === 'EMAIL' && (
        <form onSubmit={handleRequestOtp} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted))]">
              Địa chỉ Email tài khoản
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

          <button
            type="submit"
            className="w-full py-2.5 sm:py-3 px-4 rounded-lg bg-[hsl(var(--primary))] text-white font-bold flex items-center justify-center space-x-2 hover-lift cursor-pointer text-sm sm:text-base mt-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin h-5 w-5" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <span>Gửi mã xác minh</span>
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </form>
      )}

      {/* BƯỚC 2: NHẬP OTP 6 SỐ */}
      {step === 'OTP' && (
        <form onSubmit={handleVerifyOtp} className="space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted))] text-center block">
              Mã bảo mật gồm 6 số
            </label>
            
            {/* Bộ 6 ô vuông nhập OTP */}
            <div className="flex justify-between gap-2.5 max-w-xs mx-auto">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  ref={(el) => { otpRefs.current[index] = el; }}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  onPaste={handleOtpPaste}
                  className="w-11 h-12 text-center text-xl font-bold bg-slate-950/60 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all select-all"
                  disabled={isLoading}
                />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <button
              type="submit"
              className="w-full py-2.5 sm:py-3 px-4 rounded-lg bg-[hsl(var(--primary))] text-white font-bold flex items-center justify-center space-x-2 hover-lift cursor-pointer text-sm sm:text-base"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5" />
                  <span>Đang xác nhận...</span>
                </>
              ) : (
                <>
                  <span>Xác nhận mã</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>

            {/* Gửi lại mã */}
            <div className="text-center text-xs">
              {resendTimer > 0 ? (
                <span className="text-slate-500">
                  Gửi lại mã mới sau <strong className="text-slate-300 font-bold">{resendTimer}s</strong>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="font-bold text-[hsl(var(--primary))] hover:underline cursor-pointer focus:outline-none"
                  disabled={isLoading}
                >
                  Gửi lại mã OTP qua email
                </button>
              )}
            </div>
          </div>
        </form>
      )}

      {/* BƯỚC 3: NHẬP MẬT KHẨU MỚI */}
      {step === 'PASSWORD' && (
        <form onSubmit={handleResetPassword} className="space-y-5">
          
          {/* Mật khẩu mới */}
          <div className="space-y-1.5">
            <label className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted))]">
              Mật khẩu mới
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
                <Lock className="h-5 w-5" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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
            {errors.newPassword && <span className="text-red-400 text-xs font-medium block">{errors.newPassword}</span>}
          </div>

          {/* Xác nhận mật khẩu mới */}
          <div className="space-y-1.5">
            <label className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted))]">
              Xác nhận mật khẩu mới
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-lg border border-slate-800/80 bg-slate-950/50 text-white placeholder-slate-600 glass-focus-glow text-sm sm:text-base"
                disabled={isLoading}
              />
            </div>
            {errors.confirmPassword && <span className="text-red-400 text-xs font-medium block">{errors.confirmPassword}</span>}
          </div>

          {/* Gợi ý tiêu chuẩn mật khẩu */}
          <div className="p-3 bg-slate-950/40 border border-slate-800/50 rounded-lg text-xs space-y-2 text-slate-400">
            <h4 className="font-semibold text-slate-300">Tiêu chuẩn mật khẩu an toàn:</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center space-x-1.5">
                <CheckCircle className={`h-4 w-4 shrink-0 ${hasMinLength ? 'text-emerald-500' : 'text-slate-600'}`} />
                <span className={hasMinLength ? 'text-slate-300' : ''}>Tối thiểu 8 ký tự</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle className={`h-4 w-4 shrink-0 ${hasLowercase ? 'text-emerald-500' : 'text-slate-600'}`} />
                <span className={hasLowercase ? 'text-slate-300' : ''}>Chữ thường (a-z)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle className={`h-4 w-4 shrink-0 ${hasUppercase ? 'text-emerald-500' : 'text-slate-600'}`} />
                <span className={hasUppercase ? 'text-slate-300' : ''}>Chữ in hoa (A-Z)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle className={`h-4 w-4 shrink-0 ${hasNumber ? 'text-emerald-500' : 'text-slate-600'}`} />
                <span className={hasNumber ? 'text-slate-300' : ''}>Chữ số (0-9)</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 sm:py-3 px-4 rounded-lg bg-[hsl(var(--primary))] text-white font-bold flex items-center justify-center space-x-2 hover-lift cursor-pointer text-sm sm:text-base mt-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin h-5 w-5" />
                <span>Đang thiết lập...</span>
              </>
            ) : (
              <>
                <span>Xác nhận đổi mật khẩu</span>
                <CheckCircle className="h-5 w-5" />
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};

export default ForgotPasswordForm;
