import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, Clock, ThumbsUp, MessageCircle, Share2 } from 'lucide-react';
import type { PostResponse, ReactionType } from '../types/post.types';
import { REACTION_ICONS } from './reactionConfig';
import ReactionPicker from './ReactionPicker';
import CommentSection from './CommentSection';
import ReactionsModal from './ReactionsModal';
import { postService } from '../services/postService';
import { useMutation } from '@tanstack/react-query';

interface PostDetailModalProps {
  post: PostResponse;
  currentUser: any;
  onClose: () => void;
  onCommentCountChange?: (delta: number) => void;
  onPostUpdate?: (updatedPost: PostResponse) => void;
}

const PostDetailModal: React.FC<PostDetailModalProps> = ({
  post,
  currentUser,
  onClose,
  onCommentCountChange,
  onPostUpdate,
}) => {
  const [localPost, setLocalPost] = useState(post);

  useEffect(() => {
    onPostUpdate?.(localPost);
  }, [localPost, onPostUpdate]);

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      const openModals = document.querySelectorAll('.fixed.inset-0');
      if (openModals.length <= 1) {
        document.body.style.overflow = '';
      }
    };
  }, []);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const [currentImgIdx, setCurrentImgIdx] = useState(0);
  const [isHoveringReaction, setIsHoveringReaction] = useState(false);
  const [showReactionsModal, setShowReactionsModal] = useState(false);

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
    } catch {
      return 'Vừa xong';
    }
  };

  const reactionMutation = useMutation({
    mutationFn: (type: ReactionType) => postService.reactToPost(localPost.id, { type }),
    onMutate: async (type) => {
      const previousPost = { ...localPost };
      const isRemoving = localPost.myReactionType === type;
      setLocalPost((prev) => {
        const newReactionsCount = { ...(prev.reactionsCount || {}) };
        
        if (prev.myReactionType) {
          const prevCount = newReactionsCount[prev.myReactionType] || 0;
          newReactionsCount[prev.myReactionType] = Math.max(0, prevCount - 1);
        }

        if (!isRemoving) {
          const newCount = newReactionsCount[type] || 0;
          newReactionsCount[type] = newCount + 1;
        }

        return {
          ...prev,
          myReactionType: isRemoving ? null : type,
          reactCount: isRemoving ? prev.reactCount - 1 : (prev.myReactionType ? prev.reactCount : prev.reactCount + 1),
          reactionsCount: newReactionsCount,
        };
      });
      return { previousPost };
    },
    onError: (_err, _newTodo, context: any) => {
      if (context?.previousPost) {
        setLocalPost(context.previousPost);
      }
    },
  });

  const handleReact = (type: ReactionType) => {
    reactionMutation.mutate(type);
    setIsHoveringReaction(false);
  };

  const hasImages = localPost.imageUrls && localPost.imageUrls.length > 0;

  const topReactionTypes = Object.entries(localPost.reactionsCount || {})
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([type]) => type as ReactionType)
    .slice(0, 3);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (localPost.imageUrls) {
      setCurrentImgIdx((prev) => (prev + 1) % localPost.imageUrls.length);
    }
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (localPost.imageUrls) {
      setCurrentImgIdx((prev) => (prev - 1 + localPost.imageUrls.length) % localPost.imageUrls.length);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalJSX = (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[99999] bg-slate-950/50 backdrop-blur-[6px] flex items-center justify-center p-0 md:p-6 animate-fade-in"
    >
      <div
        className="bg-white md:rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row w-full h-full md:w-[90vw] md:max-w-6xl md:h-[90vh] animate-scale-up"
      >
        {/* LEFT PANEL: Responsive Image Viewer or Stylized Light Card */}
        {hasImages ? (
          <div className="flex-1 bg-slate-950 flex items-center justify-center relative select-none h-[40vh] md:h-full group">
            <img
              src={localPost.imageUrls[currentImgIdx]}
              alt={`Post image ${currentImgIdx + 1}`}
              className="max-h-full max-w-full object-contain"
            />

            {/* Close button for mobile */}
            <button
              onClick={onClose}
              title="Đóng"
              aria-label="Đóng"
              className="absolute top-4 left-4 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-all cursor-pointer z-10 md:hidden"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Slideshow Arrows */}
            {localPost.imageUrls.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  title="Ảnh trước"
                  aria-label="Ảnh trước"
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-all cursor-pointer opacity-100 md:opacity-0 md:group-hover:opacity-100"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={nextImage}
                  title="Ảnh tiếp theo"
                  aria-label="Ảnh tiếp theo"
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-all cursor-pointer opacity-100 md:opacity-0 md:group-hover:opacity-100"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>

                {/* Dots indicator */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-1.5 z-10">
                  {localPost.imageUrls.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-2 w-2 rounded-full transition-all ${
                        idx === currentImgIdx ? 'bg-white w-4' : 'bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          /* Stylized minimal light text block for posts without photos (Only visible on Desktop/Laptop) */
          <div className="hidden md:flex flex-1 bg-[#F4F0FD] flex-col items-center justify-center p-12 text-center relative select-none h-full text-[#3F2E60] border-r border-slate-100 min-h-[300px]">
            {/* Subtle quotes decoration */}
            <span className="text-7xl text-[#DDD0FA] font-serif absolute top-12 left-12 select-none pointer-events-none">“</span>

            <p className="text-xl md:text-2xl font-bold font-outfit max-w-lg leading-relaxed px-6 z-10 italic">
              {localPost.content}
            </p>

            <span className="text-7xl text-[#DDD0FA] font-serif absolute bottom-12 right-12 select-none pointer-events-none">”</span>
          </div>
        )}

        {/* RIGHT PANEL: Details & Comments (Fixed width to prevent flex squishing) */}
        <div className="w-full md:w-[400px] lg:w-[440px] shrink-0 bg-white flex flex-col h-[60vh] md:h-full border-l border-slate-100">
          {/* Header of details pane */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 rounded-full border border-slate-200 overflow-hidden bg-slate-100 shadow-sm shrink-0">
                {localPost.authorAvatar ? (
                  <img
                    src={localPost.authorAvatar}
                    alt={localPost.authorName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-slate-400 font-bold bg-slate-50 text-sm">
                    {localPost.authorName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800 leading-tight">
                  {localPost.authorName || 'Người dùng ẩn danh'}
                </h3>
                <div className="flex items-center text-[9px] text-slate-400 font-semibold space-x-1 mt-0.5">
                  <Clock className="h-2.5 w-2.5" />
                  <span>{formatTime(localPost.createdAt)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              title="Đóng"
              aria-label="Đóng"
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Pinned Post Info & Actions (Non-scrollable, overflow visible) */}
          <div className="p-4 pb-2 border-b border-slate-100 shrink-0 space-y-3 bg-white z-10">
            {localPost.content && (
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap font-medium pb-1">
                {localPost.content}
              </p>
            )}

            {/* Stats */}
            {(localPost.reactCount > 0 || localPost.commentCount > 0) && (
              <div className="flex items-center justify-between py-2 border-y border-slate-100 text-[11px] text-slate-500 font-medium">
                {localPost.reactCount > 0 ? (
                  <button
                    onClick={() => setShowReactionsModal(true)}
                    className="flex items-center gap-1.5 hover:underline cursor-pointer"
                  >
                    <div className="flex items-center">
                      {topReactionTypes.map((type, idx) => (
                        <span
                          key={type}
                          className={`h-4.5 w-4.5 rounded-full bg-white border border-white flex items-center justify-center text-[11px] leading-none shadow-sm ${
                            idx === 0 ? 'ml-0' : '-ml-1.5'
                          } ${
                            idx === 0 ? 'z-[10]' : idx === 1 ? 'z-[9]' : 'z-[8]'
                          }`}
                        >
                          {REACTION_ICONS[type]?.emoji || '👍'}
                        </span>
                      ))}
                    </div>
                    <span>{localPost.reactCount}</span>
                  </button>
                ) : (
                  <span />
                )}

                <div className="flex items-center gap-2">
                  <span>{localPost.commentCount} bình luận</span>
                  <span className="text-slate-300">•</span>
                  <span>{localPost.shareCount ?? 0} chia sẻ</span>
                </div>
              </div>
            )}

            {/* Actions panel */}
            <div className="flex items-center justify-between gap-1 pt-1">
              <div
                className="relative"
                onMouseEnter={() => setIsHoveringReaction(true)}
                onMouseLeave={() => setIsHoveringReaction(false)}
              >
                {isHoveringReaction && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 z-50 pb-2">
                    <ReactionPicker onSelect={handleReact} />
                  </div>
                )}

                <button
                  onClick={() => handleReact(localPost.myReactionType || 'LIKE')}
                  className={`flex items-center space-x-1.5 py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
                    localPost.myReactionType && REACTION_ICONS[localPost.myReactionType]
                      ? `${REACTION_ICONS[localPost.myReactionType].color} ${
                          REACTION_ICONS[localPost.myReactionType].bgColor
                        } font-bold`
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {localPost.myReactionType && REACTION_ICONS[localPost.myReactionType] ? (
                    <span className="text-sm">{REACTION_ICONS[localPost.myReactionType].emoji}</span>
                  ) : (
                    <ThumbsUp className="h-3.5 w-3.5" />
                  )}
                  <span className="text-[11px] font-bold">
                    {localPost.myReactionType && REACTION_ICONS[localPost.myReactionType]
                      ? REACTION_ICONS[localPost.myReactionType].label
                      : 'Thích'}
                  </span>
                </button>
              </div>

              <button className="flex items-center space-x-1.5 py-1.5 px-3 rounded-lg text-slate-500 hover:bg-slate-50 transition-all cursor-pointer">
                <MessageCircle className="h-3.5 w-3.5" />
                <span className="text-[11px] font-bold">Bình luận</span>
              </button>

              <button className="flex items-center space-x-1.5 py-1.5 px-3 rounded-lg text-slate-500 hover:bg-slate-50 transition-all cursor-pointer">
                <Share2 className="h-3.5 w-3.5" />
                <span className="text-[11px] font-bold">Chia sẻ</span>
              </button>
            </div>
          </div>

          {/* Scrollable comments container */}
          <div className="flex-1 overflow-y-auto p-4 min-h-0">
            {/* Comments list integration */}
            <CommentSection
              postId={localPost.id}
              postAuthorId={localPost.authorId}
              currentUser={currentUser}
              onCommentCountChange={(delta) => {
                setLocalPost((prev) => ({
                  ...prev,
                  commentCount: Math.max(0, prev.commentCount + delta),
                }));
                onCommentCountChange?.(delta);
              }}
            />
          </div>
        </div>
      </div>
      {showReactionsModal && (
        <ReactionsModal
          postId={localPost.id}
          onClose={() => setShowReactionsModal(false)}
        />
      )}
    </div>
  );

  return createPortal(modalJSX, document.body);
};

export default PostDetailModal;
