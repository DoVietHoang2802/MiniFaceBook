import React, { useState, useRef, useEffect } from 'react';
import { z } from 'zod';
import { useParams, useNavigate } from 'react-router-dom';
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
  UploadCloud,
  MessageSquare,
  Users,
  MapPin,
  Briefcase,
  Heart,
  Home,
  UserPlus,
  UserMinus,
  UserCheck,
  UserX,
  Clock
} from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { profileService } from '../services/profileService';
import type { UserProfileResponse } from '../services/profileService';
import { authService } from '../../auth/services/authService';
import type { UserResponse } from '../../auth/services/authService';
import { useAuth } from '../../../core/auth/AuthContext';

// Import elements for Facebook layout
import { postService } from '../../post/services/postService';
import PostCard from '../../post/components/PostCard';
import CreatePostCard from '../../post/components/CreatePostCard';
import type { PostResponse } from '../../post/types/post.types';
import { friendService } from '../../friends/services/friendService';
import type { FriendshipResponse } from '../../friends/types/friend.types';

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

const VIETNAM_CITIES = [
  "An Giang", "Bà Rịa - Vũng Tàu", "Bạc Liêu", "Bắc Giang", "Bắc Kạn", "Bắc Ninh",
  "Bến Tre", "Bình Dương", "Bình Định", "Bình Phước", "Bình Thuận", "Cà Mau",
  "Cao Bằng", "Cần Thơ", "Đà Nẵng", "Đắk Lắk", "Đắk Nông", "Điện Biên", "Đồng Nai",
  "Đồng Tháp", "Gia Lai", "Hà Giang", "Hà Nam", "Hà Nội", "Hà Tĩnh", "Hải Dương",
  "Hải Phòng", "Hậu Giang", "Hòa Bình", "Hồ Chí Minh", "Hưng Yên", "Khánh Hòa",
  "Kiên Giang", "Kon Tum", "Lai Châu", "Lạng Sơn", "Lào Cai", "Lâm Đồng", "Long An",
  "Nam Định", "Nghệ An", "Ninh Bình", "Ninh Thuận", "Phú Thọ", "Phú Yên", "Quảng Bình",
  "Quảng Nam", "Quảng Ngãi", "Quảng Ninh", "Quảng Trị", "Sóc Trăng", "Sơn La", "Tây Ninh",
  "Thái Bình", "Thái Nguyên", "Thanh Hóa", "Thừa Thiên Huế", "Tiền Giang", "Trà Vinh",
  "Tuyên Quang", "Vĩnh Long", "Vĩnh Phúc", "Yên Bái"
];

interface CitySearchSelectProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

