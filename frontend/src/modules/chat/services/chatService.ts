import axiosClient from '../../../core/api/axiosClient';
import type { ApiResponse, ConversationResponse, MessageResponse, Page } from '../types/chat.types';

/**
 * Service gọi các API của module Chat (Sprint 4.2 & 4.3).
 */
export const chatService = {
  // Lấy danh sách cuộc trò chuyện
  getConversations: async (page = 0, size = 20) => {
    const res = await axiosClient.get<ApiResponse<Page<ConversationResponse>>>('/conversations', {
      params: { page, size },
    });
    return res.data.data;
  },

  // Tạo hoặc lấy cuộc trò chuyện với 1 user bạn bè
  createConversation: async (recipientId: string) => {
    const res = await axiosClient.post<ApiResponse<ConversationResponse>>('/conversations', {
      recipientId,
    });
    return res.data.data;
  },

  // Lấy tin nhắn của cuộc trò chuyện (phân trang)
  getMessages: async (conversationId: string, page = 0, size = 50) => {
    const res = await axiosClient.get<ApiResponse<Page<MessageResponse>>>(
      `/conversations/${conversationId}/messages`,
      { params: { page, size } }
    );
    return res.data.data;
  },

  // Đánh dấu tất cả tin nhắn chưa đọc là đã xem
  markAsSeen: async (conversationId: string) => {
    const res = await axiosClient.put<ApiResponse<void>>(`/conversations/${conversationId}/seen`);
    return res.data;
  },

  // Đánh dấu 1 tin nhắn cụ thể là đã nhận (Delivered)
  markAsDelivered: async (messageId: string) => {
    const res = await axiosClient.put<ApiResponse<void>>(`/messages/${messageId}/delivered`);
    return res.data;
  },
};
