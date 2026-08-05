import axiosClient from '../../../core/api/axiosClient';
import type { LoginInput, RegisterInput } from '../schemas/authSchema';

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  roles: string[];
  authProvider?: 'PASSWORD' | 'GOOGLE' | 'PASSWORD_AND_GOOGLE';
  verified: boolean;
  avatar?: string;
  cover?: string;
  bio?: string;
  city?: string;
  hometown?: string;
  work?: string;
  relationship?: string;
  cityVisibility?: 'PUBLIC' | 'FRIENDS' | 'ONLY_ME';
  hometownVisibility?: 'PUBLIC' | 'FRIENDS' | 'ONLY_ME';
  workVisibility?: 'PUBLIC' | 'FRIENDS' | 'ONLY_ME';
  relationshipVisibility?: 'PUBLIC' | 'FRIENDS' | 'ONLY_ME';
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

export const authService = {
  // Đăng nhập tài khoản
  login: async (data: LoginInput): Promise<ApiResponse<UserResponse>> => {
    const response = await axiosClient.post<ApiResponse<UserResponse>>('/auth/login', data);
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
  getMe: async (): Promise<ApiResponse<UserResponse>> => {
    // An anonymous bootstrap is expected to return 401; it must not trigger a global logout.
    const response = await axiosClient.get<ApiResponse<UserResponse>>('/auth/me', {
      skipAuthRefresh: true,
    });
    return response.data;
  },

  verifyEmail: async (token: string): Promise<ApiResponse<string>> => {
    const response = await axiosClient.get<ApiResponse<string>>('/auth/verify', { params: { token } });
    return response.data;
  },

  completeGoogleProfile: async (name: string): Promise<ApiResponse<UserResponse>> => {
    const response = await axiosClient.post<ApiResponse<UserResponse>>(
      '/auth/oauth/google/complete-profile',
      { name },
    );
    return response.data;
  },

  getGoogleProfileCompletion: async (): Promise<ApiResponse<{ suggestedName: string }>> => {
    const response = await axiosClient.get<ApiResponse<{ suggestedName: string }>>(
      '/auth/oauth/google/profile',
      { skipAuthRefresh: true },
    );
    return response.data;
  },

  // Yêu cầu gửi mã OTP quên mật khẩu
  forgotPassword: async (email: string): Promise<ApiResponse<string>> => {
    const response = await axiosClient.post<ApiResponse<string>>('/auth/forgot-password', { email });
    return response.data;
  },

  // Xác thực OTP để nhận resetToken
  verifyForgotPasswordOtp: async (email: string, otp: string): Promise<ApiResponse<string>> => {
    const response = await axiosClient.post<ApiResponse<string>>('/auth/forgot-password/verify', { email, otp });
    return response.data;
  },

  // Đặt lại mật khẩu mới
  resetPassword: async (resetToken: string, newPassword: string): Promise<ApiResponse<string>> => {
    const response = await axiosClient.post<ApiResponse<string>>('/auth/reset-password', { resetToken, newPassword });
    return response.data;
  },
};

