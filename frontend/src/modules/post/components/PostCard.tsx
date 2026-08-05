import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Share2, MoreHorizontal, ThumbsUp, Trash2, Globe, EyeOff } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import type { PostResponse, ReactionType } from '../types/post.types';
import { postService } from '../services/postService';
import { sseService } from '../../core/services/sseService';
import { REACTION_ICONS } from './reactionConfig';
import ReactionPicker from './ReactionPicker';
import PostDetailModal from './PostDetailModal';
import ReactionsModal from './ReactionsModal';
import { chatService } from '../../chat/services/chatService';
import type { ConversationResponse } from '../../chat/types/chat.types';
import { useReactionLongPress } from '../../../core/hooks/useReactionLongPress';

interface PostCardProps {
  post: PostResponse;
  currentUser: any;
  onPostDeleted?: (postId: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, currentUser, onPostDeleted }) => {
  const navigate = useNavigate();
  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} lúc ${hours}:${minutes}`;
    } catch {
      return 'Vừa xong';
    }
  };

  const [localPost, setLocalPost] = useState(post);
  const [isHoveringReaction, setIsHoveringReaction] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const [showSharePicker, setShowSharePicker] = useState(false);
  const [shareConversations, setShareConversations] = useState<ConversationResponse[]>([]);
  const [isLoadingShareConversations, setIsLoadingShareConversations] = useState(false);
  const [sendingToConversationId, setSendingToConversationId] = useState<string | null>(null);
  const reactionAreaRef = React.useRef<HTMLDivElement>(null);

  const deletePostMutation = useMutation({
    mutationFn: () => postService.deletePost(localPost.id),
    onSuccess: () => {
      if (onPostDeleted) {
        onPostDeleted(localPost.id);
      }
    },
    onError: (err: any) => {
      alert(`Lỗi khi xóa bài viết: ${err.response?.data?.message || err.message}`);
    }
  });

  const handleDeletePost = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bài viết này không?')) {
      deletePostMutation.mutate();
    }
  };

  React.useEffect(() => {
    setLocalPost(post);
    setIsContentExpanded(false);
  }, [post]);

  React.useEffect(() => {
    // SSE: subscribe to post updates via shared global stream
    const unsubscribe = sseService.subscribe<{
      postId: string;
      reactCount: number;
      commentCount: number;
      reactionsCount: Record<string, number>;
    }>('/api/events/post', (evt) => {
      if (evt.postId === post.id) {
        setLocalPost((prev) => ({
          ...prev,
          reactCount: evt.reactCount,
          commentCount: evt.commentCount,
          reactionsCount: evt.reactionsCount ?? prev.reactionsCount,
        }));
      }
    });
    return () => unsubscribe();
  }, [post.id]);

  React.useEffect(() => {
    if (!isHoveringReaction) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (reactionAreaRef.current && !reactionAreaRef.current.contains(event.target as Node)) {
        setIsHoveringReaction(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isHoveringReaction]);

  const openSharePicker = async () => {
    setIsLoadingShareConversations(true);
    setShowSharePicker(true);
    try {
      const page = await chatService.getConversations(0, 100);
      setShareConversations(page.content);
    } catch {
      alert('Không tải được danh sách cuộc trò chuyện.');
    } finally {
      setIsLoadingShareConversations(false);
    }
  };

  const handleShareToConversation = async (conversationId: string) => {
    setSendingToConversationId(conversationId);
    try {
      await chatService.sendPost(conversationId, localPost.id);
      setShowSharePicker(false);
    } catch {
      alert('Không thể chia sẻ bài viết.');
    } finally {
      setSendingToConversationId(null);
    }
  };

  const reactionMutation = useMutation({
    mutationFn: (type: ReactionType) => postService.reactToPost(localPost.id, { type }),
    onMutate: async (type) => {
      const previousPost = { ...localPost };
      const isRemoving = localPost.myReactionType === type;
      setLocalPost(prev => {
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
    }
  });

  const handleReact = (type: ReactionType) => {
    reactionMutation.mutate(type);
    setIsHoveringReaction(false);
  };

  const reactionLongPressHandlers = useReactionLongPress({
    onTap: () => handleReact('LIKE'),
    onLongPress: () => setIsHoveringReaction(true),
    onMouseClick: () => handleReact(localPost.myReactionType || 'LIKE'),
  });

  const [showReactionsModal, setShowReactionsModal] = useState(false);

  const adjustCommentCount = (delta: number) => {
    setLocalPost((prev) => ({
      ...prev,
      commentCount: Math.max(0, prev.commentCount + delta),
    }));
  };

  const topReactionTypes = Object.entries(localPost.reactionsCount || {})
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([type]) => type as ReactionType)
    .slice(0, 3);
  const hasLongContent = localPost.content.length > 280;
  const hasEngagement = localPost.reactCount > 0 || localPost.commentCount > 0 || (localPost.shareCount ?? 0) > 0;

  if (isHidden) {
    return (
      <div className="w-full rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-5 shadow-sm mb-4 sm:mb-6 flex items-center justify-between animate-fade-in-up">
        <div className="flex items-center space-x-3 text-slate-500 text-xs font-semibold">
          <EyeOff className="h-4.5 w-4.5 text-slate-400 shrink-0" />
          <span>Bài viết này đã được ẩn khỏi bảng tin của bạn.</span>
        </div>
        <button
          onClick={() => setIsHidden(false)}
          className="text-xs font-black text-violet-600 hover:text-violet-500 hover:underline transition cursor-pointer"
        >
          Hoàn tác
        </button>
      </div>
    );
  }

  return (
    <article data-testid="post-card" className="w-full rounded-xl sm:rounded-2xl border border-slate-200 bg-white shadow-sm mb-4 sm:mb-6 transition-all duration-300 hover:shadow-md animate-fade-in-up">
      <div className="p-3.5 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div 
            onClick={() => navigate(`/profile/${localPost.authorId}`)}
            className="flex items-center space-x-3 cursor-pointer group/author"
          >
            <div className="h-10 w-10 rounded-full border border-slate-200 overflow-hidden bg-slate-100 shadow-sm shrink-0">
              {localPost.authorAvatar ? (
                <img src={localPost.authorAvatar} alt={localPost.authorName} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-slate-400 font-bold bg-slate-50">
                  {localPost.authorName?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 leading-tight group-hover/author:text-violet-600 transition-colors">
                {localPost.authorName && localPost.authorName.includes('@') 
                  ? localPost.authorName.split('@')[0] 
                  : (localPost.authorName || 'Người dùng Hizo')}
              </h3>
              <div className="flex items-center text-[10px] text-slate-400 font-semibold space-x-1.5 mt-0.5">
                <span>{formatTime(localPost.createdAt)}</span>
                <span>•</span>
                <Globe className="h-3.5 w-3.5 text-slate-400" />
              </div>
            </div>
          </div>
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              title="Tùy chọn bài viết"
              className="touch-target flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition cursor-pointer"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
            {showMenu && (
              <div 
                className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-xl p-1 shadow-lg z-30 animate-fade-in"
                onMouseLeave={() => setShowMenu(false)}
              >
                {currentUser?.id === localPost.authorId ? (
                  <>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setIsDetailModalOpen(true);
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                    >
                      Xem bài viết
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        handleDeletePost();
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-rose-500 hover:bg-rose-50 rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Xóa bài viết</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setIsDetailModalOpen(true);
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                    >
                      Xem bài viết
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setIsHidden(true);
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      <EyeOff className="h-4 w-4 text-slate-400" />
                      <span>Ẩn bài viết</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {localPost.content && (
          <div className="mb-4">
            <p className={`whitespace-pre-wrap text-sm font-medium leading-relaxed text-slate-600 ${!isContentExpanded && hasLongContent ? 'line-clamp-5' : ''}`}>
              {localPost.content}
            </p>
            {hasLongContent && (
              <button
                type="button"
                onClick={() => setIsContentExpanded((value) => !value)}
                className="mt-1 min-h-8 text-xs font-black text-violet-600 transition hover:text-violet-500"
              >
                {isContentExpanded ? 'Thu gọn' : 'Xem thêm'}
              </button>
            )}
          </div>
        )}

        {localPost.imageUrls && localPost.imageUrls.length > 0 && (
          <div className={`grid gap-1 mb-4 rounded-xl overflow-hidden border border-slate-100 ${
            localPost.imageUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
          }`}>
            {localPost.imageUrls.slice(0, 4).map((url, idx) => {
              const isLast = idx === 3;
              const remainingCount = localPost.imageUrls!.length - 4;

              const isSingleImage = localPost.imageUrls!.length === 1;
              let itemClasses = 'relative aspect-square';
              if (isSingleImage) {
                itemClasses = 'relative w-full bg-slate-100';
              } else if (localPost.imageUrls!.length === 3 && idx === 0) {
                itemClasses = 'relative row-span-2 h-full w-full';
              }

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setIsDetailModalOpen(true)}
                  className={`${itemClasses} block cursor-pointer overflow-hidden`}
                  aria-label="Xem chi tiết bài viết"
                >
                  <img 
                    src={url} 
                    alt="Post image" 
                    loading="lazy"
                    className={isSingleImage
                      ? 'block max-h-[70dvh] w-full object-contain transition duration-500 hover:scale-[1.01]'
                      : 'absolute inset-0 h-full w-full object-cover transition duration-500 hover:scale-102'}
                  />

                  {isLast && remainingCount > 0 && (
                    <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center cursor-pointer hover:bg-slate-900/60 transition backdrop-blur-sm">
                      <span className="text-white text-3xl font-black font-outfit">+{remainingCount}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {hasEngagement && (
          <div className="flex items-center justify-between py-2 text-xs text-slate-500 font-medium">
            {localPost.reactCount > 0 ? (
              <button
                onClick={() => setShowReactionsModal(true)}
                className="flex items-center gap-1.5 hover:underline cursor-pointer"
              >
                <div className="flex items-center">
                  {topReactionTypes.map((type, idx) => (
                    <span
                      key={type}
                      className={`h-5 w-5 rounded-full bg-white border border-white flex items-center justify-center text-[13px] leading-none shadow-sm ${
                        idx === 0 ? 'ml-0' : '-ml-1.5'
                      } ${
                        idx === 0 ? 'z-[10]' : idx === 1 ? 'z-[9]' : 'z-[8]'
                      }`}
                    >
                      {REACTION_ICONS[type]?.emoji || '👍'}
                    </span>
                  ))}
                </div>
                <span className="ml-1">{localPost.reactCount}</span>
              </button>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-3">
              {localPost.commentCount > 0 && (
                <button
                  onClick={() => setIsDetailModalOpen(true)}
                  className="hover:underline cursor-pointer"
                >
                  {localPost.commentCount} bình luận
                </button>
              )}
              {(localPost.shareCount ?? 0) > 0 && (
                <span className="text-slate-400">{localPost.shareCount} chia sẻ</span>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-slate-100 pt-1.5 mt-1 gap-1">
          <div
            ref={reactionAreaRef}
            className="flex-1 flex justify-center relative"
            onPointerEnter={(event) => {
              if (event.pointerType === 'mouse') setIsHoveringReaction(true);
            }}
            onPointerLeave={(event) => {
              if (event.pointerType === 'mouse') setIsHoveringReaction(false);
            }}
          >
            {isHoveringReaction && (
              <div className="absolute bottom-full left-0 z-50 pb-2 md:left-1/2 md:-translate-x-1/2">
                <ReactionPicker onSelect={handleReact} />
              </div>
            )}

            <button
              {...reactionLongPressHandlers}
              aria-label="Thích bài viết. Nhấn giữ để chọn cảm xúc"
              className={`flex min-h-11 items-center space-x-1.5 sm:space-x-2 px-2 w-full rounded-xl transition-all cursor-pointer justify-center select-none touch-none ${localPost.myReactionType && REACTION_ICONS[localPost.myReactionType] ? `${REACTION_ICONS[localPost.myReactionType].color} ${REACTION_ICONS[localPost.myReactionType].bgColor} font-bold` : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
            >
              {localPost.myReactionType && REACTION_ICONS[localPost.myReactionType]
                ? <span className="text-[1.1rem] leading-none">{REACTION_ICONS[localPost.myReactionType].emoji}</span>
                : <ThumbsUp className="h-4 w-4" />
              }
              <span className="text-xs font-bold">
                {localPost.myReactionType && REACTION_ICONS[localPost.myReactionType]
                  ? REACTION_ICONS[localPost.myReactionType].label
                  : 'Thích'}
              </span>
            </button>
          </div>

          <button
            onClick={() => setIsDetailModalOpen(true)}
            className="flex min-h-11 items-center space-x-1.5 sm:space-x-2 px-2 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all cursor-pointer flex-1 justify-center"
          >
            <MessageCircle className="h-4.5 w-4.5" />
            <span className="text-xs font-bold">Bình luận</span>
          </button>

          <button
            type="button"
            onClick={() => void openSharePicker()}
            className="flex min-h-11 items-center space-x-1.5 sm:space-x-2 px-2 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all cursor-pointer flex-1 justify-center"
          >
            <Share2 className="h-4.5 w-4.5" />
            <span className="text-xs font-bold">Chia sẻ</span>
          </button>
        </div>

        {showReactionsModal && (
          <ReactionsModal postId={localPost.id} onClose={() => setShowReactionsModal(false)} />
        )}

        {showSharePicker && (
          <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/30 p-3 sm:items-center" onMouseDown={() => setShowSharePicker(false)}>
            <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl" role="dialog" aria-modal="true" aria-label="Chia sẻ bài viết">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <div>
                  <h2 className="text-sm font-black text-slate-800">Chia sẻ vào cuộc trò chuyện</h2>
                  <p className="mt-0.5 text-xs text-slate-400">Chọn một cuộc trò chuyện hiện có</p>
                </div>
                <button type="button" onClick={() => setShowSharePicker(false)} className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600" aria-label="Đóng">
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto p-2" onMouseDown={(event) => event.stopPropagation()}>
                {isLoadingShareConversations ? (
                  <p className="px-3 py-6 text-center text-xs font-medium text-slate-400">Đang tải cuộc trò chuyện...</p>
                ) : shareConversations.length === 0 ? (
                  <p className="px-3 py-6 text-center text-xs font-medium text-slate-400">Chưa có cuộc trò chuyện nào để chia sẻ.</p>
                ) : shareConversations.map((conversation) => {
                  const recipient = conversation.participants.find((participant) => participant.id !== currentUser?.id);
                  if (!recipient) return null;
                  const isSending = sendingToConversationId === conversation.id;
                  return (
                    <button
                      key={conversation.id}
                      type="button"
                      disabled={isSending}
                      onClick={() => void handleShareToConversation(conversation.id)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-violet-50 disabled:cursor-wait disabled:opacity-60"
                    >
                      <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-slate-100">
                        {recipient.avatar ? <img src={recipient.avatar} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center text-xs font-bold text-slate-500">{recipient.name.charAt(0).toUpperCase()}</span>}
                      </div>
                      <span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-700">{recipient.name}</span>
                      <span className="text-xs font-bold text-violet-600">{isSending ? 'Đang gửi' : 'Chia sẻ'}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {isDetailModalOpen && (
          <PostDetailModal
            post={localPost}
            currentUser={currentUser}
            onClose={() => setIsDetailModalOpen(false)}
            onCommentCountChange={adjustCommentCount}
            onPostUpdate={setLocalPost}
          />
        )}
      </div>
    </article>
  );
};

export default PostCard;
