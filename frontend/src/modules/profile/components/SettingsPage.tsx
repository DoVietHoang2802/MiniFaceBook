import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Loader2, Save, ArrowLeft, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../../core/toast/ToastContext';
import { useAuth } from '../../../core/auth/AuthContext';
import { profileService } from '../services/profileService';
import { authService } from '../../auth/services/authService';

const SettingsPage: React.FC = () => {
  const { triggerToast } = useToast();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setFieldErrors({});

    // Client-side validations
    const errors: { [key: string]: string } = {};
    if (!oldPassword) {
      errors.oldPassword = 'Vui lòng nhập mật khẩu hiện tại';
    }
    if (!newPassword) {
      errors.newPassword = 'Vui lòng nhập mật khẩu mới';
    } else if (newPassword.length < 6) {
      errors.newPassword = 'Mật khẩu mới phải có ít nhất 6 ký tự';
    }
    if (newPassword === oldPassword) {
      errors.newPassword = 'Mật khẩu mới không được trùng với mật khẩu cũ';
    }
    if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Mật khẩu nhập lại không khớp';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);

    try {
      await profileService.changePassword({ oldPassword, newPassword });
      triggerToast('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');
      
      // Đăng xuất và điều hướng về trang đăng nhập
      await authService.logout();
      logout();
      navigate('/login');
    } catch (err: any) {
      if (!err.response) {
        setErrorMsg('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.');
      } else {
        const msg = err.response?.data?.message || 'Mật khẩu hiện tại không chính xác.';
        setErrorMsg(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 animate-fade-in-up">
      {/* Nút quay lại trang chủ */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center space-x-2 text-slate-500 hover:text-slate-800 transition-colors mb-6 cursor-pointer text-sm font-semibold"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Quay lại trang chủ</span>
      </button>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Header trang cài đặt */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800">Cài đặt tài khoản</h2>
          <p className="text-xs text-slate-400 font-medium mt-1">Quản lý và cập nhật thông tin bảo mật cho tài khoản của bạn</p>
        </div>

        {/* Form đổi mật khẩu */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex items-start space-x-3 p-4 rounded-xl bg-violet-50 border border-violet-100 text-violet-700">
            <ShieldAlert className="h-5 w-5 shrink-0 text-violet-500 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <p className="font-bold">Lưu ý bảo mật quan trọng:</p>
              <p className="text-violet-600 mt-0.5">Sau khi đổi mật khẩu thành công, hệ thống sẽ tự động đăng xuất phiên làm việc hiện tại và tất cả các thiết bị khác để bảo vệ an toàn cho tài khoản của bạn.</p>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-lg text-sm bg-red-50 border border-red-200 text-red-600 font-medium flex items-center space-x-2 animate-shake">
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Mật khẩu cũ */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Mật khẩu hiện tại</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <Lock className="h-5 w-5" />
              </span>
              <input
                id="oldPassword"
                type={showOldPassword ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Nhập mật khẩu hiện tại"
                className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-sm"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
                disabled={isLoading}
              >
                {showOldPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {fieldErrors.oldPassword && <span className="text-red-500 text-xs font-medium block">{fieldErrors.oldPassword}</span>}
          </div>

          {/* Mật khẩu mới */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Mật khẩu mới</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <Lock className="h-5 w-5" />
              </span>
              <input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-sm"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
                disabled={isLoading}
              >
                {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {fieldErrors.newPassword && <span className="text-red-500 text-xs font-medium block">{fieldErrors.newPassword}</span>}
          </div>

          {/* Nhập lại mật khẩu mới */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Xác nhận mật khẩu mới</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <Lock className="h-5 w-5" />
              </span>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-sm"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
                disabled={isLoading}
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {fieldErrors.confirmPassword && <span className="text-red-500 text-xs font-medium block">{fieldErrors.confirmPassword}</span>}
          </div>

          {/* Nút hành động */}
          <div className="flex justify-end pt-4 border-t border-slate-100 space-x-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
              disabled={isLoading}
            >
              Hủy bỏ
            </button>
            
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 hover:shadow-lg hover:shadow-violet-500/20 text-white font-bold flex items-center justify-center space-x-2 transition-all active:scale-[0.98] cursor-pointer text-xs"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4" />
                  <span>Đang cập nhật...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Đổi mật khẩu</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;
