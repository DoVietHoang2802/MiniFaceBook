import axiosClient from '../../../core/api/axiosClient';

export interface UserProfileResponse {
  id: string;
  name?: string;
  email: string;
  avatar: string | null;
  cover: string | null;
  bio: string | null;
  city: string | null;
  hometown: string | null;
  work: string | null;
  relationship: string | null;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

export const profileService = {
  // Cập nhật thông tin trang cá nhân
  updateProfile: async (data: { 
    avatar?: string; 
    bio?: string;
    city?: string;
    hometown?: string;
    work?: string;
    relationship?: string;
  }): Promise<ApiResponse<UserProfileResponse>> => {
    const response = await axiosClient.put<ApiResponse<UserProfileResponse>>('/user/profile', data);
    return response.data;
  },

  // Tải lên ảnh đại diện
  uploadAvatar: async (file: File): Promise<ApiResponse<UserProfileResponse>> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axiosClient.post<ApiResponse<UserProfileResponse>>('/user/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Tải lên ảnh bìa
  uploadCover: async (file: File): Promise<ApiResponse<UserProfileResponse>> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axiosClient.post<ApiResponse<UserProfileResponse>>('/user/cover', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Lấy thông tin hồ sơ của người dùng theo ID
  getProfileById: async (userId: string): Promise<ApiResponse<UserProfileResponse>> => {
    const response = await axiosClient.get<ApiResponse<UserProfileResponse>>(`/user/${userId}`);
    return response.data;
  },

  // Đổi mật khẩu tài khoản
  changePassword: async (data: { oldPassword?: string; newPassword?: string }): Promise<ApiResponse<void>> => {
    const response = await axiosClient.put<ApiResponse<void>>('/user/change-password', data);
    return response.data;
  },
};
