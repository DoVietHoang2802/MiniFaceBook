import React, { useState } from 'react';
import type { ReactionType } from '../types/post.types';

export const REACTION_CONFIG: Record<ReactionType, { label: string; image: string; emoji: string; activeText: string }> = {
  LIKE: { label: 'Thích', image: '/reactions/like.png', emoji: '👍', activeText: 'text-blue-600' },
  LOVE: { label: 'Yêu thích', image: '/reactions/love.png', emoji: '❤️', activeText: 'text-rose-500' },
  HAHA: { label: 'Haha', image: '/reactions/haha.png', emoji: '😂', activeText: 'text-yellow-500' },
  WOW: { label: 'Wow', image: '/reactions/wow.png', emoji: '😮', activeText: 'text-orange-500' },
  SAD: { label: 'Buồn', image: '/reactions/sad.png', emoji: '😢', activeText: 'text-amber-500' },
  ANGRY: { label: 'Phẫn nộ', image: '/reactions/angry.png', emoji: '😡', activeText: 'text-red-500' },
};

interface EmojiBarProps {
  onSelect: (type: ReactionType) => void;
}

const ReactionIcon: React.FC<{ type: ReactionType; sizeClass?: string }> = ({ type, sizeClass = 'h-8 w-8' }) => {
  const conf = REACTION_CONFIG[type];
  const [imageFailed, setImageFailed] = useState(false);

  if (imageFailed) {
    return <span className={`inline-flex items-center justify-center ${sizeClass} text-[1.75rem] leading-none select-none`}>{conf.emoji}</span>;
  }

  return (
    <img
      src={conf.image}
      alt={conf.label}
      onError={() => setImageFailed(true)}
      className={`${sizeClass} block object-contain select-none transition-transform duration-200 group-hover/icon:scale-125`}
      draggable={false}
    />
  );
};

const EmojiBar: React.FC<EmojiBarProps> = ({ onSelect }) => {
  return (
    <div className="bg-white border border-slate-200 shadow-xl rounded-full px-2 py-1.5 flex gap-1 animate-pop-in">
      {(Object.keys(REACTION_CONFIG) as ReactionType[]).map((type) => {
        const conf = REACTION_CONFIG[type];
        return (
          <button
            key={type}
            onClick={() => onSelect(type)}
            title={conf.label}
            className="relative flex items-center justify-center cursor-pointer group/icon p-1 min-w-10 min-h-10"
            type="button"
          >
            <ReactionIcon type={type} />
            <span className="absolute -top-9 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[11px] font-bold px-2 py-0.5 rounded-full opacity-0 group-hover/icon:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20">
              {conf.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export { ReactionIcon };
export default EmojiBar;
