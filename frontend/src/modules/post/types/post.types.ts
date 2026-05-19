export interface PostResponse {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  content: string;
  imageUrls: string[];
  reactCount: number;
  isReactedByMe: boolean;
  createdAt: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
