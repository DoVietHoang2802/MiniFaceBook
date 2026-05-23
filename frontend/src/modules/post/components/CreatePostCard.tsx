import React, { useState, useRef } from 'react';
import { Image as ImageIcon, Loader2, Send } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { postService } from '../services/postService';
import type { PostResponse } from '../types/post.types';

interface CreatePostCardProps {
  onPostCreated: (post: PostResponse) => void;
  currentUser: any;
}

const CreatePostCard: React.FC<CreatePostCardProps> = ({ onPostCreated, currentUser }) => {
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const validFiles: File[] = [];
      const MAX_SIZE = 5 * 1024 * 1024; // 5MB

      let hasOversizedFile = false;
      setIsSubmitting(true);

      for (const file of selectedFiles) {
        if (file.size > MAX_SIZE) {
          hasOversizedFile = true;
        } else {
          try {
            // Options cho Client-side Image Compression
            const options = {
              maxSizeMB: 1, // Nén xuống dưới 1MB
              maxWidthOrHeight: 1920,
              useWebWorker: true,
            };
            // Nén ảnh bằng WebWorker ngầm
            const compressedBlob = await imageCompression(file, options);
            
            // Convert Blob về File giữ nguyên tên ban đầu
            const compressedFile = new File([compressedBlob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            
            validFiles.push(compressedFile);
          } catch (error) {
            console.error('Lỗi khi nén ảnh:', error);
            // Fallback: nếu lỗi nén thì dùng ảnh gốc
            validFiles.push(file);
          }
        }
      }
      
      setIsSubmitting(false);

      if (hasOversizedFile && typeof window !== 'undefined') {
        const event = new CustomEvent('toast', { 
          detail: 'Có ảnh vượt quá 5MB đã bị loại bỏ!' 
        });
        window.dispatchEvent(event);
      }

      if (validFiles.length > 0) {
        setFiles((prev) => [...prev, ...validFiles]);
      }
      
      // Reset input để có thể chọn lại cùng 1 file nếu cần
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim() && files.length === 0) return;
    
    setIsSubmitting(true);
    try {
      const response = await postService.createPost(content, files);
      if (response.data) {
        onPostCreated(response.data);
      }
      setContent('');
      setFiles([]);
    } catch (err) {
      console.error('Lỗi khi đăng bài:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden mb-6 p-5 transition-all duration-300">
      <div className="flex items-start space-x-4">
        <div className="h-10 w-10 rounded-full border border-slate-200 overflow-hidden bg-slate-100 shrink-0 shadow-sm">
          {currentUser?.avatar ? (
            <img src={currentUser.avatar} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-slate-400 font-bold bg-slate-50">
              {currentUser?.email?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        
        <div className="flex-grow space-y-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`What's on your mind, ${currentUser?.fullName?.split(' ')[0] || 'Viet'}?`}
            className="w-full bg-transparent text-slate-800 placeholder-slate-400 resize-none outline-none text-sm min-h-[50px] focus:min-h-[90px] transition-all duration-300 font-medium"
            disabled={isSubmitting}
          />
          
          {files.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2">
              {files.map((file, index) => (
                <div key={index} className="relative aspect-square rounded-xl border border-slate-200 overflow-hidden group">
                  <img src={URL.createObjectURL(file)} alt="Preview" className="h-full w-full object-cover" />
                  <button 
                    onClick={() => removeFile(index)}
                    className="absolute top-1 right-1 h-6 w-6 rounded-full bg-slate-950/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-slate-100 pt-3 gap-3">
            {/* Thanh biểu tượng (Photo, Feeling, Check in, Poll) từ TrangChu4.png */}
            <div className="flex flex-wrap gap-1">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-1.5 text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-xl transition text-xs font-bold cursor-pointer"
                disabled={isSubmitting}
              >
                <ImageIcon className="h-4.5 w-4.5" />
                <span>Photo / Video</span>
              </button>
              <input type="file" ref={fileInputRef} multiple accept="image/*" onChange={handleFileChange} className="hidden" />

              <button 
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    const event = new CustomEvent('toast', { detail: 'Tính năng Bày tỏ cảm xúc sẽ ra mắt ở Phase tiếp theo!' });
                    window.dispatchEvent(event);
                  }
                }}
                className="flex items-center space-x-1.5 text-amber-500 hover:bg-amber-50 px-3 py-1.5 rounded-xl transition text-xs font-bold cursor-pointer"
              >
                <span className="text-sm">😊</span>
                <span>Feeling</span>
              </button>

              <button 
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    const event = new CustomEvent('toast', { detail: 'Tính năng Đăng ký điểm đến (Check-in) sẽ ra mắt ở Phase tiếp theo!' });
                    window.dispatchEvent(event);
                  }
                }}
                className="flex items-center space-x-1.5 text-rose-500 hover:bg-rose-50 px-3 py-1.5 rounded-xl transition text-xs font-bold cursor-pointer"
              >
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Check in</span>
              </button>

              <button 
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    const event = new CustomEvent('toast', { detail: 'Tính năng Tạo cuộc bình chọn (Poll) sẽ ra mắt ở Phase tiếp theo!' });
                    window.dispatchEvent(event);
                  }
                }}
                className="flex items-center space-x-1.5 text-violet-500 hover:bg-violet-50 px-3 py-1.5 rounded-xl transition text-xs font-bold cursor-pointer"
              >
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Poll</span>
              </button>
            </div>
            
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting || (!content.trim() && files.length === 0)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-md shadow-indigo-500/10 hover-lift shrink-0"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span>Post</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePostCard;
