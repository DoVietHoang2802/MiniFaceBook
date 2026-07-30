import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  BarChart3,
  Image as ImageIcon,
  Loader2,
  MapPin,
  MoreHorizontal,
  Smile,
  X,
} from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { postService } from '../services/postService';
import type { PostResponse } from '../types/post.types';

interface CreatePostCardProps {
  onPostCreated: (post: PostResponse) => void;
  currentUser: any;
}

const MAX_SIZE = 20 * 1024 * 1024;

const CreatePostCard: React.FC<CreatePostCardProps> = ({ onPostCreated, currentUser }) => {
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrls = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);
  const canSubmit = content.trim().length > 0 || files.length > 0;

  useEffect(() => () => {
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
  }, [previewUrls]);

  useEffect(() => {
    if (!isExpanded) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) {
        setIsExpanded(false);
        setShowMoreActions(false);
      }
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isExpanded, isSubmitting]);

  const triggerToast = (message: string) => {
    window.dispatchEvent(new CustomEvent('toast', { detail: message }));
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;

    const validFiles: File[] = [];
    let hasOversizedFile = false;
    setIsSubmitting(true);

    for (const file of Array.from(event.target.files)) {
      if (file.size > MAX_SIZE) {
        hasOversizedFile = true;
        continue;
      }

      if (file.type === 'image/gif') {
        validFiles.push(file);
        continue;
      }

      try {
        const compressedBlob = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          fileType: 'image/webp',
        });
        const compressedFile = new File(
          [compressedBlob],
          file.name.replace(/\.[^/.]+$/, '.webp'),
          { type: 'image/webp', lastModified: Date.now() }
        );
        validFiles.push(compressedFile);
      } catch (error) {
        console.error('Lỗi khi nén ảnh:', error);
        validFiles.push(file);
      }
    }

    setFiles((previousFiles) => [...previousFiles, ...validFiles]);
    setIsSubmitting(false);
    if (hasOversizedFile) triggerToast('Có ảnh vượt quá 20MB đã bị loại bỏ!');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      const response = await postService.createPost(content, files);
      if (response.data) onPostCreated(response.data);
      setContent('');
      setFiles([]);
      setIsExpanded(false);
      setShowMoreActions(false);
    } catch (error) {
      console.error('Lỗi khi đăng bài:', error);
      triggerToast('Không thể đăng bài lúc này. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const avatar = (
    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100 shadow-sm">
      {currentUser?.avatar ? (
        <img src={currentUser.avatar} alt="Avatar" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-slate-50 font-bold text-slate-400">
          {(currentUser?.name || currentUser?.email || 'U').charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );

  const openComposer = () => setIsExpanded(true);

  return (
    <>
      <section data-testid="create-post-card" className="mb-4 w-full rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm sm:mb-6 sm:rounded-2xl sm:p-5">
        <div className="flex items-center gap-2.5 sm:gap-4">
          {avatar}
          <button
            type="button"
            onClick={openComposer}
            className="min-h-11 flex-1 rounded-full bg-slate-100 px-4 text-left text-base font-medium text-slate-400 transition hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 sm:text-sm"
          >
            Bạn đang nghĩ gì thế?
          </button>
        </div>
        <div className="mt-3 grid grid-cols-2 border-t border-slate-100 pt-2">
          <button
            type="button"
            onClick={() => {
              openComposer();
              window.setTimeout(() => fileInputRef.current?.click(), 0);
            }}
            className="min-h-11 flex items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-bold text-emerald-600 transition hover:bg-emerald-50"
          >
            <ImageIcon className="h-4 w-4" />
            Ảnh / Video
          </button>
          <button
            type="button"
            onClick={openComposer}
            className="min-h-11 flex items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-bold text-amber-500 transition hover:bg-amber-50"
          >
            <Smile className="h-4 w-4" />
            Cảm xúc
          </button>
        </div>
      </section>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        title="Chọn hình ảnh để đăng"
      />

      {isExpanded && createPortal(
        <div className="fixed inset-0 z-[1000000] flex items-end bg-slate-950/45 backdrop-blur-[2px] sm:items-center sm:justify-center">
          <button
            type="button"
            aria-label="Đóng tạo bài viết"
            onClick={() => !isSubmitting && setIsExpanded(false)}
            className="absolute inset-0 cursor-default"
          />
          <section
            data-testid="create-post-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-post-title"
            className="relative flex max-h-[100dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[85dvh] sm:max-w-xl sm:rounded-3xl"
          >
            <header className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3">
              <button
                type="button"
                aria-label="Đóng tạo bài viết"
                onClick={() => !isSubmitting && setIsExpanded(false)}
                className="flex h-11 w-11 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
              <h2 id="create-post-title" className="font-outfit text-base font-black text-slate-900">Tạo bài viết</h2>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !canSubmit}
                className="min-h-11 rounded-xl px-3 text-sm font-black text-violet-600 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Đăng'}
              </button>
            </header>

            <div className="overflow-y-auto px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="mb-4 flex items-center gap-3">
                {avatar}
                <div>
                  <p className="text-sm font-black text-slate-800">{currentUser?.name || currentUser?.email?.split('@')[0] || 'Người dùng Hizo'}</p>
                  <span className="inline-flex rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-500">Công khai</span>
                </div>
              </div>

              <textarea
                autoFocus
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Bạn đang nghĩ gì thế?"
                className="min-h-40 w-full resize-none border-0 bg-transparent text-base font-medium leading-relaxed text-slate-800 outline-none placeholder:text-slate-400"
                disabled={isSubmitting}
              />

              {previewUrls.length > 0 && (
                <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {previewUrls.map((url, index) => (
                    <div key={url} className="relative aspect-square overflow-hidden rounded-xl border border-slate-200">
                      <img src={url} alt={`Ảnh xem trước ${index + 1}`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setFiles((previousFiles) => previousFiles.filter((_, fileIndex) => fileIndex !== index))}
                        aria-label={`Xóa ảnh ${index + 1}`}
                        className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-bl-2xl bg-slate-950/75 text-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex min-h-12 w-full items-center gap-3 px-4 text-left text-sm font-bold text-emerald-600 hover:bg-emerald-50">
                  <ImageIcon className="h-5 w-5" /> Ảnh / Video
                </button>
                <button type="button" onClick={() => triggerToast('Tính năng Bày tỏ cảm xúc sẽ ra mắt ở Phase tiếp theo!')} className="flex min-h-12 w-full items-center gap-3 border-t border-slate-100 px-4 text-left text-sm font-bold text-amber-500 hover:bg-amber-50">
                  <Smile className="h-5 w-5" /> Cảm xúc
                </button>
                <div className="relative border-t border-slate-100">
                  <button type="button" onClick={() => setShowMoreActions((value) => !value)} aria-expanded={showMoreActions} className="flex min-h-12 w-full items-center gap-3 px-4 text-left text-sm font-bold text-slate-600 hover:bg-slate-50">
                    <MoreHorizontal className="h-5 w-5" /> Thêm vào bài viết
                  </button>
                  {showMoreActions && (
                    <div className="grid grid-cols-2 gap-1 border-t border-slate-100 bg-slate-50 p-2">
                      <button type="button" onClick={() => triggerToast('Tính năng Đăng ký điểm đến sẽ ra mắt ở Phase tiếp theo!')} className="min-h-11 rounded-xl px-3 text-left text-xs font-bold text-rose-500 hover:bg-rose-50"><MapPin className="mr-1.5 inline h-4 w-4" />Check-in</button>
                      <button type="button" onClick={() => triggerToast('Tính năng Tạo cuộc bình chọn sẽ ra mắt ở Phase tiếp theo!')} className="min-h-11 rounded-xl px-3 text-left text-xs font-bold text-violet-600 hover:bg-violet-50"><BarChart3 className="mr-1.5 inline h-4 w-4" />Khảo sát</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>,
        document.body
      )}
    </>
  );
};

export default CreatePostCard;
