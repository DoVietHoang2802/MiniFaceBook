import type { ReactionType } from '../types/post.types';

export const REACTION_ICONS: Record<ReactionType, { emoji: string; color: string; label: string; bgColor: string; activeColor: string }> = {
  LIKE: { emoji: '👍', color: 'text-blue-600', label: 'Thích', bgColor: 'bg-blue-100', activeColor: '#1877F2' },
  LOVE: { emoji: '❤️', color: 'text-rose-500', label: 'Yêu thích', bgColor: 'bg-rose-100', activeColor: '#F33E58' },
  HAHA: { emoji: '😂', color: 'text-yellow-500', label: 'Haha', bgColor: 'bg-yellow-100', activeColor: '#F7B928' },
  WOW: { emoji: '😮', color: 'text-orange-500', label: 'Wow', bgColor: 'bg-orange-100', activeColor: '#F7B928' },
  SAD: { emoji: '😢', color: 'text-amber-500', label: 'Buồn', bgColor: 'bg-amber-100', activeColor: '#F7B928' },
  ANGRY: { emoji: '😡', color: 'text-red-500', label: 'Phẫn nộ', bgColor: 'bg-red-100', activeColor: '#E9710F' },
};
