import React, { useState } from 'react';
import { MessageCircle, Share2, MoreHorizontal, Clock, ThumbsUp } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import type { PostResponse, ReactionType, PostCountEvent } from '../types/post.types';
import { postService } from '../services/postService';
import { webSocketService } from '../../chat/services/webSocketService';

const REACTION_ICONS: Record<string, { emoji: string; color: string; label: string; bgColor: string; activeColor: string }> = {
  LIKE: { emoji: '👍', color: 'text-blue-600', label: 'Thích', bgColor: 'bg-blue-100', activeColor: '#1877F2' },
  LOVE: { emoji: '❤️', color: 'text-rose-500', label: 'Yêu thích', bgColor: 'bg-rose-100', activeColor: '#F33E58' },
  HAHA: { emoji: '😂', color: 'text-yellow-500', label: 'Haha', bgColor: 'bg-yellow-100', activeColor: '#F7B928' },
  WOW: { emoji: '😮', color: 'text-orange-500', label: 'Wow', bgColor: 'bg-orange-100', activeColor: '#F7B928' },
  SAD: { emoji: '😢', color: 'text-amber-500', label: 'Buồn', bgColor: 'bg-amber-100', activeColor: '#F7B928' },
  ANGRY: { emoji: '😡', color: 'text-red-500', label: 'Phẫn nộ', bgColor: 'bg-red-100', activeColor: '#E9710F' },
};

import CommentSection from './CommentSection';
import ReactionsModal from './ReactionsModal';

interface PostCardProps {
  post: PostResponse;
  currentUser: any;
}

