// Types cho module Friends - khớp với response Backend (module friendship)

/** Trạng thái quan hệ giữa user hiện tại và user khác (khớp enum BE). */
export type RelationshipStatus =
  | 'NONE'
  | 'PENDING_SENT'
  | 'PENDING_RECEIVED'
  | 'FRIEND'
  | 'BLOCKED';

/** Trạng thái friendship (khớp enum BE FriendshipStatus). */
export type FriendshipStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'BLOCKED';

/** Response cho danh sách bạn bè / lời mời (BE: FriendshipResponse). */
export interface FriendshipResponse {
  friendshipId: string;
  status: FriendshipStatus;
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  sentByMe: boolean;
  createdAt: string;
}

/** Response cho mỗi kết quả tìm kiếm (BE: UserSearchResponse). */
export interface UserSearchResponse {
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  relationshipStatus: RelationshipStatus;
  friendshipId?: string | null;
}

/** Cấu trúc Page phân trang chuẩn Spring Data. */
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

/** Wrapper ApiResponse chuẩn của Backend. */
export interface ApiResponse<T> {
  timestamp: string;
  status: number;
  message: string;
  data: T;
}
