import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Share2, MoreHorizontal, Clock, ThumbsUp, Trash2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import type { PostResponse, ReactionType } from '../types/post.types';
import { postService } from '../services/postService';
import { sseService } from '../../core/services/sseService';
import { REACTION_ICONS } from './reactionConfig';
import ReactionPicker from './ReactionPicker';
import PostDetailModal from './PostDetailModal';
import ReactionsModal from './ReactionsModal';

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
      return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}`;
    } catch {
      return 'Vừa xong';
    }
  };

  const [localPost, setLocalPost] = useState(post);
  const [isHoveringReaction, setIsHoveringReaction] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

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

  const reactionMutation = useMutation({
    mutationFn: (type: ReactionType) => postService.reactToPost(localPost.id, { type }),
    onMutate: async (type) => {
      const previousPost = { ...localPost };
      const isRemoving = localPost.myReactionType === type;
      setLocalPost(prev => ({
        ...prev,
        myReactionType: isRemoving ? null : type,
        reactCount: isRemoving ? prev.reactCount - 1 : (prev.myReactionType ? prev.reactCount : prev.reactCount + 1),
      }));
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

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm mb-6 transition-all duration-300 hover:shadow-md animate-fade-in-up">
      <div className="p-5">
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
              <h3 className="text-sm font-bold text-slate-800 leading-tight group-hover/author:text-violet-600 transition-colors">{localPost.authorName || 'Người dùng ẩn danh'}</h3>
              <div className="flex items-center text-[10px] text-slate-400 font-semibold space-x-1 mt-0.5">
                <Clock className="h-3 w-3 text-slate-400" />
                <span>{formatTime(localPost.createdAt)}</span>
              </div>
            </div>
          </div>
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              title="Tùy chọn bài viết"
              className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg p-1.5 transition cursor-pointer"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
            {showMenu && (
              <div 
                className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-xl p-1 shadow-lg z-30 animate-fade-in"
                onMouseLeave={() => setShowMenu(false)}
              >
                {currentUser?.id === localPost.authorId ? (
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
                ) : (
                  <div className="px-3 py-2 text-slate-400 text-xs font-semibold">
                    Không có quyền quản trị
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {localPost.content && (
          <p className="text-slate-600 text-sm leading-relaxed mb-4 whitespace-pre-wrap font-medium">
            {localPost.content}
          </p>
        )}

        {localPost.imageUrls && localPost.imageUrls.length > 0 && (
          <div className={`grid gap-1 mb-4 rounded-xl overflow-hidden border border-slate-100 ${
            localPost.imageUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
          }`}>
            {localPost.imageUrls.slice(0, 4).map((url, idx) => {
              const isLast = idx === 3;
              const remainingCount = localPost.imageUrls!.length - 4;

              let itemClasses = 'relative aspect-square';
              if (localPost.imageUrls!.length === 1) {
                itemClasses = 'relative max-h-[500px] w-full';
              } else if (localPost.imageUrls!.length === 3 && idx === 0) {
                itemClasses = 'relative row-span-2 h-full w-full';
              }

              return (
                <div key={idx} className={itemClasses}>
                  <img 
                    src={url} 
                    alt="Post image" 
                    className={`inset-0 h-full w-full object-cover hover:scale-102 transition duration-500 cursor-pointer ${localPost.imageUrls!.length === 1 ? 'relative' : 'absolute'}`} 
                  />

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

        {(localPost.reactCount > 0 || localPost.commentCount > 0) && (
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
              <span className="text-slate-400">{localPost.shareCount ?? 0} chia sẻ</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-slate-100 pt-1.5 mt-1 gap-1">
          <div
            className="flex-1 flex justify-center relative"
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
            onClick={() => setIsDetailModalOpen(true)}
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

        {showReactionsModal && (
          <ReactionsModal postId={localPost.id} onClose={() => setShowReactionsModal(false)} />
        )}

        {isDetailModalOpen && (
          <PostDetailModal
            post={localPost}
            currentUser={currentUser}
            onClose={() => setIsDetailModalOpen(false)}
            onCommentCountChange={adjustCommentCount}
          />
        )}
      </div>
    </div>
  );
};

export default PostCard;
