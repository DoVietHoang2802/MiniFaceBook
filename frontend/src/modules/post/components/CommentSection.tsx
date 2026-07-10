import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, Loader2, MoreHorizontal, Send, Smile, Trash2, ChevronDown } from 'lucide-react';
import { postService } from '../services/postService';
import type { CommentResponse, ReactionType, CommentReactionEvent } from '../types/post.types';
import { webSocketService } from '../../chat/services/webSocketService';
import { sseService } from '../../core/services/sseService';
import ReactionPicker from './ReactionPicker';
import ReactionsModal from './ReactionsModal';
import { REACTION_ICONS } from './reactionConfig';

interface CommentSectionProps {
  postId: string;
  postAuthorId?: string;
  currentUser: any;
  onCommentCountChange?: (delta: number) => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({ postId, postAuthorId, currentUser, onCommentCountChange }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [reactionPickerFor, setReactionPickerFor] = useState<string | null>(null);
  const [showReactionsFor, setShowReactionsFor] = useState<string | null>(null);
  const [activeCommentMenu, setActiveCommentMenu] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const receivedCommentIds = useRef<Set<string>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => postService.getComments(postId, 0, 50),
    staleTime: 10000,
  });

  const comments = data?.data?.content || [];

  const [sortType, setSortType] = useState<'all' | 'relevant' | 'newest'>('all');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const getSortedComments = () => {
    const commentsCopy = [...comments];
    if (sortType === 'relevant') {
      // Phù hợp nhất: theo tổng số reactions giảm dần, sau đó theo ngày giảm dần
      return commentsCopy.sort((a, b) => {
        const aReacts = Object.values(a.reactionCounts || {}).reduce((sum, count) => sum + count, 0);
        const bReacts = Object.values(b.reactionCounts || {}).reduce((sum, count) => sum + count, 0);
        if (bReacts !== aReacts) {
          return bReacts - aReacts;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } else if (sortType === 'newest') {
      // Mới nhất: theo ngày giảm dần
      return commentsCopy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      // Tất cả bình luận: mặc định API (createdAt desc)
      return commentsCopy;
    }
  };

  const sortedComments = getSortedComments();

  // WebSocket subscription cho comment reactions realtime
  useEffect(() => {
    // Track subscriptions để cleanup
    const unsubscribes: (() => void)[] = [];

    // Subscribe cho mỗi comment đang hiển thị
    comments.forEach((comment: CommentResponse) => {
      const unsubscribe = webSocketService.subscribe<CommentReactionEvent>(
        `/topic/comment.${comment.id}`,
        (event) => {
          // Khi nhận reaction update, cập nhật reactionCounts của comment đó
          queryClient.setQueryData(['comments', postId], (old: any) => {
            if (!old?.data?.content) return old;
            return {
              ...old,
              data: {
                ...old.data,
                content: old.data.content.map((c: CommentResponse) => {
                  if (c.id !== event.commentId) return c;
                  return {
                    ...c,
                    reactionCounts: event.reactionCounts,
                  };
                })
              }
            };
          });
        }
      );
      unsubscribes.push(unsubscribe);
    });

    // Cleanup function
    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [comments, postId, queryClient]);

  // SSE subscription cho new comments realtime
  useEffect(() => {
    // Clear tracking when postId changes
    receivedCommentIds.current.clear();

    const unsubscribe = sseService.subscribe<CommentResponse>(
      '/api/events/comment',
      (newComment) => {
        // Filter events by current postId
        if (newComment.postId !== postId) return;

        if (newComment.deleted) {
          queryClient.setQueryData(['comments', postId], (old: any) => {
            if (!old?.data?.content) return old;

            const exists = old.data.content.some((c: CommentResponse) => c.id === newComment.id);
            if (!exists) return old;

            onCommentCountChange?.(-1);
            return {
              ...old,
              data: {
                ...old.data,
                content: old.data.content.filter((c: CommentResponse) => c.id !== newComment.id),
                totalElements: Math.max(0, old.data.totalElements - 1),
              }
            };
          });
          return;
        }

        // Deduplication: ignore if already added (from optimistic or previous SSE)
        if (receivedCommentIds.current.has(newComment.id)) {
          return;
        }
        receivedCommentIds.current.add(newComment.id);

        // Update TanStack Query cache
        queryClient.setQueryData(['comments', postId], (old: any) => {
          if (!old?.data?.content) return old;

          // Double-check duplicate (race condition with refetch)
          if (old.data.content.some((c: CommentResponse) => c.id === newComment.id)) {
            receivedCommentIds.current.delete(newComment.id);
            return old;
          }

          // Prepend new comment (newest first)
          return {
            ...old,
            data: {
              ...old.data,
              content: [newComment, ...old.data.content],
              totalElements: old.data.totalElements + 1,
            },
          };
        });
      }
    );

    return () => unsubscribe();
  }, [postId, queryClient]);

  const handleInput = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = scrollHeight > 120 ? '120px' : `${scrollHeight}px`;
    }
  };

  useEffect(() => {
    handleInput();
  }, [content]);

  const commentMutation = useMutation({
    mutationFn: (newContent: string) => postService.addComment(postId, newContent),
    onMutate: async (newContent) => {
      await queryClient.cancelQueries({ queryKey: ['comments', postId] });
      const previousComments = queryClient.getQueryData(['comments', postId]);

      const optimisticComment: CommentResponse = {
        id: `temp-${Date.now()}`,
        postId,
        authorId: currentUser?.id || 'me',
        authorName: currentUser?.name || 'Tôi',
        authorAvatar: currentUser?.avatar || null,
        content: newContent,
        imageUrl: null,
        createdAt: new Date().toISOString(),
        reactionCounts: {},
        myReaction: null,
      };

      queryClient.setQueryData(['comments', postId], (old: any) => {
        if (!old || !old.data) return { data: { content: [optimisticComment], totalElements: 1 } };
        return {
          ...old,
          data: {
            ...old.data,
            content: [optimisticComment, ...old.data.content],
            totalElements: old.data.totalElements + 1,
          }
        };
      });

      onCommentCountChange?.(1);
      return { previousComments };
    },
    onError: (err: any, _newContent, context) => {
      alert(`Lỗi khi bình luận: ${err.response?.data?.message || err.message}`);
      if (context?.previousComments) {
        queryClient.setQueryData(['comments', postId], context.previousComments);
      }
      onCommentCountChange?.(-1);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => postService.deleteComment(commentId),
    onSuccess: (_, commentId) => {
      queryClient.setQueryData(['comments', postId], (old: any) => {
        if (!old?.data?.content) return old;
        return {
          ...old,
          data: {
            ...old.data,
            content: old.data.content.filter((c: CommentResponse) => c.id !== commentId),
            totalElements: Math.max(0, old.data.totalElements - 1),
          }
        };
      });
      onCommentCountChange?.(-1);
    },
    onError: (err: any) => {
      alert(`Lỗi khi xóa bình luận: ${err.response?.data?.message || err.message}`);
    }
  });

  const handleDeleteComment = (commentId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bình luận này không?')) {
      deleteCommentMutation.mutate(commentId);
    }
  };

  const reactMutation = useMutation({
    mutationFn: ({ commentId, type }: { commentId: string; type: ReactionType }) => postService.reactToComment(commentId, { type }),
    onMutate: async ({ commentId, type }) => {
      await queryClient.cancelQueries({ queryKey: ['comments', postId] });
      const previousComments = queryClient.getQueryData(['comments', postId]);

      queryClient.setQueryData(['comments', postId], (old: any) => {
        if (!old?.data?.content) return old;
        return {
          ...old,
          data: {
            ...old.data,
            content: old.data.content.map((comment: CommentResponse) => {
              if (comment.id !== commentId) return comment;

              const nextCounts = { ...(comment.reactionCounts || {}) };
              const currentReaction = comment.myReaction;

              if (currentReaction) {
                const currentCount = nextCounts[currentReaction] || 0;
                if (currentCount <= 1) delete nextCounts[currentReaction];
                else nextCounts[currentReaction] = currentCount - 1;
              }

              const nextMyReaction = currentReaction === type ? null : type;
              if (nextMyReaction) {
                nextCounts[nextMyReaction] = (nextCounts[nextMyReaction] || 0) + 1;
              }

              return {
                ...comment,
                reactionCounts: nextCounts,
                myReaction: nextMyReaction,
              };
            })
          }
        };
      });

      return { previousComments };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(['comments', postId], context.previousComments);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    },
  });

  const handleSubmit = () => {
    if (!content.trim()) return;
    commentMutation.mutate(content.trim());
    setContent('');
    if (textareaRef.current) {
      textareaRef.current.style.height = '36px';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
    } catch {
      return 'Vừa xong';
    }
  };

  const getTopReactionTypes = (reactionCounts: Record<string, number>) => {
    return Object.entries(reactionCounts || {})
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([type]) => type as ReactionType)
      .slice(0, 3);
  };

  return (
    <div className="pt-3 mt-1 border-t border-slate-100 animate-fade-in-up">
      {/* Sort Selector Dropdown */}
      <div className="relative mb-4">
        <button
          onClick={() => setShowSortDropdown(!showSortDropdown)}
          className="flex items-center space-x-1 text-slate-500 hover:text-slate-800 text-xs font-bold transition cursor-pointer select-none"
        >
          <span>
            {sortType === 'all'
              ? 'Tất cả bình luận'
              : sortType === 'relevant'
              ? 'Phù hợp nhất'
              : 'Mới nhất'}
          </span>
          <ChevronDown className="h-3.5 w-3.5" />
        </button>

        {showSortDropdown && (
          <div
            className="absolute left-0 top-full mt-1.5 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 animate-fade-in"
            onMouseLeave={() => setShowSortDropdown(false)}
          >
            {[
              {
                id: 'all',
                title: 'Tất cả bình luận',
                desc: 'Hiển thị tất cả bình luận, bao gồm cả nội dung có thể là spam.',
              },
              {
                id: 'relevant',
                title: 'Phù hợp nhất',
                desc: 'Hiển thị bình luận của bạn bè và những bình luận có nhiều lượt tương tác nhất trước tiên.',
              },
              {
                id: 'newest',
                title: 'Mới nhất',
                desc: 'Hiển thị tất cả bình luận, mới nhất trước tiên.',
              },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => {
                  setSortType(opt.id as any);
                  setShowSortDropdown(false);
                }}
                className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer ${
                  sortType === opt.id ? 'bg-slate-50' : 'hover:bg-slate-50/50'
                }`}
              >
                <h4 className="text-xs font-bold text-slate-800">{opt.title}</h4>
                <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                  {opt.desc}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-start gap-2 mb-4">
        <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 mt-0.5">
          {currentUser?.avatar ? (
            <img src={currentUser.avatar} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-slate-400 font-bold text-xs bg-slate-50">
              {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
        </div>

        <div className="flex-1 relative flex items-end">
          <div className={`w-full flex items-end bg-slate-100/70 border rounded-2xl transition-all duration-200 ${
            isFocused ? 'border-blue-500/50 bg-white shadow-[0_0_0_4px_rgba(59,130,246,0.1)]' : 'border-transparent'
          }`}>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={handleKeyDown}
              placeholder="Viết bình luận..."
              className="w-full bg-transparent outline-none resize-none px-3 py-2 text-[0.9rem] text-slate-700 min-h-[36px] max-h-[120px] overflow-y-auto leading-relaxed"
              rows={1}
            />
            <div className="flex items-center px-2 py-1.5 shrink-0 space-x-1">
              <button title="Chọn biểu cảm" className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors">
                <Smile className="h-4.5 w-4.5" />
              </button>
              <button title="Đính kèm ảnh" className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors">
                <Camera className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>

          {content.trim().length > 0 && (
            <button
              onClick={handleSubmit}
              disabled={commentMutation.isPending}
              className="ml-2 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors shrink-0 shadow-sm"
            >
              {commentMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4 -ml-0.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 text-slate-400 animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {sortedComments.map((comment: CommentResponse) => {
            const topReactionTypes = getTopReactionTypes(comment.reactionCounts || {});
            const reactionTotal = Object.values(comment.reactionCounts || {}).reduce((sum, count) => sum + count, 0);
            const activeReaction = comment.myReaction ? REACTION_ICONS[comment.myReaction] : null;

            return (
              <div key={comment.id} className="flex gap-2 group animate-fade-in-up">
                <div 
                  onClick={() => navigate(`/profile/${comment.authorId}`)}
                  className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 mt-0.5 cursor-pointer hover:opacity-85 transition-opacity shadow-sm"
                >
                  {comment.authorAvatar ? (
                    <img src={comment.authorAvatar} alt={comment.authorName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-slate-400 font-bold text-xs bg-slate-50">
                      {comment.authorName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>

                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-start gap-2">
                    <div className="max-w-[90%] min-w-0">
                      <div className="bg-slate-100/80 px-3.5 py-2 rounded-2xl break-words">
                        <span 
                          onClick={() => navigate(`/profile/${comment.authorId}`)}
                          className="font-bold text-slate-800 text-[0.85rem] block leading-tight mb-0.5 cursor-pointer hover:text-violet-600 transition-colors"
                        >
                          {comment.authorName}
                        </span>
                        <span className="text-slate-700 text-[0.9rem] leading-snug whitespace-pre-wrap">
                          {comment.content}
                        </span>
                      </div>

                      {reactionTotal > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowReactionsFor(comment.id)}
                          className="mt-1 ml-2 inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-1.5 py-0.5 shadow-sm hover:bg-slate-50"
                        >
                          <div className="flex items-center">
                            {topReactionTypes.map((type, idx) => (
                              <span
                                key={type}
                                className={`h-4 w-4 rounded-full bg-white flex items-center justify-center text-[11px] leading-none ${
                                  idx === 0 ? 'ml-0' : '-ml-1'
                                } ${
                                  idx === 0 ? 'z-[10]' : idx === 1 ? 'z-[9]' : 'z-[8]'
                                }`}
                              >
                                {REACTION_ICONS[type]?.emoji || '👍'}
                              </span>
                            ))}
                          </div>
                          <span className="text-[10px] font-semibold text-slate-600">{reactionTotal}</span>
                        </button>
                      )}
                    </div>

                    <div className="relative">
                      <button 
                        onClick={() => setActiveCommentMenu(activeCommentMenu === comment.id ? null : comment.id)}
                        title="Tùy chọn bình luận" 
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all shrink-0 cursor-pointer"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                      {activeCommentMenu === comment.id && (
                        <div 
                          className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-xl p-1 shadow-lg z-30 animate-fade-in"
                          onMouseLeave={() => setActiveCommentMenu(null)}
                        >
                          {currentUser?.id === comment.authorId || currentUser?.id === postAuthorId ? (
                            <button
                              onClick={() => {
                                setActiveCommentMenu(null);
                                handleDeleteComment(comment.id);
                              }}
                              className="w-full flex items-center space-x-2 px-3 py-2 text-rose-500 hover:bg-rose-50 rounded-lg text-xs font-bold transition cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>Xóa bình luận</span>
                            </button>
                          ) : (
                            <div className="px-3 py-2 text-slate-400 text-xs font-semibold">
                              Không có quyền xóa
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 px-3 mt-1 relative flex-wrap">
                    <span className="text-[11px] text-slate-500">{formatTime(comment.createdAt)}</span>
                    <div
                      className="relative"
                      onMouseEnter={() => setReactionPickerFor(comment.id)}
                      onMouseLeave={() => setReactionPickerFor((prev) => (prev === comment.id ? null : prev))}
                    >
                      {reactionPickerFor === comment.id && (
                        <div className="absolute bottom-full left-0 z-30 pb-2">
                          <ReactionPicker
                            onSelect={(type) => {
                              reactMutation.mutate({ commentId: comment.id, type });
                              setReactionPickerFor(null);
                            }}
                          />
                        </div>
                      )}

                      <button
                        onClick={() => reactMutation.mutate({ commentId: comment.id, type: (comment.myReaction || 'LIKE') as ReactionType })}
                        className={`text-[11px] font-bold hover:underline ${activeReaction ? activeReaction.color : 'text-slate-500'}`}
                      >
                        {activeReaction?.label || 'Thích'}
                      </button>
                    </div>
                    <button className="text-[11px] font-bold text-slate-500 hover:underline">Phản hồi</button>
                  </div>
                </div>
              </div>
            );
          })}
          {comments.length === 0 && (
            <div className="text-center text-sm text-slate-400 py-2">
              Chưa có bình luận nào. Hãy là người đầu tiên!
            </div>
          )}
        </div>
      )}

      {showReactionsFor && (
        <ReactionsModal
          commentId={showReactionsFor}
          title="Cảm xúc bình luận"
          onClose={() => setShowReactionsFor(null)}
        />
      )}
    </div>
  );
};

export default CommentSection;
