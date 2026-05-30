import React, { useState, useEffect } from 'react';
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
  postId: string;
  onClose: () => void;
}

/**
 * Modal hiển thị danh sách "ai đã thả cảm xúc gì" (giống Facebook).
 * Có tab "Tất cả" + tab lọc theo từng loại cảm xúc kèm số đếm.
 */
const ReactionsModal: React.FC<ReactionsModalProps> = ({ postId, onClose }) => {
  const [reactions, setReactions] = useState<ReactionUserResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<ReactionType | 'ALL'>('ALL');

  useEffect(() => {
    setIsLoading(true);
    postService
      .getReactions(postId)
      .then((data) => setReactions(data))
      .catch(() => setReactions([]))
      .finally(() => setIsLoading(false));
  }, [postId]);

  // Đếm số lượng theo từng loại
  const counts = reactions.reduce(
    (acc, r) => {
      acc[r.type] = (acc[r.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Các loại có người thả (để render tab)
  const presentTypes = (Object.keys(REACTION_EMOJI) as ReactionType[]).filter(
    (t) => counts[t] > 0
  );

  const filtered =
    activeFilter === 'ALL' ? reactions : reactions.filter((r) => r.type === activeFilter);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 text-base font-outfit">Cảm xúc</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs lọc */}
        <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-100 overflow-x-auto">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeFilter === 'ALL'
                ? 'bg-violet-50 text-violet-600'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            Tất cả {reactions.length}
          </button>
          {presentTypes.map((t) => (
            <button
              key={t}
              onClick={() => setActiveFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1 ${
                activeFilter === t ? 'bg-violet-50 text-violet-600' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <span className="text-base leading-none">{REACTION_EMOJI[t].emoji}</span>
              <span>{counts[t]}</span>
            </button>
          ))}
        </div>

        {/* Danh sách người thả */}
        <div className="max-h-[360px] overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-10">Chưa có cảm xúc nào.</p>
          ) : (
            filtered.map((r) => (
              <div
                key={r.userId + r.type}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 transition"
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="relative shrink-0 h-10 w-10">
                    <div className="h-10 w-10 rounded-full border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center text-slate-400 font-bold">
                      {r.avatar ? (
                        <img src={r.avatar} alt={r.name} className="h-full w-full object-cover" />
                      ) : (
                        r.name?.charAt(0).toUpperCase()
                      )}
                    </div>
                    {/* Emoji badge tròn nhỏ góc dưới-phải avatar (giống Facebook) */}
                    <span className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-white flex items-center justify-center text-[12px] leading-none shadow ring-1 ring-slate-100">
                      {REACTION_EMOJI[r.type].emoji}
                    </span>
                  </div>
                  <span className="font-bold text-slate-700 text-sm truncate">{r.name}</span>
                </div>
                <span className="text-xs text-slate-400 font-medium shrink-0">
                  {REACTION_EMOJI[r.type].label}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ReactionsModal;
