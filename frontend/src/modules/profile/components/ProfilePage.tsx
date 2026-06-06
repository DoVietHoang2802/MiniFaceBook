import React, { useState, useRef, useEffect } from 'react';
import { z } from 'zod';
import { 
  Camera, 
  BookOpen, 
  LogOut, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  User as UserIcon, 
  Mail, 
  Calendar, 
  UploadCloud 
} from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { profileService } from '../services/profileService';
import type { UserProfileResponse } from '../services/profileService';
import { authService } from '../../auth/services/authService';

// Định nghĩa Zod Schema cho Client-side Validation (Bảo mật Zero-Trust)
const MAX_FILE_SIZE = 20 * 1024 * 1024; // Mở rộng lên 20MB để thuật toán nén tự xử lý
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif'];

const avatarFileSchema = z.instanceof(File)
  .refine((file) => file.size <= MAX_FILE_SIZE, 'Dung lượng ảnh tối đa là 20MB')
  .refine(
    (file) => ALLOWED_MIME_TYPES.includes(file.type.toLowerCase()), 
    'Chỉ hỗ trợ định dạng JPG, JPEG, PNG, WEBP và GIF'
  );

const bioSchema = z.string()
  .max(255, 'Tiểu sử không được vượt quá 255 ký tự');

interface ProfilePageProps {
  initialUser: UserProfileResponse;
  onLogout: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ initialUser, onLogout }) => {
  const [user, setUser] = useState<UserProfileResponse>(initialUser);
  const [bio, setBio] = useState(initialUser.bio || '');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isSavingBio, setIsSavingBio] = useState(false);
  
  // Trạng thái tệp tin và upload
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  // Phản hồi người dùng
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state khi initialUser thay đổi (fix lỗi logout → login lại)
  useEffect(() => {
    setUser(initialUser);
    setBio(initialUser.bio || '');
  }, [initialUser]);

  // Tự động tắt thông báo sau 4 giây
  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
        setErrorMessage(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  // Xử lý Validate và Tải ảnh lên
  const handleFile = async (file: File) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validate tệp tin cục bộ trước khi truyền tải
    const validationResult = avatarFileSchema.safeParse(file);
    if (!validationResult.success) {
      setErrorMessage(validationResult.error.issues[0].message);
      return;
    }

    setIsUploadingAvatar(true);

    try {
      if (file.type === 'image/gif') {
        // Up thẳng ảnh GIF không nén để giữ animation
        console.log(`[Compression Test - Avatar] Bỏ qua nén ảnh GIF: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
        const response = await profileService.uploadAvatar(file);
        setUser(response.data);
        setSuccessMessage('Cập nhật ảnh đại diện thành công!');
        return;
      }

      // Bắt đầu quá trình nén ảnh ở Client
      const options = {
        maxSizeMB: 1, // Ép nén về dưới 1MB
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: 'image/webp' as const, // Ép nén sang WebP
      };
      const compressedBlob = await imageCompression(file, options);
      
      // Console log để Test tỷ lệ nén (F12)
      console.log(`[Compression Test - Avatar] Ảnh gốc: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`[Compression Test - Avatar] Ảnh WebP sau nén: ${(compressedBlob.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`[Compression Test - Avatar] Tiết kiệm băng thông: ${Math.round((1 - compressedBlob.size / file.size) * 100)}%`);

      // Đổi đuôi file sang .webp
      const newFileName = file.name.replace(/\.[^/.]+$/, ".webp");
      const compressedFile = new File([compressedBlob], newFileName, {
        type: 'image/webp',
        lastModified: Date.now(),
      });

      const response = await profileService.uploadAvatar(compressedFile);
      setUser(response.data);
      setSuccessMessage('Cập nhật ảnh đại diện thành công!');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Tải ảnh lên thất bại. Vui lòng thử lại.';
      setErrorMessage(errorMsg);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // Kéo và thả tệp tin (Drag & Drop)
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Lưu thông tin tiểu sử (Bio)
  const handleSaveBio = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const validationResult = bioSchema.safeParse(bio);
    if (!validationResult.success) {
      setErrorMessage(validationResult.error.issues[0].message);
      return;
    }

    setIsSavingBio(true);

    try {
      const response = await profileService.updateProfile({ bio });
      setUser(response.data);
      setIsEditingBio(false);
      setSuccessMessage('Cập nhật tiểu sử thành công!');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Không thể cập nhật tiểu sử.';
      setErrorMessage(errorMsg);
    } finally {
      setIsSavingBio(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleLogoutClick = async () => {
    try {
      await authService.logout();
      onLogout();
    } catch (err) {
      onLogout(); // Fallback nếu có lỗi mạng
    }
  };

  // Trình bày định dạng ngày tháng sang trọng
  const formatJoinedDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return `Thành viên từ ngày ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    } catch (e) {
      return 'Thành viên MiniFaceBook';
    }
  };

  // Guard: Nếu chưa có dữ liệu user (vd: phiên hết hạn, API trả 401), tránh crash khi
  // truy cập user.email.split(...). Hiển thị trạng thái loading và đăng xuất an toàn.
  if (!user || !user.email) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-20 flex flex-col items-center justify-center text-center animate-fade-in-up">
        <Loader2 className="h-10 w-10 text-violet-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Đang tải thông tin tài khoản...</p>
        <button
          onClick={handleLogoutClick}
          className="mt-6 px-4 py-2.5 rounded-xl bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-xs font-bold text-slate-600 hover:text-rose-500 transition-all duration-300 flex items-center space-x-1.5"
        >
          <LogOut className="h-4 w-4" />
          <span>Đăng nhập lại</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 animate-fade-in-up">
      {/* Khối Thông báo Hệ thống (Toasts) */}
      <div className="fixed top-5 right-5 z-50 space-y-3 max-w-md w-full pointer-events-none">
        {successMessage && (
          <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/80 text-emerald-300 flex items-center space-x-3 shadow-lg shadow-emerald-500/10 backdrop-blur-md animate-fade-in-right pointer-events-auto">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 animate-bounce" />
            <span className="text-sm font-semibold">{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-950/80 text-rose-300 flex items-center space-x-3 shadow-lg shadow-rose-500/10 backdrop-blur-md animate-shake pointer-events-auto">
            <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
            <span className="text-sm font-semibold">{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Main Glassmorphic Profile Card */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition-all duration-500">
        
        {/* Banner trang trí Gradient thanh lịch */}
        <div className="h-44 w-full bg-gradient-to-r from-violet-600/20 via-indigo-600/20 to-blue-600/20 relative">
          <div className="absolute inset-0 bg-white/20"></div>
          {/* Nút Đăng xuất ở góc banner */}
          <button
            onClick={handleLogoutClick}
            className="absolute top-6 right-6 px-4 py-2.5 rounded-xl bg-white/80 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-xs font-bold text-slate-600 hover:text-rose-500 transition-all duration-300 flex items-center space-x-1.5 hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-sm shadow-sm"
          >
            <LogOut className="h-4 w-4" />
            <span>Đăng xuất</span>
          </button>
        </div>

        {/* Thông tin hồ sơ & Tải ảnh đại diện */}
        <div className="px-6 sm:px-10 pb-10 relative">
          
          {/* Layout Avatar và Header */}
          <div className="flex flex-col md:flex-row md:items-end -mt-20 md:space-x-8 mb-8">
            
            {/* Avatar Container với Ripple Pulse Animation */}
            <div className="relative group mx-auto md:mx-0">
              {/* Vòng tròn hiệu ứng lấp lánh (Avatar Ripple Pulse) */}
              <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-500 blur-sm opacity-50 group-hover:opacity-100 transition duration-500 group-hover:scale-105 animate-pulse"></div>
              
              {/* Hình ảnh chính */}
              <div className="h-36 w-36 rounded-full border-4 border-white overflow-hidden bg-slate-100 relative shadow-md flex items-center justify-center">
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt="Avatar" 
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <UserIcon className="h-16 w-16 text-slate-400" />
                )}

                {/* Loading Overlay khi đang upload */}
                {isUploadingAvatar && (
                  <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center">
                    <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
                    <span className="text-[10px] text-violet-600 mt-1 font-bold">Tải lên...</span>
                  </div>
                )}

                {/* Hover Trigger overlay */}
                {!isUploadingAvatar && (
                  <button
                    onClick={triggerFileInput}
                    className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center text-white cursor-pointer"
                  >
                    <Camera className="h-6 w-6 text-blue-400 animate-bounce" />
                    <span className="text-[10px] uppercase font-black tracking-widest mt-1">Thay ảnh</span>
                  </button>
                )}
              </div>

              {/* Input tệp ẩn */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
            </div>

            {/* Thông tin văn bản User */}
            <div className="text-center md:text-left mt-6 md:mt-0 flex-grow">
              <h2 className="text-3xl font-black text-slate-800 tracking-tight font-outfit mb-1">
                {user.email.split('@')[0]}
              </h2>
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-sm text-slate-500 mt-2 font-medium">
                <span className="flex items-center space-x-1">
                  <Mail className="h-4 w-4 text-violet-400" />
                  <span>{user.email}</span>
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-slate-300 hidden sm:inline-block"></span>
                <span className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4 text-indigo-400" />
                  <span>{formatJoinedDate(user.createdAt)}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Grid Layout 2 Cột chi tiết */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start border-t border-slate-200 pt-8">
            
            {/* Cột trái: Cập nhật Tiểu sử (Bio) với Focus Glassmorphic Glow */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
                    <BookOpen className="h-5 w-5 text-violet-500" />
                    <span>Tiểu sử cá nhân</span>
                  </h3>
                  {!isEditingBio && (
                    <button
                      onClick={() => setIsEditingBio(true)}
                      className="text-xs font-bold text-[hsl(var(--primary))] hover:underline cursor-pointer"
                    >
                      Chỉnh sửa
                    </button>
                  )}
                </div>

                {isEditingBio ? (
                  <div className="space-y-3">
                    {/* Ô nhập liệu với Focus Glassmorphic Glow */}
                    <div className="relative">
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Hãy chia sẻ đôi chút về bản thân bạn..."
                        className="w-full h-32 p-4 rounded-xl border border-slate-200 bg-white text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 resize-none text-sm leading-relaxed transition-all"
                        maxLength={255}
                        disabled={isSavingBio}
                      />
                      <span className="absolute bottom-3 right-3 text-xs font-bold text-slate-600">
                        {bio.length}/255
                      </span>
                    </div>

                    <div className="flex space-x-3 justify-end">
                      <button
                        onClick={() => {
                          setBio(user.bio || '');
                          setIsEditingBio(false);
                        }}
                        className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition cursor-pointer"
                        disabled={isSavingBio}
                      >
                        Huỷ bỏ
                      </button>
                      <button
                        onClick={handleSaveBio}
                        className="px-5 py-2 rounded-lg bg-[hsl(var(--primary))] hover-lift text-xs font-bold text-white flex items-center space-x-1.5 cursor-pointer"
                        disabled={isSavingBio}
                      >
                        {isSavingBio ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>Đang lưu...</span>
                          </>
                        ) : (
                          <span>Lưu tiểu sử</span>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 min-h-24 flex items-center justify-center text-center">
                    {user.bio ? (
                      <p className="text-slate-600 text-sm leading-relaxed text-left w-full whitespace-pre-wrap">
                        {user.bio}
                      </p>
                    ) : (
                      <span className="text-slate-400 text-sm italic">Chưa cấu hình tiểu sử cá nhân. Hãy chia sẻ gì đó với mọi người!</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Cột phải: Vùng kéo thả hình ảnh Drag-and-Drop nâng cao */}
            <div className="lg:col-span-5 space-y-3">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <UploadCloud className="h-5 w-5 text-indigo-400" />
                <span>Kéo & Thả ảnh đại diện</span>
              </h3>

              {/* Vùng Drag and Drop */}
              <div 
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={triggerFileInput}
                className={`w-full p-8 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ${
                  dragActive 
                    ? 'border-blue-500 bg-blue-500/5 scale-[1.02] shadow-[0_0_20px_rgba(59,130,246,0.1)]' 
                    : 'border-slate-800 hover:border-slate-700 bg-slate-950/10 hover:bg-slate-950/20'
                }`}
              >
                <div className={`p-4 rounded-full bg-slate-900 border border-slate-800 mb-4 transition-transform duration-300 ${dragActive ? 'scale-110 rotate-12 text-blue-400' : 'text-slate-400'}`}>
                  <UploadCloud className="h-8 w-8" />
                </div>
                <p className="text-sm font-bold text-slate-300">
                  {dragActive ? "Thả tệp tin vào đây" : "Thả ảnh vào đây hoặc nhấp để chọn"}
                </p>
                <p className="text-xs text-slate-600 mt-2 font-medium">
                  Hỗ trợ định dạng JPG, PNG, WEBP tối đa 5MB.
                </p>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
