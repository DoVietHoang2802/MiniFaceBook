import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Image as ImageIcon,
  Loader2,
  X,
} from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { postService } from '../services/postService';
import type { PostResponse } from '../types/post.types';

interface CreatePostCardProps {
  onPostCreated: (post: PostResponse) => void;
  currentUser: any;
}

const MAX_RAW_FILE_BYTES = 20 * 1024 * 1024;
const MAX_FINAL_FILE_BYTES = 10 * 1024 * 1024;
const MAX_POST_IMAGE_BYTES = 30 * 1024 * 1024;
const MAX_POST_IMAGES = 10;
const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const formatBytes = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)}MB`;

const CreatePostCard: React.FC<CreatePostCardProps> = ({ onPostCreated, currentUser }) => {
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
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
    const selectedFiles = Array.from(event.target.files);
    const remainingSlots = MAX_POST_IMAGES - files.length;
    let totalBytes = files.reduce((total, file) => total + file.size, 0);
    let oversizedRawFiles = 0;
    let oversizedFinalFiles = 0;
    let unsupportedFiles = 0;
    let totalBudgetFiles = 0;
    setIsSubmitting(true);

    if (remainingSlots <= 0) {
      triggerToast(`Mỗi bài viết chỉ được đăng tối đa ${MAX_POST_IMAGES} ảnh.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setIsSubmitting(false);
      return;
    }

    for (const [index, file] of selectedFiles.slice(0, remainingSlots).entries()) {
      if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
        unsupportedFiles += 1;
        continue;
      }
      if (file.size > MAX_RAW_FILE_BYTES) {
        oversizedRawFiles += 1;
        continue;
      }

      let processedFile = file;
      if (file.type === 'image/gif') {
        // Preserve animation, while applying the same final server payload limit.
        processedFile = file;
      } else {
        const remainingFiles = selectedFiles.slice(index, remainingSlots).length;
        const availableBytes = Math.max(0, MAX_POST_IMAGE_BYTES - totalBytes);
        const targetSizeMB = Math.min(
          6,
          Math.max(1, availableBytes / Math.max(1, remainingFiles) / (1024 * 1024))
        );
        try {
          const compressedBlob = await imageCompression(file, {
            maxSizeMB: targetSizeMB,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
            fileType: 'image/webp',
          });
          processedFile = new File(
            [compressedBlob],
            file.name.replace(/\.[^/.]+$/, '.webp'),
            { type: 'image/webp', lastModified: Date.now() }
          );
        } catch (error) {
          console.error('Lỗi khi nén ảnh:', error);
        }
      }

      if (processedFile.size > MAX_FINAL_FILE_BYTES) {
        oversizedFinalFiles += 1;
        continue;
      }
      if (totalBytes + processedFile.size > MAX_POST_IMAGE_BYTES) {
        totalBudgetFiles += 1;
        continue;
      }
      totalBytes += processedFile.size;
      validFiles.push(processedFile);
    }

    setFiles((previousFiles) => [...previousFiles, ...validFiles]);
    setIsSubmitting(false);
    if (selectedFiles.length > remainingSlots) triggerToast(`Chỉ có thể thêm ${remainingSlots} ảnh nữa.`);
    if (unsupportedFiles > 0) triggerToast('Chỉ chấp nhận ảnh JPG, PNG, WEBP hoặc GIF.');
    if (oversizedRawFiles > 0) triggerToast('Có ảnh gốc vượt quá 20MB đã bị loại bỏ.');
    if (oversizedFinalFiles > 0) triggerToast('Có ảnh sau xử lý vượt quá 10MB đã bị loại bỏ.');
    if (totalBudgetFiles > 0) triggerToast('Tổng ảnh sau xử lý vượt quá 30MB; một số ảnh đã bị loại bỏ.');
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
      <section data-testid="create-post-card" className="mb-4 w-full rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm sm:mb-6 sm:rounded-2xl sm:p-3">
        <div className="flex items-center gap-2.5">
          {avatar}
          <button
            type="button"
            onClick={openComposer}
            className="min-h-10 flex-1 rounded-full bg-slate-100 px-4 text-left text-sm font-medium text-slate-400 transition hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            Bạn đang nghĩ gì thế?
          </button>
          <button
            type="button"
            onClick={() => {
              openComposer();
              window.setTimeout(() => fileInputRef.current?.click(), 0);
            }}
            aria-label="Thêm ảnh hoặc video"
            className="flex h-10 w-11 shrink-0 flex-col items-center justify-center rounded-xl text-emerald-600 transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            <ImageIcon className="h-5 w-5" />
            <span className="text-[10px] font-bold">Ảnh</span>
          </button>
        </div>
      </section>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
        title="Chọn hình ảnh để đăng"
      />

      {isExpanded && createPortal(
        <div className="fixed inset-0 z-[1000000] flex items-end bg-slate-950/45 backdrop-blur-[2px] sm:items-center sm:justify-center">
          <button
            type="button"
            aria-label="Đóng tạo bài viết"
            onClick={() => {
              if (!isSubmitting) {
                setIsExpanded(false);
              }
            }}
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
                onClick={() => {
                  if (!isSubmitting) {
                    setIsExpanded(false);
                  }
                }}
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
                <div className="mb-4">
                  <p className="mb-2 text-xs font-semibold text-slate-500">{files.length}/{MAX_POST_IMAGES} ảnh · {formatBytes(files.reduce((total, file) => total + file.size, 0))}/30MB</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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
                </div>
              )}

              <div className="rounded-2xl border border-slate-200 bg-white">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex min-h-12 w-full items-center gap-3 px-4 text-left text-sm font-bold text-emerald-600 hover:bg-emerald-50">
                  <ImageIcon className="h-5 w-5" /> Ảnh / Video
                </button>
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
