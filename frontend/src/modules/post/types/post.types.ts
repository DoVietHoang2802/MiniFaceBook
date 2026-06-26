export type ReactionType = 'LIKE' | 'LOVE' | 'HAHA' | 'WOW' | 'SAD' | 'ANGRY';

export interface PostResponse {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  content: string;
  imageUrls: string[];
  reactCount: number;
  commentCount: number;
  shareCount?: number;
  reactionsCount: Record<string, number>;
  myReactionType: ReactionType | null;
  createdAt: string;
}

export interface CommentResponse {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  reactionCounts: Record<string, number>;
  myReaction: ReactionType | null;
  deleted?: boolean;
}

export interface ReactionRequest {
  type: ReactionType;
}

/** Sự kiện realtime cập nhật số đếm tương tác của 1 bài (topic /topic/post.<id>). */
export interface PostCountEvent {
  postId: string;
  reactCount: number;
  commentCount: number;
  reactionsCount: Record<string, number>;
}

/** Sự kiện realtime cập nhật reaction counts cho 1 bình luận (topic /topic/comment.<id>). */
export interface CommentReactionEvent {
  commentId: string;
  reactionCounts: Record<string, number>;
  userReaction: ReactionType | null;
}

export interface ReactionUserResponse {
  userId: string;
  name: string;
  avatar: string | null;
  type: ReactionType;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