const CitySearchSelect: React.FC<CitySearchSelectProps> = ({ label, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCities = VIETNAM_CITIES.filter(city => 
    city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-1.5 relative" ref={containerRef}>
      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</label>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white hover:border-slate-300 transition-all cursor-pointer flex justify-between items-center"
      >
        <span className={value ? "text-slate-700 font-extrabold" : "text-slate-400"}>
          {value || placeholder || "Chọn tỉnh/thành phố"}
        </span>
        <span className="text-slate-400 text-[10px]">▼</span>
      </div>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-slate-100">
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm tỉnh/thành..."
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-violet-500"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto flex-1 max-h-40">
            {filteredCities.length > 0 ? (
              filteredCities.map((city) => (
                <div 
                  key={city}
                  onClick={() => {
                    onChange(city);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className={`px-3 py-2 text-xs cursor-pointer hover:bg-violet-50 hover:text-violet-600 transition-colors ${value === city ? 'bg-violet-50 text-violet-600 font-bold' : 'text-slate-600'}`}
                >
                  {city}
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-xs text-slate-400 text-center italic">Không tìm thấy kết quả</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface ProfilePageProps {
  initialUser?: UserProfileResponse | UserResponse | null;
  onLogout?: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ initialUser, onLogout }) => {
  const auth = useAuth();
  const navigate = useNavigate();
  const { userId } = useParams<{ userId?: string }>();
  const isOwnProfile = !userId || userId === auth.user?.id;
  const activeLogout = onLogout || auth.logout;

  const [user, setUser] = useState<UserProfileResponse | UserResponse | null>(
    isOwnProfile ? (initialUser || auth.user) : null
  );
  const [bio, setBio] = useState(
    isOwnProfile ? (initialUser?.bio || auth.user?.bio || '') : ''
  );
  const [isLoading, setIsLoading] = useState(!isOwnProfile);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isSavingBio, setIsSavingBio] = useState(false);
  
  // Trạng thái tệp tin và upload
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  // Phản hồi người dùng
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Trạng thái thông tin chi tiết cá nhân (Lives in, Hometown, Work, Relationship)
  const [city, setCity] = useState('');
  const [hometown, setHometown] = useState('');
  const [work, setWork] = useState('');
  const [relationship, setRelationship] = useState('');
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Facebook layout tab navigation, user posts and friends states
  const [activeTab, setActiveTab] = useState<'posts' | 'about' | 'friends'>('posts');
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [friendsList, setFriendsList] = useState<FriendshipResponse[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');

  // Trạng thái quan hệ bạn bè (khi xem profile người khác)
  const [relationshipStatus, setRelationshipStatus] = useState<'NONE' | 'FRIEND' | 'PENDING_SENT' | 'PENDING_RECEIVED'>('NONE');
  const [friendshipId, setFriendshipId] = useState<string | null>(null);
  const [isLoadingRelationship, setIsLoadingRelationship] = useState(false);

  const checkRelationship = async () => {
    if (isOwnProfile || !userId) return;
    setIsLoadingRelationship(true);
    try {
      const [friends, sent, pending] = await Promise.all([
        friendService.getFriends(),
        friendService.getSentRequests(),
        friendService.getPendingRequests()
      ]);

      const friendRel = friends.find(f => f.userId === userId);
      if (friendRel) {
        setRelationshipStatus('FRIEND');
        setFriendshipId(friendRel.friendshipId);
        return;
      }

      const sentRel = sent.find(s => s.userId === userId);
      if (sentRel) {
        setRelationshipStatus('PENDING_SENT');
        setFriendshipId(sentRel.friendshipId);
        return;
      }

      const pendingRel = pending.find(p => p.userId === userId);
      if (pendingRel) {
        setRelationshipStatus('PENDING_RECEIVED');
        setFriendshipId(pendingRel.friendshipId);
        return;
      }

      setRelationshipStatus('NONE');
      setFriendshipId(null);
    } catch (err) {
      console.error("Error loading relationship status:", err);
    } finally {
      setIsLoadingRelationship(false);
    }
  };

  const handleSendFriendRequest = async () => {
    if (!userId) return;
    setIsLoadingRelationship(true);
    try {
      const friendship = await friendService.sendRequest(userId);
      setRelationshipStatus('PENDING_SENT');
      setFriendshipId(friendship.friendshipId);
      setSuccessMessage('Đã gửi lời mời kết bạn!');
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Không thể gửi lời mời kết bạn.');
    } finally {
      setIsLoadingRelationship(false);
    }
  };

  const handleCancelFriendRequest = async () => {
    if (!friendshipId) return;
    setIsLoadingRelationship(true);
    try {
      await friendService.cancelRequest(friendshipId);
      setRelationshipStatus('NONE');
      setFriendshipId(null);
      setSuccessMessage('Đã hủy yêu cầu kết bạn.');
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Không thể hủy yêu cầu kết bạn.');
    } finally {
      setIsLoadingRelationship(false);
    }
  };

  const handleAcceptFriendRequest = async () => {
    if (!friendshipId) return;
    setIsLoadingRelationship(true);
    try {
      await friendService.acceptRequest(friendshipId);
      setRelationshipStatus('FRIEND');
      setSuccessMessage('Các bạn đã trở thành bạn bè!');
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Không thể chấp nhận lời mời.');
    } finally {
      setIsLoadingRelationship(false);
    }
  };

  const handleRejectFriendRequest = async () => {
    if (!friendshipId) return;
    setIsLoadingRelationship(true);
    try {
      await friendService.rejectRequest(friendshipId);
      setRelationshipStatus('NONE');
      setFriendshipId(null);
      setSuccessMessage('Đã xóa lời mời kết bạn.');
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Không thể từ chối lời mời.');
    } finally {
      setIsLoadingRelationship(false);
    }
  };

  const handleUnfriend = async () => {
    if (!userId) return;
    if (!window.confirm("Bạn có chắc chắn muốn hủy kết bạn?")) return;
    setIsLoadingRelationship(true);
    try {
      await friendService.unfriend(userId);
      setRelationshipStatus('NONE');
      setFriendshipId(null);
      setSuccessMessage('Đã hủy kết bạn.');
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Không thể hủy kết bạn.');
    } finally {
      setIsLoadingRelationship(false);
    }
  };

  const handlePostCreated = (newPost: PostResponse) => {
    setPosts((prev) => [newPost, ...prev]);
    setSuccessMessage('Đăng bài viết thành công!');
  };

  const handlePostDeleted = (deletedPostId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== deletedPostId));
    setSuccessMessage('Đã xóa bài viết thành công.');
  };

  // Sync state khi activeUser thay đổi hoặc khi userId thay đổi (để load profile mới)
  useEffect(() => {
    // Đổi profile → reset list ngay để không hiện bạn bè của người trước
    setFriendsList([]);
    setPosts([]);
    setActiveTab('posts');
    setFriendSearchQuery('');
    setRelationshipStatus('NONE');
    setFriendshipId(null);

    if (isOwnProfile) {
      const u = initialUser || auth.user;
      setUser(u);
      setBio(u?.bio || '');
      setCity((u as any)?.city || '');
      setHometown((u as any)?.hometown || '');
      setWork((u as any)?.work || '');
      setRelationship((u as any)?.relationship || '');
      setIsLoading(false);
    } else if (userId) {
      setIsLoading(true);
      setUser(null);
      let cancelled = false;
      profileService.getProfileById(userId)
        .then((res) => {
          if (cancelled) return;
          setUser(res.data);
          setBio(res.data.bio || '');
          setCity(res.data.city || '');
          setHometown(res.data.hometown || '');
          setWork(res.data.work || '');
          setRelationship(res.data.relationship || '');
          checkRelationship();
        })
        .catch(() => {
          if (!cancelled) setErrorMessage('Không tải được thông tin người dùng.');
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }
  }, [userId, isOwnProfile, auth.user, initialUser]);

  // Load posts + friends theo đúng chủ profile đang xem (tránh stale / race)
  useEffect(() => {
    const profileOwnerId = user?.id;
    if (!profileOwnerId) return;

    let cancelled = false;
    const load = async () => {
      setIsLoadingFriends(true);
      setIsLoadingPosts(true);
      setFriendsList([]);
      setPosts([]);
      try {
        const [friendsData, postsRes] = await Promise.all([
          friendService.getFriends(profileOwnerId),
          postService.getNewsFeed(0, 50),
        ]);
        if (cancelled) return;
        setFriendsList(friendsData || []);
        const content = postsRes?.data?.content ?? [];
        setPosts(content.filter((p: PostResponse) => p.authorId === profileOwnerId));
      } catch (err) {
        if (!cancelled) {
          console.error('Error loading profile social data:', err);
          setFriendsList([]);
          setPosts([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingFriends(false);
          setIsLoadingPosts(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

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

  const handleSaveDetails = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSavingDetails(true);

    try {
      const response = await profileService.updateProfile({
        city: city || '',
        hometown: hometown || '',
        work: work || '',
        relationship: relationship || ''
      });
      setUser(response.data);
      if (isOwnProfile && auth.setUser) {
        auth.setUser(response.data as any);
      }
      setIsEditingDetails(false);
      setSuccessMessage('Cập nhật chi tiết cá nhân thành công!');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Không thể cập nhật chi tiết cá nhân.';
      setErrorMessage(errorMsg);
    } finally {
      setIsSavingDetails(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleLogoutClick = async () => {
    try {
      await authService.logout();
      if (activeLogout) activeLogout();
    } catch (err) {
      if (activeLogout) activeLogout(); // Fallback nếu có lỗi mạng
    }
  };

  // Trình bày định dạng ngày tháng sang trọng
  const formatJoinedDate = (dateStr?: string) => {
    try {
      if (!dateStr) return 'Thành viên MiniFaceBook';
      const date = new Date(dateStr);
      return `Thành viên từ ngày ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    } catch (e) {
      return 'Thành viên MiniFaceBook';
    }
  };

  // Guard: Trạng thái đang tải dữ liệu
  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-20 flex flex-col items-center justify-center text-center animate-fade-in-up">
        <Loader2 className="h-10 w-10 text-violet-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Đang tải thông tin trang cá nhân...</p>
      </div>
    );
  }

  // Guard: Nếu chưa có dữ liệu user (vd: phiên hết hạn, API trả 401), tránh crash khi
  // truy cập user.email.split(...). Hiển thị trạng thái loading và đăng xuất an toàn.
  if (!user || !user.email) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-20 flex flex-col items-center justify-center text-center animate-fade-in-up">
        <AlertTriangle className="h-10 w-10 text-rose-500 mb-4 animate-pulse" />
        <p className="text-slate-500 font-medium">Không thể tìm thấy thông tin tài khoản hoặc trang cá nhân không tồn tại.</p>
        <button
          onClick={handleLogoutClick}
          className="mt-6 px-4 py-2.5 rounded-xl bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-xs font-bold text-slate-600 hover:text-rose-500 transition-all duration-300 flex items-center space-x-1.5 cursor-pointer shadow-sm"
        >
          <LogOut className="h-4 w-4" />
          <span>Đăng nhập lại</span>
        </button>
      </div>
    );
  }

  const filteredFriends = friendsList.filter((friend) => {
    const query = friendSearchQuery.toLowerCase().trim();
    if (!query) return true;
    const name = (friend.name || '').toLowerCase();
    const email = (friend.email || '').toLowerCase();
    return name.includes(query) || email.includes(query);
  });

  return (
    <div className="w-full max-w-5xl mx-auto px-0 py-2 animate-fade-in-up">
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

      {/* Facebook-style Cover Photo */}
      <div className="relative h-56 sm:h-72 md:h-80 w-full rounded-t-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 overflow-hidden shadow-sm group">
        <div className="absolute inset-0 bg-slate-900/10 mix-blend-overlay"></div>
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        {isOwnProfile && (
          <button 
            onClick={() => setSuccessMessage("Tính năng tải ảnh bìa riêng sẽ được cập nhật sớm!")}
            className="absolute bottom-4 right-4 flex items-center space-x-2 px-3.5 py-2 bg-black/60 hover:bg-black/80 text-white rounded-xl text-[11px] font-bold transition backdrop-blur-sm cursor-pointer shadow-md"
          >
            <Camera className="h-4 w-4" />
            <span>Chỉnh sửa ảnh bìa</span>
          </button>
        )}
      </div>

      {/* Facebook-style Profile Info Bar */}
      <div className="w-full bg-white rounded-b-2xl border border-t-0 border-slate-200 px-6 sm:px-8 pb-4 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row md:items-end -mt-20 md:-mt-14 md:space-x-6 mb-4 text-center md:text-left">
          
          {/* Large Overlapping Avatar */}
          <div className="relative group mx-auto md:mx-0 shrink-0">
            <div className="h-36 w-36 rounded-full border-4 border-white overflow-hidden bg-slate-100 relative shadow-md flex items-center justify-center">
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt="Avatar" 
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <UserIcon className="h-16 w-16 text-slate-400" />
              )}

              {isUploadingAvatar && (
                <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center">
                  <Loader2 className="h-6 w-6 text-violet-500 animate-spin" />
                  <span className="text-[9px] text-violet-600 mt-1 font-bold">Đang tải...</span>
                </div>
              )}

              {!isUploadingAvatar && isOwnProfile && (
                <button
                  onClick={triggerFileInput}
                  className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center text-white cursor-pointer"
                >
                  <Camera className="h-5 w-5 text-white" />
                  <span className="text-[9px] uppercase font-black tracking-widest mt-1">Thay ảnh</span>
                </button>
              )}
            </div>

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
          </div>

          {/* User Name & Bio Summary */}
          <div className="flex-grow mt-4 md:mt-0 md:pb-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight font-outfit mb-1.5">
              {(user as any).name || user.email.split('@')[0]}
            </h1>
            <p className="text-slate-500 text-xs font-semibold max-w-lg mx-auto md:mx-0">
              {user.bio || "Chưa thiết lập tiểu sử cá nhân."}
            </p>
          </div>

          {/* Header Action Buttons */}
          <div className="flex justify-center items-center gap-2 mt-4 md:mt-0 md:pb-2 shrink-0">
            {isOwnProfile ? (
              <>
                <button
                  onClick={() => {
                    setActiveTab('about');
                    setIsEditingBio(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[11px] font-black text-slate-700 transition cursor-pointer shadow-sm"
                >
                  Chỉnh sửa tiểu sử
                </button>
                <button
                  onClick={handleLogoutClick}
                  className="px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-100 hover:bg-rose-100 text-[11px] font-black text-rose-600 transition cursor-pointer flex items-center gap-1.5"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Đăng xuất</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                {/* Nút Kết Bạn / Bạn Bè dựa trên relationshipStatus */}
                {isLoadingRelationship ? (
                  <button className="px-4 py-2.5 rounded-xl bg-slate-100 text-[11px] font-black text-slate-500 flex items-center gap-1.5 cursor-not-allowed" disabled>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Đang xử lý...</span>
                  </button>
                ) : relationshipStatus === 'NONE' ? (
                  <button
                    onClick={handleSendFriendRequest}
                    className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-black transition flex items-center gap-1.5 shadow-md shadow-violet-500/10 cursor-pointer"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Thêm bạn bè</span>
                  </button>
                ) : relationshipStatus === 'PENDING_SENT' ? (
                  <button
                    onClick={handleCancelFriendRequest}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-black transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Clock className="h-4 w-4 text-amber-500 animate-pulse" />
                    <span>Đã gửi lời mời (Hủy)</span>
                  </button>
                ) : relationshipStatus === 'PENDING_RECEIVED' ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleAcceptFriendRequest}
                      className="px-3.5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-black transition flex items-center gap-1 cursor-pointer"
                    >
                      <UserCheck className="h-4 w-4" />
                      <span>Xác nhận</span>
                    </button>
                    <button
                      onClick={handleRejectFriendRequest}
                      className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-black transition flex items-center gap-1 cursor-pointer"
                    >
                      <UserX className="h-4 w-4 text-rose-500" />
                      <span>Xóa</span>
                    </button>
                  </div>
                ) : (
                  // FRIEND status
                  <button
                    onClick={handleUnfriend}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 text-[11px] font-black transition flex items-center gap-1.5 cursor-pointer border border-transparent hover:border-rose-100"
                  >
                    <UserCheck className="h-4 w-4 text-emerald-500" />
                    <span>Bạn bè (Hủy kết bạn)</span>
                  </button>
                )}

                {/* Nút Nhắn Tin luôn hiển thị bên cạnh */}
                <button
                  onClick={() => navigate(`/chats/${user.id}`)}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-black transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <MessageSquare className="h-4 w-4 text-violet-600" />
                  <span>Nhắn tin</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tab Selectors */}
        <div className="flex items-center space-x-6 border-t border-slate-100 pt-3 mt-4 overflow-x-auto scrollbar-none">
          {(['posts', 'about', 'friends'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2.5 text-xs font-black relative transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === tab ? "text-violet-600 font-black" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab === 'posts' ? 'Bài viết' : tab === 'about' ? 'Giới thiệu' : 'Bạn bè'}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Tab Content Grid */}
      <div className="min-h-[550px]">
        {/* TAB 1: POSTS & FEED (Facebook Double Column) */}
        {activeTab === 'posts' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2 animate-fade-in-up">
            
            {/* Left Column Sidebar (Intro, Photos, Friends Quick view) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Intro Box */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
                <h3 className="text-sm font-black text-slate-800">Giới thiệu</h3>
                <div className="space-y-3.5 text-xs text-slate-600 font-semibold">
                  {user.bio ? (
                    <p className="text-center italic text-slate-500 pb-3 border-b border-slate-100 font-medium">
                      "{user.bio}"
                    </p>
                  ) : (
                    isOwnProfile && (
                      <button 
                        onClick={() => {
                          setActiveTab('about');
                          setIsEditingBio(true);
                        }}
                        className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-xl transition cursor-pointer"
                      >
                        Thêm tiểu sử giới thiệu
                      </button>
                    )
                  )}

                  {user.city && (
                    <div className="flex items-center space-x-3 text-slate-600">
                      <Home className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                      <span>Sống tại <span className="font-extrabold">{user.city}</span></span>
                    </div>
                  )}

                  {user.hometown && (
                    <div className="flex items-center space-x-3 text-slate-600">
                      <MapPin className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                      <span>Đến từ <span className="font-extrabold">{user.hometown}</span></span>
                    </div>
                  )}

                  {user.work && (
                    <div className="flex items-center space-x-3 text-slate-600">
                      <Briefcase className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                      <span className="truncate">Công việc: <span className="font-extrabold">{user.work}</span></span>
                    </div>
                  )}

                  {user.relationship && user.relationship !== 'Không rõ' && (
                    <div className="flex items-center space-x-3 text-slate-600">
                      <Heart className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                      <span>Tình trạng: <span className="font-extrabold">{user.relationship}</span></span>
                    </div>
                  )}

                  {!user.city && !user.hometown && !user.work && (!user.relationship || user.relationship === 'Không rõ') && (
                    <p className="text-slate-400 text-xs italic text-center py-2">Chưa cập nhật thông tin chi tiết.</p>
                  )}

                  {isOwnProfile && (
                    <button
                      onClick={() => {
                        setActiveTab('about');
                        setIsEditingDetails(true);
                      }}
                      className="w-full py-2 mt-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      Chỉnh sửa chi tiết
                    </button>
                  )}
                </div>
              </div>

              {/* Photos Gallery Box */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-black text-slate-800">Hình ảnh</h3>
                  <button 
                    onClick={() => setSuccessMessage("Bạn có thể xem đầy đủ ảnh ở các bài viết bên phải!")} 
                    className="text-xs font-bold text-violet-600 hover:underline cursor-pointer"
                  >
                    Xem tất cả
                  </button>
                </div>
                {posts.flatMap(p => p.imageUrls || []).length > 0 ? (
                  <div className="grid grid-cols-3 gap-1 rounded-xl overflow-hidden">
                    {posts.flatMap(p => p.imageUrls || []).slice(0, 9).map((url, idx) => (
                      <div key={idx} className="aspect-square relative group overflow-hidden bg-slate-100">
                        <img 
                          src={url} 
                          alt="Gallery item" 
                          className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition duration-300 cursor-pointer" 
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">Chưa có hình ảnh đăng tải.</p>
                )}
              </div>

              {/* Friends Box */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-black text-slate-800">Bạn bè</h3>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{friendsList.length} người bạn</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('friends')}
                    className="text-xs font-bold text-violet-600 hover:underline cursor-pointer"
                  >
                    Xem tất cả bạn bè
                  </button>
                </div>
                {friendsList.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {friendsList.slice(0, 6).map((friend) => (
                      <div 
                        key={friend.friendshipId}
                        onClick={() => navigate(`/profile/${friend.userId}`)}
                        className="cursor-pointer group flex flex-col text-center"
                      >
                        <div className="aspect-square w-full rounded-lg overflow-hidden bg-slate-100 border border-slate-100">
                          {friend.avatar ? (
                            <img src={friend.avatar} alt={friend.name || friend.email} className="h-full w-full object-cover group-hover:scale-105 transition duration-300" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-slate-400 font-black bg-slate-50 text-xs">
                              {(friend.name || friend.email || 'U').charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] font-black text-slate-700 truncate mt-1.5 group-hover:text-violet-600 transition">
                          {friend.name || friend.email.split('@')[0]}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">Chưa có bạn bè nào.</p>
                )}
              </div>

            </div>

            {/* Right Column: Feed and Creator */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Post Creation (if own profile) */}
              {isOwnProfile && (
                <CreatePostCard 
                  onPostCreated={handlePostCreated} 
                  currentUser={auth.user} 
                />
              )}

              {/* Feed List */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-800 px-1">Bài viết cá nhân</h3>
                
                {isLoadingPosts ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400 bg-white border border-slate-200 rounded-2xl">
                    <Loader2 className="h-6 w-6 text-violet-500 animate-spin mb-3" />
                    <p className="text-[11px] font-semibold">Đang tải bài viết...</p>
                  </div>
                ) : posts.length > 0 ? (
                  posts.map((post) => (
                    <PostCard 
                      key={post.id} 
                      post={post} 
                      currentUser={auth.user} 
                      onPostDeleted={handlePostDeleted} 
                    />
                  ))
                ) : (
                  <div className="p-12 rounded-2xl border border-slate-200 bg-white text-center text-slate-400">
                    <BookOpen className="h-8 w-8 mx-auto mb-3 opacity-40" />
                    <p className="text-xs font-semibold">Chưa đăng tải bài viết nào.</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: ABOUT / DETAIL */}
        {activeTab === 'about' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2 animate-fade-in-up">
            
            {/* Account Details Box */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Contact Info */}
              <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-5">
                <h3 className="text-base font-black text-slate-800 flex items-center space-x-2">
                  <UserIcon className="h-5 w-5 text-violet-500" />
                  <span>Thông tin liên hệ & Tài khoản</span>
                </h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3.5 border-b border-slate-100">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tên hiển thị</span>
                    <span className="text-xs font-extrabold text-slate-700">{(user as any).name || user.email.split('@')[0]}</span>
                  </div>

                  <div className="flex justify-between items-center pb-3.5 border-b border-slate-100">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Địa chỉ Email</span>
                    <span className="text-xs font-extrabold text-slate-700">{user.email}</span>
                  </div>

                  <div className="flex justify-between items-center pb-3.5 border-b border-slate-100">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Ngày đăng ký</span>
                    <span className="text-xs font-extrabold text-slate-700">{formatJoinedDate(user.createdAt)}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Quyền hạn hệ thống</span>
                    <div className="flex gap-1">
                      {user.roles?.map((role) => (
                        <span key={role} className="px-2 py-0.5 bg-violet-50 text-violet-600 text-[9px] font-black rounded uppercase tracking-wider">
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Info Card (Lives in, Hometown, Work, Relationship) */}
              <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-5">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-black text-slate-800 flex items-center space-x-2">
                    <Home className="h-5 w-5 text-violet-500" />
                    <span>Chi tiết cá nhân</span>
                  </h3>
                  {!isEditingDetails && isOwnProfile && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setCity((user as any).city || '');
                        setHometown((user as any).hometown || '');
                        setWork((user as any).work || '');
                        setRelationship((user as any).relationship || '');
                        setIsEditingDetails(true);
                      }}
                      className="text-xs font-bold text-violet-600 hover:underline cursor-pointer"
                    >
                      Chỉnh sửa
                    </button>
                  )}
                </div>

                {isEditingDetails ? (
                  <div className="space-y-4">
                    <CitySearchSelect
                      label="Tỉnh/Thành phố hiện tại"
                      value={city}
                      onChange={setCity}
                      placeholder="Chọn tỉnh/thành phố hiện tại"
                    />

                    <CitySearchSelect
                      label="Quê quán"
                      value={hometown}
                      onChange={setHometown}
                      placeholder="Chọn quê quán"
                    />

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Công việc</label>
                      <input
                        type="text"
                        value={work}
                        onChange={(e) => setWork(e.target.value)}
                        placeholder="Ví dụ: App Developer tại Vidimi"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tình trạng quan hệ</label>
                      <select
                        value={relationship || 'Không rõ'}
                        onChange={(e) => setRelationship(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none bg-white transition-all cursor-pointer"
                      >
                        <option value="Hẹn hò">Hẹn hò</option>
                        <option value="Độc thân">Độc thân</option>
                        <option value="Không rõ">Không rõ (Không hiển thị)</option>
                      </select>
                    </div>

                    <div className="flex space-x-2 justify-end pt-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setIsEditingDetails(false);
                        }}
                        className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition cursor-pointer"
                        disabled={isSavingDetails}
                      >
                        Huỷ bỏ
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); handleSaveDetails(); }}
                        className="px-5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-xs font-bold text-white flex items-center space-x-1.5 cursor-pointer"
                        disabled={isSavingDetails}
                      >
                        {isSavingDetails ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>Đang lưu...</span>
                          </>
                        ) : (
                          <span>Lưu thay đổi</span>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-3.5 border-b border-slate-100">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center"><Home className="h-3.5 w-3.5 text-slate-400 mr-1.5" /> Tỉnh/Thành phố hiện tại</span>
                      <span className={`text-xs font-extrabold ${user.city ? "text-slate-700" : "text-slate-400 italic"}`}>
                        {user.city || "Chưa thiết lập"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pb-3.5 border-b border-slate-100">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center"><MapPin className="h-3.5 w-3.5 text-slate-400 mr-1.5" /> Quê quán</span>
                      <span className={`text-xs font-extrabold ${user.hometown ? "text-slate-700" : "text-slate-400 italic"}`}>
                        {user.hometown || "Chưa thiết lập"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pb-3.5 border-b border-slate-100">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center"><Briefcase className="h-3.5 w-3.5 text-slate-400 mr-1.5" /> Công việc</span>
                      <span className={`text-xs font-extrabold ${user.work ? "text-slate-700" : "text-slate-400 italic"}`}>
                        {user.work || "Chưa thiết lập"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center"><Heart className="h-3.5 w-3.5 text-slate-400 mr-1.5" /> Tình trạng quan hệ</span>
                      <span className={`text-xs font-extrabold ${(user.relationship && user.relationship !== 'Không rõ') ? "text-slate-700" : "text-slate-400 italic"}`}>
                        {(user.relationship && user.relationship !== 'Không rõ') ? user.relationship : "Chưa thiết lập hoặc ẩn"}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Bio Edit Section */}
              <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-black text-slate-800 flex items-center space-x-2">
                    <BookOpen className="h-5 w-5 text-violet-500" />
                    <span>Tiểu sử giới thiệu</span>
                  </h3>
                  {!isEditingBio && isOwnProfile && (
                    <button
                      onClick={() => setIsEditingBio(true)}
                      className="text-xs font-bold text-violet-600 hover:underline cursor-pointer"
                    >
                      Chỉnh sửa
                    </button>
                  )}
                </div>

                {isEditingBio ? (
                  <div className="space-y-3">
                    <div className="relative">
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Hãy viết gì đó giới thiệu về bản thân bạn..."
                        className="w-full h-28 p-4 rounded-xl border border-slate-200 bg-white text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 resize-none text-xs leading-relaxed transition-all font-medium"
                        maxLength={255}
                        disabled={isSavingBio}
                      />
                      <span className="absolute bottom-3 right-3 text-[10px] font-black text-slate-500">
                        {bio.length}/255
                      </span>
                    </div>

                    <div className="flex space-x-2 justify-end">
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
                        className="px-5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-xs font-bold text-white flex items-center space-x-1.5 cursor-pointer"
                        disabled={isSavingBio}
                      >
                        {isSavingBio ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>Đang lưu...</span>
                          </>
                        ) : (
                          <span>Lưu thay đổi</span>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 rounded-xl border border-slate-100 bg-slate-50/50 min-h-20 flex items-center justify-center text-center">
                    {user.bio ? (
                      <p className="text-slate-600 text-xs leading-relaxed text-left w-full whitespace-pre-wrap font-semibold">
                        {user.bio}
                      </p>
                    ) : (
                      <span className="text-slate-400 text-xs italic">Chưa thiết lập tiểu sử cá nhân. Hãy chia sẻ đôi chút về bạn!</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Drag & Drop Avatar (Own profile only) */}
            <div className="lg:col-span-5 space-y-6">
              {isOwnProfile && (
                <>
                  {/* Upload box */}
                  <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
                    <h3 className="text-sm font-black text-slate-800 flex items-center space-x-2">
                      <UploadCloud className="h-5 w-5 text-violet-500" />
                      <span>Kéo thả ảnh đại diện</span>
                    </h3>

                    <div 
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      onClick={triggerFileInput}
                      className={`w-full p-8 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ${
                        dragActive 
                          ? 'border-violet-500 bg-violet-50 scale-[1.01] shadow-md shadow-violet-500/5' 
                          : 'border-slate-200 hover:border-slate-350 bg-slate-50/50 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`p-3.5 rounded-full bg-white border border-slate-200 mb-3.5 transition duration-305 ${dragActive ? 'scale-110 text-violet-500' : 'text-slate-400'}`}>
                        <UploadCloud className="h-6 w-6" />
                      </div>
                      <p className="text-[11px] font-bold text-slate-600">
                        {dragActive ? "Thả ảnh vào đây!" : "Thả ảnh vào hoặc click để chọn"}
                      </p>
                      <p className="text-[9px] text-slate-400 mt-1 font-semibold">
                        Chấp nhận JPG, PNG, WEBP lên đến 20MB.
                      </p>
                    </div>
                  </div>

                  {/* Security settings link */}
                  <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
                    <h3 className="text-sm font-black text-slate-800 flex items-center space-x-2">
                      <svg className="h-5 w-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span>Bảo mật & Mật khẩu</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 font-semibold">Cập nhật mật khẩu thường xuyên giúp bảo vệ tài khoản tốt hơn.</p>
                    <button
                      onClick={() => navigate('/settings')}
                      className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-extrabold rounded-xl transition cursor-pointer shadow-md shadow-violet-500/10"
                    >
                      Đổi mật khẩu tài khoản
                    </button>
                  </div>
                </>
              )}
            </div>

          </div>
        )}

        {/* TAB 3: FRIENDS LIST */}
        {activeTab === 'friends' && (
          <div className="mt-2 space-y-4 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-black text-slate-800">Tất cả bạn bè</h3>
                <p className="text-[10px] text-slate-450 font-bold mt-0.5">
                  {friendSearchQuery ? `${filteredFriends.length} kết quả tìm kiếm` : `${friendsList.length} người bạn`}
                </p>
              </div>
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Tìm kiếm bạn bè..."
                  value={friendSearchQuery}
                  onChange={(e) => setFriendSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 bg-slate-50 focus:bg-white transition duration-300"
                />
                <svg className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {isLoadingFriends ? (
              <div className="flex items-center justify-center py-12 text-slate-400">
                <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
              </div>
            ) : friendsList.length > 0 ? (
              filteredFriends.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredFriends.map((friend) => (
                    <div 
                      key={friend.friendshipId}
                      className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 group"
                    >
                      <div 
                        onClick={() => navigate(`/profile/${friend.userId}`)}
                        className="flex items-center space-x-3.5 cursor-pointer flex-1 min-w-0"
                      >
                        <div className="h-20 w-20 rounded-xl overflow-hidden border border-slate-100 bg-slate-50 shrink-0 shadow-inner">
                          {friend.avatar ? (
                            <img src={friend.avatar} alt={friend.name || friend.email} className="h-full w-full object-cover group-hover:scale-105 transition duration-500" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-slate-450 font-black bg-slate-100 text-lg">
                              {(friend.name || friend.email || 'U').charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="overflow-hidden space-y-1">
                          <h4 className="font-extrabold text-slate-800 text-sm group-hover:text-violet-600 transition truncate">
                            {friend.name || friend.email.split('@')[0]}
                          </h4>
                          <p className="text-[10px] text-slate-400 font-bold truncate max-w-[180px]">
                            {friend.bio || "Bạn bè trên MiniFaceBook"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 pr-2 shrink-0">
                        <button
                          onClick={() => navigate(`/chats/${friend.userId}`)}
                          className="p-2.5 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-600 transition cursor-pointer flex items-center justify-center shadow-sm"
                          title="Nhắn tin"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-white">
                  <UserIcon className="h-8 w-8 mx-auto mb-3 opacity-30" />
                  <p className="text-xs font-semibold">Không tìm thấy người bạn nào khớp với từ khóa.</p>
                </div>
              )
            ) : (
              <div className="p-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-white">
                <UserIcon className="h-8 w-8 mx-auto mb-3 opacity-30" />
                <p className="text-xs font-semibold">Chưa có người bạn nào trong danh sách.</p>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default ProfilePage;
