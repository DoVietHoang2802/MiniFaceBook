import React from 'react';
import { createPortal } from 'react-dom';
import { Flag, Reply, Share2 } from 'lucide-react';
import type { ReactionType } from '../types/post.types';
import ReactionPicker from './ReactionPicker';

interface CommentQuote {
  authorName: string;
  content: string;
  imageUrl: string | null;
}

interface MobileReactionActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onReact: (type: ReactionType) => void;
  comment?: CommentQuote;
  onReply?: () => void;
  onReport?: () => void;
}

const MobileReactionActionSheet: React.FC<MobileReactionActionSheetProps> = ({
  isOpen,
  onClose,
  onReact,
  comment,
  onReply,
  onReport,
}) => {
  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-md animate-fade-in md:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Chọn cảm xúc"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex w-full max-w-sm flex-col items-center gap-4">
        <ReactionPicker
          onSelect={(type) => {
            onReact(type);
            onClose();
          }}
        />

        {comment && (
          <div className="w-full rounded-2xl bg-white p-3 shadow-2xl">
            <blockquote className="flex gap-3 rounded-xl bg-slate-50 p-3 text-left">
              {comment.imageUrl && (
                <img
                  src={comment.imageUrl}
                  alt="Comment preview"
                  className="h-16 w-16 shrink-0 rounded-lg border border-slate-200 object-cover"
                />
              )}
              <div className="min-w-0">
                <p className="text-xs font-black text-slate-800">{comment.authorName}</p>
                {comment.content && (
                  <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-slate-600">{comment.content}</p>
                )}
              </div>
            </blockquote>

            <div className="mt-2 grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => {
                  onReply?.();
                  onClose();
                }}
                className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-bold text-slate-600 transition hover:bg-slate-100"
              >
                <Reply className="h-4 w-4" />
                Phản hồi
              </button>
              <button
                type="button"
                disabled
                title="Chia sẻ bình luận chưa khả dụng"
                className="flex min-h-12 cursor-not-allowed flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-bold text-slate-300"
              >
                <Share2 className="h-4 w-4" />
                Chia sẻ bình luận
              </button>
              <button
                type="button"
                onClick={() => {
                  onReport?.();
                  onClose();
                }}
                className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-bold text-rose-500 transition hover:bg-rose-50"
              >
                <Flag className="h-4 w-4" />
                Báo cáo bình luận
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default MobileReactionActionSheet;
