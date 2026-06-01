import axiosClient from '../../../core/api/axiosClient';

/**
 * Service gọi API Presence (heartbeat + check online).
 */
export const presenceService = {
  /** Gửi heartbeat - giữ trạng thái online (gọi mỗi 25s). */
  heartbeat: async (): Promise<void> => {
    await axiosClient.post('/presence/heartbeat');
  },

  /** Kiểm tra danh sách userId nào đang online. */
  checkOnlineStatus: async (userIds: string[]): Promise<string[]> => {
    const response = await axiosClient.post<{ data: string[] }>('/presence/check', userIds);
    return response.data.data;
  },
};
