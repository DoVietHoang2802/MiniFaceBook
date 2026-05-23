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
}

export interface ReactionRequest {
  type: ReactionType;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