const PostCard: React.FC<PostCardProps> = ({ post, currentUser }) => {
  // Format thời gian hiển thị tương đối đơn giản
  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}`;
    } catch {
      return 'Vừa xong';
    }
  };

  const [localPost, setLocalPost] = useState(post);
  const [isHoveringReaction, setIsHoveringReaction] = useState(false);
  const [showComments, setShowComments] = useState(false);

  // Sync state if prop changes from parent
  React.useEffect(() => {
    setLocalPost(post);
  }, [post]);

  // Realtime số đếm like/comment (Phase 5): subscribe-on-mount đúng bài này, unmount tự hủy.
  // Chỉ cập nhật con số tuyệt đối từ server (không cộng dồn) → không lệch với Optimistic UI.
  React.useEffect(() => {
    const unsubscribe = webSocketService.subscribe<PostCountEvent>(
      `/topic/post.${post.id}`,
      (evt) => {
        setLocalPost((prev) => ({
          ...prev,
          reactCount: evt.reactCount,
          commentCount: evt.commentCount,
          reactionsCount: evt.reactionsCount ?? prev.reactionsCount,
        }));
      }
    );
    return () => unsubscribe();
  }, [post.id]);

  const reactionMutation = useMutation({
    mutationFn: (type: ReactionType) => postService.reactToPost(localPost.id, { type }),
    onMutate: async (type) => {
      // Lưu lại trạng thái cũ để lùi lại (rollback) nếu lỗi
      const previousPost = { ...localPost };

      // Cập nhật giao diện ngay lập tức (Optimistic)
      const isRemoving = localPost.myReactionType === type;
      setLocalPost(prev => ({
        ...prev,
        myReactionType: isRemoving ? null : type,
        reactCount: isRemoving ? prev.reactCount - 1 : (prev.myReactionType ? prev.reactCount : prev.reactCount + 1),
      }));

      return { previousPost };
    },
    onError: (_err, _newTodo, context: any) => {
      // Nếu server báo lỗi (vd 401, 500), lùi lại trạng thái cũ
      if (context?.previousPost) {
        setLocalPost(context.previousPost);
      }
    }
  });

  const handleReact = (type: ReactionType) => {
    reactionMutation.mutate(type);
    setIsHoveringReaction(false);
  };

  const [showReactionsModal, setShowReactionsModal] = useState(false);

  // Điều chỉnh số đếm bình luận tức thì khi thêm/lỗi (đồng bộ với CommentSection - chống lệch số 3/4).
  const adjustCommentCount = (delta: number) => {
    setLocalPost((prev) => ({
      ...prev,
      commentCount: Math.max(0, prev.commentCount + delta),
    }));
  };

  // Tính danh sách các loại emoji đang có (để hiển thị chồng lên nhau ở dòng thống kê)
  const topReactionTypes = Object.entries(localPost.reactionsCount || {})
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([type]) => type)
    .slice(0, 3);



  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm mb-6 transition-all duration-300 hover:shadow-md animate-fade-in-up">
      <div className="p-5">
        {/* Header: Author info & Time */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
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
              <h3 className="text-sm font-bold text-slate-800 leading-tight">{localPost.authorName || 'Người dùng ẩn danh'}</h3>
              <div className="flex items-center text-[10px] text-slate-400 font-semibold space-x-1 mt-0.5">
                <Clock className="h-3 w-3 text-slate-400" />
                <span>{formatTime(localPost.createdAt)}</span>
              </div>
            </div>
          </div>
          <button className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg p-1.5 transition cursor-pointer">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        {localPost.content && (
          <p className="text-slate-600 text-sm leading-relaxed mb-4 whitespace-pre-wrap font-medium">
            {localPost.content}
          </p>
        )}

        {/* Image Grid */}
        {localPost.imageUrls && localPost.imageUrls.length > 0 && (
          <div className={`grid gap-1 mb-4 rounded-xl overflow-hidden border border-slate-100 ${
            localPost.imageUrls.length === 1 ? 'grid-cols-1' : 
            'grid-cols-2'
          }`}>
            {localPost.imageUrls.slice(0, 4).map((url, idx) => {
              const isLast = idx === 3;
              const remainingCount = localPost.imageUrls!.length - 4;
              
              // Custom layout logic for 3 images (1 big left, 2 small right)
              let itemClasses = 'relative aspect-square';
              if (localPost.imageUrls!.length === 1) {
                itemClasses = 'relative max-h-[500px] w-full';
              } else if (localPost.imageUrls!.length === 3 && idx === 0) {
                itemClasses = 'relative row-span-2 h-full w-full';
              }

              return (
                <div key={idx} className={itemClasses}>
                  <img src={url} alt="Post image" className="absolute inset-0 h-full w-full object-cover hover:scale-102 transition duration-500 cursor-pointer" style={{ position: localPost.imageUrls!.length === 1 ? 'relative' : 'absolute' }} />
                  
                  {isLast && remainingCount > 0 && (
                    <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center cursor-pointer hover:bg-slate-900/60 transition backdrop-blur-sm">
                      <span className="text-white text-3xl font-black font-outfit">+{remainingCount}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Stats Bar: cụm emoji + số reactions (trái) | comments · shares (phải) - giống Facebook */}
        {(localPost.reactCount > 0 || localPost.commentCount > 0) && (
          <div className="flex items-center justify-between py-2 text-xs text-slate-500 font-medium">
            {/* Cụm emoji chồng + tổng số - bấm mở modal */}
            {localPost.reactCount > 0 ? (
              <button
                onClick={() => setShowReactionsModal(true)}
                className="flex items-center gap-1.5 hover:underline cursor-pointer"
              >
                <div className="flex items-center">
                  {topReactionTypes.map((type, idx) => (
                    <span
                      key={type}
                      className="h-5 w-5 rounded-full bg-white border border-white flex items-center justify-center text-[13px] leading-none shadow-sm"
                      style={{ marginLeft: idx === 0 ? 0 : '-6px', zIndex: 10 - idx }}
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

            {/* Comments · Shares */}
            <div className="flex items-center gap-3">
              {localPost.commentCount > 0 && (
                <button
                  onClick={() => setShowComments(!showComments)}
                  className="hover:underline cursor-pointer"
                >
                  {localPost.commentCount} bình luận
                </button>
              )}
              <span className="text-slate-400">{localPost.shareCount ?? 0} chia sẻ</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div
          className="flex items-center justify-between border-t border-slate-100 pt-1.5 mt-1 gap-1 relative"
          onMouseEnter={() => setIsHoveringReaction(true)}
          onMouseLeave={() => setIsHoveringReaction(false)}
        >
          {/* Reaction Hover Bar - centered over full action bar */}
          {isHoveringReaction && (
            <div className="absolute bottom-full left-0 z-50 pb-2">
              <div 
                className="bg-white border border-slate-200 shadow-xl rounded-full px-2 py-1.5 flex gap-1 animate-pop-in"
                style={{ fontSize: '0.9rem' }}
              >
                {(Object.keys(REACTION_ICONS) as ReactionType[]).map((type) => {
                  const conf = REACTION_ICONS[type];
                  return (
                    <button 
                      key={type}
                      onClick={() => handleReact(type)}
                      title={conf.label}
                      className="relative flex items-center justify-center cursor-pointer group/icon p-1"
                    >
                      <span
                        className={`text-[2em] leading-none select-none transition-all duration-200 hover-react-${type}`}
                        style={{ display: 'block', lineHeight: 1 }}
                      >
                        {conf.emoji}
                      </span>
                      <span className="absolute -top-9 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[11px] font-bold px-2 py-0.5 rounded-full opacity-0 group-hover/icon:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20">
                        {conf.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Like button - chỉ icon + chữ, KHÔNG có số */}
          <div className="flex-1 flex justify-center">
            <button 
              onClick={() => handleReact(localPost.myReactionType || 'LIKE')}
              className={`flex items-center space-x-2 p-2 w-full rounded-xl transition-all cursor-pointer justify-center ${localPost.myReactionType && REACTION_ICONS[localPost.myReactionType] ? `${REACTION_ICONS[localPost.myReactionType].color} ${REACTION_ICONS[localPost.myReactionType].bgColor} font-bold` : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
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
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-2 p-2 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all cursor-pointer flex-1 justify-center"
          >
            <MessageCircle className="h-4.5 w-4.5" />
            <span className="text-xs font-bold">Bình luận</span>
          </button>
          
          <button className="flex items-center space-x-2 p-2 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all cursor-pointer flex-1 justify-center">
            <Share2 className="h-4.5 w-4.5" />
            <span className="text-xs font-bold">Chia sẻ</span>
          </button>
        </div>

        {/* Modal hiển thị ai đã thả cảm xúc */}
        {showReactionsModal && (
          <ReactionsModal postId={localPost.id} onClose={() => setShowReactionsModal(false)} />
        )}

        {/* Comment Section Placeholder */}
        {showComments && (
          <CommentSection postId={localPost.id} currentUser={currentUser} onCommentCountChange={adjustCommentCount} />
        )}
      </div>
    </div>
  );
};

export default PostCard;
