import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X, Loader2 } from 'lucide-react';
import { postService } from '../services/postService';
import type { ReactionUserResponse, ReactionType } from '../types/post.types';

const REACTION_EMOJI: Record<ReactionType, { emoji: string; label: string }> = {
  LIKE: { emoji: '👍', label: 'Thích' },
  LOVE: { emoji: '❤️', label: 'Yêu thích' },
  HAHA: { emoji: '😂', label: 'Haha' },
  WOW: { emoji: '😮', label: 'Wow' },
  SAD: { emoji: '😢', label: 'Buồn' },
  ANGRY: { emoji: '😡', label: 'Phẫn nộ' },
};

interface ReactionsModalProps {
  postId?: string;
  commentId?: string;
  title?: string;
  onClose: () => void;
}

const ReactionsModal: React.FC<ReactionsModalProps> = ({ postId, commentId, title = 'Cảm xúc', onClose }) => {
  const navigate = useNavigate();
  const [reactions, setReactions] = useState<ReactionUserResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<ReactionType | 'ALL'>('ALL');

  useEffect(() => {
    setIsLoading(true);
    const request = commentId
      ? postService.getCommentReactions(commentId)
      : postId
        ? postService.getReactions(postId)
        : Promise.resolve([]);

    request
      .then((data) => setReactions(data))
      .catch(() => setReactions([]))
      .finally(() => setIsLoading(false));
  }, [postId, commentId]);

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

  const counts = reactions.reduce(
    (acc, r) => {
      acc[r.type] = (acc[r.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const presentTypes = (Object.keys(REACTION_EMOJI) as ReactionType[]).filter((t) => counts[t] > 0);
  const filtered = activeFilter === 'ALL' ? reactions : reactions.filter((r) => r.type === activeFilter);

  const modalJSX = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 relative">
          <div className="w-full flex justify-center">
            <h3 className="font-bold text-slate-800 text-base font-outfit">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
            title="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-3 px-4 border-b border-slate-100 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`pb-3 pt-3 px-2 text-xs font-bold whitespace-nowrap transition cursor-pointer relative ${
              activeFilter === 'ALL'
                ? 'text-blue-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:bg-blue-600 after:rounded-t-full'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Tất cả {reactions.length}
          </button>
          {presentTypes.map((t) => (
            <button
              key={t}
              onClick={() => setActiveFilter(t)}
              className={`pb-3 pt-3 px-2 text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 relative ${
                activeFilter === t
                  ? 'text-blue-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:bg-blue-600 after:rounded-t-full'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className="text-base leading-none">{REACTION_EMOJI[t].emoji}</span>
              <span>{counts[t]}</span>
            </button>
          ))}
        </div>

        <div className="max-h-[360px] overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 text-slate-400 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs font-medium">
              Không có cảm xúc nào thuộc loại này.
            </div>
          ) : (
            filtered.map((r) => (
              <div 
                key={r.userId} 
                className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition cursor-pointer"
                onClick={() => {
                  navigate(`/profile/${r.userId}`);
                  onClose();
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative h-10 w-10 shrink-0">
                    <div className="h-full w-full rounded-full border border-slate-200 overflow-hidden bg-slate-100 shadow-sm">
                      {r.avatar ? (
                        <img src={r.avatar} alt={r.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-slate-400 font-bold bg-slate-50">
                          {r.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-white flex items-center justify-center text-[12px] leading-none shadow ring-1 ring-slate-100 z-10">
                      {REACTION_EMOJI[r.type].emoji}
                    </span>
                  </div>
                  <span className="font-bold text-slate-700 text-sm truncate">{r.name}</span>
                </div>
                <span className="text-xs text-slate-400 font-medium shrink-0 ml-2">
                  {REACTION_EMOJI[r.type].label}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalJSX, document.body);
};

export default ReactionsModal;
