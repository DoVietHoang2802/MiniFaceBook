import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, Smile, Send, Loader2, MoreHorizontal } from 'lucide-react';
import { postService } from '../services/postService';
import type { CommentResponse } from '../types/post.types';

interface CommentSectionProps {
  postId: string;
  currentUser: any;
  /** Báo cho PostCard điều chỉnh số đếm bình luận (optimistic). +1 khi thêm, -1 khi lỗi. */
  onCommentCountChange?: (delta: number) => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({ postId, currentUser, onCommentCountChange }) => {
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch bình luận
  const { data, isLoading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => postService.getComments(postId, 0, 50),
    staleTime: 10000,
  });

  const comments = data?.data?.content || [];

  // Tự động giãn nở ô nhập text
  const handleInput = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto'; // Reset để tính lại
      const scrollHeight = textarea.scrollHeight;
      // Max height khoảng 5-6 dòng (~120px)
      textarea.style.height = scrollHeight > 120 ? '120px' : `${scrollHeight}px`;
    }
  };

  useEffect(() => {
    handleInput();
  }, [content]);

  // Optimistic UI Mutation
  const commentMutation = useMutation({
    mutationFn: (newContent: string) => postService.addComment(postId, newContent),
    onMutate: async (newContent) => {
      // Dừng refetch đang dở dang
      await queryClient.cancelQueries({ queryKey: ['comments', postId] });

      // Lấy snapshot hiện tại
      const previousComments = queryClient.getQueryData(['comments', postId]);

      // Tạo comment fake với Optimistic UI
      const optimisticComment: CommentResponse = {
        id: `temp-${Date.now()}`,
        postId,
        authorId: currentUser?.id || 'me',
        authorName: currentUser?.name || 'Tôi',
        authorAvatar: currentUser?.avatar || null,
        content: newContent,
        imageUrl: null,
        createdAt: new Date().toISOString(),
      };

      // Chèn vào cache
      queryClient.setQueryData(['comments', postId], (old: any) => {
        if (!old || !old.data) return { data: { content: [optimisticComment], totalElements: 1 } };
        return {
          ...old,
          data: {
            ...old.data,
            content: [...old.data.content, optimisticComment],
            totalElements: old.data.totalElements + 1,
          }
        };
      });

      // Cập nhật số đếm trên PostCard ngay (optimistic)
      onCommentCountChange?.(1);

      return { previousComments };
    },
    onError: (err: any, _newContent, context) => {
      alert(`Lỗi khi bình luận: ${err.response?.data?.message || err.message}`);
      // Nếu lỗi thì rollback lại snapshot + hoàn số đếm
      if (context?.previousComments) {
        queryClient.setQueryData(['comments', postId], context.previousComments);
      }
      onCommentCountChange?.(-1);
    },
    onSettled: () => {
      // Bất kể thành công hay thất bại, gọi lại API để đồng bộ dữ liệu thật
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    },
  });

  const handleSubmit = () => {
    if (!content.trim()) return;
    commentMutation.mutate(content.trim());
    setContent('');
    // Thu nhỏ lại ô nhập
    if (textareaRef.current) {
      textareaRef.current.style.height = '36px';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Ngăn xuống dòng
      handleSubmit();
    }
  };

  // Format thời gian hiển thị tương đối
  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}`;
    } catch {
      return 'Vừa xong';
    }
  };

  return (
    <div className="pt-3 mt-1 border-t border-slate-100 animate-fade-in-up">
      {/* KHUNG NHẬP BÌNH LUẬN */}
      <div className="flex items-start gap-2 mb-4">
        {/* Avatar */}
        <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 mt-0.5">
          {currentUser?.avatar ? (
            <img src={currentUser.avatar} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-slate-400 font-bold text-xs bg-slate-50">
              {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
        </div>

        {/* Khung Input Auto-resize */}
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
            {/* Icons Upload & Emoji */}
            <div className="flex items-center px-2 py-1.5 shrink-0 space-x-1">
              <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors">
                <Smile className="h-4.5 w-4.5" />
              </button>
              <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors">
                <Camera className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
          
          {/* Nút Send chỉ hiện khi có text */}
          {content.trim().length > 0 && (
            <button 
              onClick={handleSubmit}
              disabled={commentMutation.isPending}
              className="ml-2 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors shrink-0 shadow-sm"
            >
              {commentMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4 -ml-0.5" /> // Trừ hao ml xíu cho icon cân giữa
              )}
            </button>
          )}
        </div>
      </div>

      {/* DANH SÁCH BÌNH LUẬN (FLAT LIST) */}
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 text-slate-400 animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment: CommentResponse) => (
            <div key={comment.id} className="flex gap-2 group animate-fade-in-up">
              {/* Avatar người comment */}
              <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 mt-0.5">
                {comment.authorAvatar ? (
                  <img src={comment.authorAvatar} alt={comment.authorName} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-slate-400 font-bold text-xs bg-slate-50">
                    {comment.authorName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </div>

              {/* Nội dung comment */}
              <div className="flex flex-col flex-1">
                <div className="flex items-center gap-2">
                  <div className="bg-slate-100/80 px-3.5 py-2 rounded-2xl max-w-[90%]">
                    <span className="font-bold text-slate-800 text-[0.85rem] block leading-tight mb-0.5">
                      {comment.authorName}
                    </span>
                    <span className="text-slate-700 text-[0.9rem] leading-snug whitespace-pre-wrap">
                      {comment.content}
                    </span>
                  </div>
                  {/* Dấu 3 chấm (More) - Hiện khi hover */}
                  <button className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>

                {/* Actions (Like, Reply) & Time */}
                <div className="flex items-center gap-3 px-3 mt-1">
                  <span className="text-[11px] text-slate-500">{formatTime(comment.createdAt)}</span>
                  <button className="text-[11px] font-bold text-slate-500 hover:underline">Thích</button>
                  <button className="text-[11px] font-bold text-slate-500 hover:underline">Phản hồi</button>
                </div>
              </div>
            </div>
          ))}
          {comments.length === 0 && (
            <div className="text-center text-sm text-slate-400 py-2">
              Chưa có bình luận nào. Hãy là người đầu tiên!
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommentSection;
