import axiosClient from '../../../core/api/axiosClient';
import type { LoginInput, RegisterInput } from '../schemas/authSchema';

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  roles: string[];
  verified: boolean;
  avatar?: string;
  bio?: string;
}

export const authService = {
  // Đăng nhập tài khoản
  login: async (data: LoginInput): Promise<UserResponse> => {
    const response = await axiosClient.post<UserResponse>('/auth/login', data);
    return response.data;
  },

  // Đăng ký tài khoản mới
  register: async (data: Omit<RegisterInput, 'confirmPassword'>): Promise<{ message: string }> => {
    const response = await axiosClient.post<{ message: string }>('/auth/register', data);
    return response.data;
  },

  // Đăng xuất và xóa session cookie
  logout: async (): Promise<{ message: string }> => {
    const response = await axiosClient.post<{ message: string }>('/auth/logout');
    return response.data;
  },

  // Lấy thông tin user hiện tại (kiểm tra trạng thái đăng nhập)
  getMe: async (): Promise<UserResponse> => {
    const response = await axiosClient.get<UserResponse>('/auth/me');
    return response.data;
  },
};
