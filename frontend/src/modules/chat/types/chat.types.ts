export interface ParticipantResponse {
  id: string;
  name: string;
  avatar?: string;
}

export interface LastMessageSummary {
  senderId: string;
  contentPreview: string;
  type: 'TEXT' | 'IMAGE' | 'FILE';
  sentAt: string;
}

export interface ConversationResponse {
  id: string;
  participants: ParticipantResponse[];
  lastMessage?: LastMessageSummary;
  unreadCount: number;
  lastMessageAt?: string;
  createdAt: string;
}

export interface ReplyPreview {
  messageId: string;
  senderId: string;
  senderName: string;
  contentPreview: string;
}

export interface MessageResponse {
  id: string;
  conversationId: string;
  sender: ParticipantResponse;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'FILE';
  mediaUrl?: string;
  deliveredAt?: string;
  seenAt?: string;
  createdAt: string;
  // Reactions: key = userId, value = emoji (Sprint 4.4)
  reactions?: Record<string, string>;
  // Snapshot tin nhắn được trả lời (Sprint 4.4 - Reply)
  replyTo?: ReplyPreview;
  // Trạng thái local cho Optimistic UI
  status?: 'PENDING' | 'SENT' | 'DELIVERED' | 'SEEN' | 'FAILED';
}

export interface MessageReactionEvent {
  conversationId: string;
  messageId: string;
  reactions: Record<string, string>;
}

export interface MessageStatusEvent {
  conversationId: string;
  messageId?: string;
  status: 'DELIVERED' | 'SEEN';
  timestamp: string;
  userId: string;
}

export interface TypingEvent {
  conversationId: string;
  userId: string;
  userName: string;
  typing: boolean;
}

export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}
