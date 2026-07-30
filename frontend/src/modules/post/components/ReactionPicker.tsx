import React from 'react';
import type { ReactionType } from '../types/post.types';
import { REACTION_ICONS } from './reactionConfig';

interface ReactionPickerProps {
  onSelect: (type: ReactionType) => void;
}

const ReactionPicker: React.FC<ReactionPickerProps> = ({ onSelect }) => {
  return (
    <div
      className="max-w-[calc(100vw-1rem)] bg-white border border-slate-200 shadow-xl rounded-full px-1.5 py-1 flex gap-0.5 animate-pop-in"
      style={{ fontSize: '0.9rem' }}
    >
      {(Object.keys(REACTION_ICONS) as ReactionType[]).map((type) => {
        const conf = REACTION_ICONS[type];
        return (
          <button
            key={type}
            onClick={() => onSelect(type)}
            title={conf.label}
            aria-label={conf.label}
            className="relative flex h-11 w-11 items-center justify-center cursor-pointer group/icon rounded-full transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-violet-500"
            type="button"
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
        );
      })}
    </div>
  );
};

export default ReactionPicker;
