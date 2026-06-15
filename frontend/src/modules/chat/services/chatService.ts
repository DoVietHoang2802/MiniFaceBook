import axiosClient from '../../../core/api/axiosClient';
import type { ApiResponse, ConversationResponse, MessageResponse, Page } from '../types/chat.types';

export const chatService = {
  getConversations: async (page = 0, size = 20) => {
    const res = await axiosClient.get<ApiResponse<Page<ConversationResponse>>>('/conversations', {
      params: { page, size },
    });
    return res.data.data;
  },

  createConversation: async (recipientId: string) => {
    const res = await axiosClient.post<ApiResponse<ConversationResponse>>('/conversations', {
      recipientId,
    });
    return res.data.data;
  },

  getMessages: async (conversationId: string, page = 0, size = 50) => {
    const res = await axiosClient.get<ApiResponse<Page<MessageResponse>>>(
      `/conversations/${conversationId}/messages`,
      { params: { page, size } }
    );
    return res.data.data;
  },

  markAsSeen: async (conversationId: string) => {
    const res = await axiosClient.put<ApiResponse<void>>(`/conversations/${conversationId}/seen`);
    return res.data;
  },

  getTotalUnread: async () => {
    const res = await axiosClient.get<ApiResponse<number>>('/conversations/unread/total');
    return res.data.data;
  },

  markAsDelivered: async (messageId: string) => {
    const res = await axiosClient.put<ApiResponse<void>>(`/messages/${messageId}/delivered`);
    return res.data;
  },

  editMessage: async (messageId: string, content: string) => {
    const res = await axiosClient.put<ApiResponse<void>>(`/messages/${messageId}`, { content });
    return res.data;
  },

  deleteMessage: async (messageId: string, scope: 'me' | 'everyone') => {
    const res = await axiosClient.delete<ApiResponse<void>>(`/messages/${messageId}`, {
      params: { scope },
    });
    return res.data;
  },

  sendImage: async (
    conversationId: string,
    file: File,
    content?: string,
    replyToMessageId?: string | null,
    onProgress?: (percent: number) => void
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    if (content && content.trim()) {
      formData.append('content', content.trim());
    }
    if (replyToMessageId) {
      formData.append('replyToMessageId', replyToMessageId);
    }
    const res = await axiosClient.post<ApiResponse<MessageResponse>>(
      `/conversations/${conversationId}/messages/image`,
      formData,
      {
        onUploadProgress: (e) => {
          if (onProgress && e.total) {
            onProgress(Math.round((e.loaded * 100) / e.total));
          }
        },
      }
    );
    return res.data.data;
  },
};
