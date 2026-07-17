import React, { useState } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Save,
  ArrowLeft,
  ShieldAlert,
  Shield,
  Moon,
  Sun,
  Mail,
  FileText,
  ChevronRight,
  Palette,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../../core/toast/ToastContext';
import { useAuth } from '../../../core/auth/AuthContext';
import { useTheme } from '../../../core/theme/ThemeContext';
import { profileService } from '../services/profileService';
import { authService } from '../../auth/services/authService';

type SettingsSection = 'security' | 'appearance' | 'contact';

const CONTACT_EMAIL = 'doviethoang281202@gmail.com';

const SettingsPage: React.FC = () => {
  const { triggerToast } = useToast();
  const { logout } = useAuth();
  const { theme, setTheme, isDark } = useTheme();
  const navigate = useNavigate();

  const [section, setSection] = useState<SettingsSection>('security');

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

  const menuItems: {
    key: SettingsSection;
    label: string;
    desc: string;
    icon: typeof Shield;
  }[] = [
    {
      key: 'security',
      label: 'Đổi mật khẩu',
      desc: 'Cập nhật mật khẩu đăng nhập',
      icon: Lock,
    },
    {
      key: 'appearance',
      label: 'Giao diện',
      desc: 'Chế độ sáng / tối',
      icon: Palette,
    },
    {
      key: 'contact',
      label: 'Liên hệ',
      desc: 'Điều khoản & hỗ trợ',
      icon: Mail,
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 animate-fade-in-up">
      <button
        onClick={() => navigate('/')}
        className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors mb-5 cursor-pointer text-sm font-semibold"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Quay lại trang chủ</span>
      </button>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/80">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Cài đặt</h2>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Quản lý bảo mật, giao diện và thông tin liên hệ
          </p>
        </div>

        <div className="flex flex-col md:flex-row min-h-[420px]">
          {/* Left menu — Facebook style */}
          <nav className="md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 p-3 space-y-1 bg-slate-50/40 dark:bg-slate-950/40">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = section === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setSection(item.key)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition cursor-pointer group ${
                    active
                      ? 'bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div
                    className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
                      active
                        ? 'bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="text-sm font-bold truncate">{item.label}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                      {item.desc}
                    </p>
                  </div>
                  <ChevronRight
                    className={`h-4 w-4 shrink-0 ${
                      active ? 'text-violet-400' : 'text-slate-300 dark:text-slate-600'
                    }`}
                  />
                </button>
              );
            })}
          </nav>

          {/* Right content */}
          <div className="flex-grow p-5 sm:p-6">
            {section === 'security' && (
              <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
                <div>
                  <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                    Đổi mật khẩu
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Cập nhật mật khẩu để bảo vệ tài khoản của bạn
                  </p>
                </div>

                <div className="flex items-start space-x-3 p-4 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/40 text-violet-700 dark:text-violet-300">
                  <ShieldAlert className="h-5 w-5 shrink-0 text-violet-500 mt-0.5" />
                  <div className="text-xs leading-relaxed">
                    <p className="font-bold">Lưu ý bảo mật:</p>
                    <p className="text-violet-600 dark:text-violet-400 mt-0.5">
                      Sau khi đổi mật khẩu thành công, hệ thống sẽ tự động đăng xuất phiên hiện tại
                      để bảo vệ tài khoản.
                    </p>
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-3.5 rounded-lg text-sm bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 font-medium animate-shake">
                    {errorMsg}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Mật khẩu hiện tại
                  </label>
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
                      className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-sm"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                      disabled={isLoading}
                    >
                      {showOldPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {fieldErrors.oldPassword && (
                    <span className="text-red-500 text-xs font-medium block">
                      {fieldErrors.oldPassword}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Mật khẩu mới
                  </label>
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
                      className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-sm"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                      disabled={isLoading}
                    >
                      {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {fieldErrors.newPassword && (
                    <span className="text-red-500 text-xs font-medium block">
                      {fieldErrors.newPassword}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Xác nhận mật khẩu mới
                  </label>
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
                      className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-sm"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && (
                    <span className="text-red-500 text-xs font-medium block">
                      {fieldErrors.confirmPassword}
                    </span>
                  )}
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800 space-x-3">
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-500 dark:text-slate-300 transition-all cursor-pointer"
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
            )}

            {section === 'appearance' && (
              <div className="space-y-6 max-w-lg">
                <div>
                  <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                    Giao diện
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Chọn chế độ sáng hoặc tối cho MiniFaceBook
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setTheme('light');
                      triggerToast('Đã bật chế độ sáng');
                    }}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition cursor-pointer ${
                      !isDark
                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-950'
                    }`}
                  >
                    <div className="h-10 w-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                      <Sun className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Sáng</p>
                      <p className="text-[11px] text-slate-400">Nền sáng, chữ tối</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTheme('dark');
                      triggerToast('Đã bật chế độ tối');
                    }}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition cursor-pointer ${
                      isDark
                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-950'
                    }`}
                  >
                    <div className="h-10 w-10 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-500 flex items-center justify-center shrink-0">
                      <Moon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Tối</p>
                      <p className="text-[11px] text-slate-400">Nền tối, dịu mắt</p>
                    </div>
                  </button>
                </div>

                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Chế độ hiện tại:{' '}
                  <span className="font-bold text-slate-600 dark:text-slate-300">
                    {theme === 'dark' ? 'Tối' : 'Sáng'}
                  </span>
                  . Tùy chọn được lưu trên trình duyệt này.
                </p>
              </div>
            )}

            {section === 'contact' && (
              <div className="space-y-6 max-w-2xl">
                <div>
                  <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                    Liên hệ & Điều khoản
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Thông tin hỗ trợ và điều khoản sử dụng mẫu
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-950/50 p-4 flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300 flex items-center justify-center shrink-0">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      Email hỗ trợ
                    </p>
                    <a
                      href={`mailto:${CONTACT_EMAIL}`}
                      className="text-sm font-semibold text-violet-600 dark:text-violet-400 hover:underline break-all"
                    >
                      {CONTACT_EMAIL}
                    </a>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Liên hệ khi cần hỗ trợ tài khoản, báo lỗi hoặc góp ý sản phẩm.
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-5 space-y-4">
                  <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
                    <FileText className="h-4 w-4 text-violet-500" />
                    <h4 className="text-sm font-black">Điều khoản sử dụng (mẫu)</h4>
                  </div>

                  <div className="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    <p>
                      <span className="font-bold text-slate-800 dark:text-slate-100">1. Phạm vi.</span>{' '}
                      MiniFaceBook là nền tảng mạng xã hội demo/portfolio. Bằng việc sử dụng dịch vụ,
                      bạn đồng ý với các điều khoản dưới đây.
                    </p>
                    <p>
                      <span className="font-bold text-slate-800 dark:text-slate-100">
                        2. Tài khoản.
                      </span>{' '}
                      Bạn chịu trách nhiệm bảo mật mật khẩu và mọi hoạt động diễn ra dưới tài khoản
                      của mình. Không chia sẻ thông tin đăng nhập cho người khác.
                    </p>
                    <p>
                      <span className="font-bold text-slate-800 dark:text-slate-100">
                        3. Nội dung.
                      </span>{' '}
                      Bạn không được đăng nội dung bất hợp pháp, thù địch, spam, hoặc vi phạm quyền
                      của người khác. Chúng tôi có quyền gỡ nội dung vi phạm khi cần.
                    </p>
                    <p>
                      <span className="font-bold text-slate-800 dark:text-slate-100">
                        4. Quyền riêng tư.
                      </span>{' '}
                      Dữ liệu được dùng để vận hành tính năng (đăng nhập, feed, chat, bạn bè). Không
                      bán dữ liệu cá nhân cho bên thứ ba vì mục đích thương mại.
                    </p>
                    <p>
                      <span className="font-bold text-slate-800 dark:text-slate-100">
                        5. Giới hạn trách nhiệm.
                      </span>{' '}
                      Dịch vụ được cung cấp “nguyên trạng” cho mục đích học tập/demo. Chúng tôi không
                      cam kết uptime tuyệt đối hay bồi thường thiệt hại gián tiếp.
                    </p>
                    <p>
                      <span className="font-bold text-slate-800 dark:text-slate-100">6. Liên hệ.</span>{' '}
                      Mọi thắc mắc về điều khoản hoặc hỗ trợ kỹ thuật, vui lòng gửi email tới{' '}
                      <a
                        href={`mailto:${CONTACT_EMAIL}`}
                        className="font-semibold text-violet-600 dark:text-violet-400 hover:underline"
                      >
                        {CONTACT_EMAIL}
                      </a>
                      .
                    </p>
                  </div>

                  <p className="text-[10px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                    Văn bản điều khoản mẫu — có thể cập nhật khi dự án chuyển sang production.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
