import axiosClient from '../../../core/api/axiosClient';
import type {
  ApiResponse,
  FriendshipResponse,
  FriendSuggestionResponse,
  Page,
  UserSearchResponse,
} from '../types/friend.types';

/**
 * Service gọi các API của module Friendship (Phase 3).
 * Tất cả request tự động kèm HttpOnly Cookie qua axiosClient (withCredentials).
 */
export const friendService = {
  // ===== Sprint 3.3: Search =====
  searchUsers: async (keyword: string, page = 0, size = 10) => {
    const res = await axiosClient.get<ApiResponse<Page<UserSearchResponse>>>('/friends/search', {
      params: { q: keyword, page, size },
    });
    return res.data.data;
  },

  // ===== Sprint 3.4: Friend Suggestions =====
  getSuggestions: async (limit = 5) => {
    const res = await axiosClient.get<ApiResponse<FriendSuggestionResponse[]>>(
      '/friends/suggestions',
      { params: { limit } }
    );
    return res.data.data;
  },

  // ===== Sprint 3.2: Lists =====
  getFriends: async (userId?: string) => {
    const url = userId ? `/friends/user/${userId}` : '/friends';
    const res = await axiosClient.get<ApiResponse<FriendshipResponse[]>>(url);
    return res.data.data;
  },

  getPendingRequests: async () => {
    const res = await axiosClient.get<ApiResponse<FriendshipResponse[]>>(
      '/friends/requests/pending'
    );
    return res.data.data;
  },

  getSentRequests: async () => {
    const res = await axiosClient.get<ApiResponse<FriendshipResponse[]>>('/friends/requests/sent');
    return res.data.data;
  },

  // ===== Sprint 3.1: Request actions =====
  sendRequest: async (userId: string) => {
    const res = await axiosClient.post<ApiResponse<FriendshipResponse>>(
      `/friends/request/${userId}`
    );
    return res.data.data;
  },

  cancelRequest: async (friendshipId: string) => {
    const res = await axiosClient.delete<ApiResponse<void>>(`/friends/request/${friendshipId}`);
    return res.data;
  },

  acceptRequest: async (friendshipId: string) => {
    const res = await axiosClient.put<ApiResponse<FriendshipResponse>>(
      `/friends/request/${friendshipId}/accept`
    );
    return res.data.data;
  },

  rejectRequest: async (friendshipId: string) => {
    const res = await axiosClient.put<ApiResponse<void>>(`/friends/request/${friendshipId}/reject`);
    return res.data;
  },

  // ===== Sprint 3.2: Unfriend & Block =====
  unfriend: async (friendId: string) => {
    const res = await axiosClient.delete<ApiResponse<void>>(`/friends/${friendId}`);
    return res.data;
  },

  blockUser: async (userId: string) => {
    const res = await axiosClient.post<ApiResponse<void>>(`/friends/block/${userId}`);
    return res.data;
  },

  unblockUser: async (userId: string) => {
    const res = await axiosClient.delete<ApiResponse<void>>(`/friends/block/${userId}`);
    return res.data;
  },
};
