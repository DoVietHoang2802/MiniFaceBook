import axiosClient from '../../../core/api/axiosClient';

export interface AdminStats {
  totalUsers: number;
  totalPosts: number;
  totalComments: number;
  onlineUsers: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  roles: string[];
  verified: boolean;
  banned: boolean;
  isOnline: boolean;
  createdAt: string;
}

export interface AdminPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  images: string[];
  likeCount: number;
  commentCount: number;
  createdAt: string;
}

export interface AdminBroadcastPayload {
  title: string;
  content: string;
}

export const adminService = {
  getStats: async (): Promise<AdminStats> => {
    const res = await axiosClient.get('/admin/stats');
    return res.data.data;
  },

  getUsers: async (search?: string, page: number = 0, size: number = 20) => {
    const res = await axiosClient.get('/admin/users', {
      params: { search, page, size },
    });
    return res.data.data;
  },

  toggleBanUser: async (userId: string): Promise<AdminUser> => {
    const res = await axiosClient.put(`/admin/users/${userId}/ban`);
    return res.data.data;
  },

  changeUserRole: async (userId: string, role: 'USER' | 'ADMIN'): Promise<AdminUser> => {
    const res = await axiosClient.put(`/admin/users/${userId}/role`, null, {
      params: { role },
    });
    return res.data.data;
  },

  getPosts: async (search?: string, page: number = 0, size: number = 20) => {
    const res = await axiosClient.get('/admin/posts', {
      params: { search, page, size },
    });
    return res.data.data;
  },

  deletePost: async (postId: string, reason?: string) => {
    const res = await axiosClient.delete(`/admin/posts/${postId}`, {
      params: { reason },
    });
    return res.data.data;
  },

  broadcastNotification: async (payload: AdminBroadcastPayload) => {
    const res = await axiosClient.post('/admin/broadcast', payload);
    return res.data.data;
  },
};
