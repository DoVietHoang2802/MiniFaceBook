import axiosClient from '../../../core/api/axiosClient';
import type { PostResponse, Page } from '../types/post.types';

export const postService = {
  createPost: async (content: string, files: File[]) => {
    const formData = new FormData();
    formData.append('content', content);
    files.forEach((file) => {
      formData.append('images', file);
    });
    
    const response = await axiosClient.post<{ data: PostResponse }>('/posts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getNewsFeed: async (page: number = 0, size: number = 10) => {
    const response = await axiosClient.get<{ data: Page<PostResponse> }>(`/posts/newsfeed`, {
      params: { page, size },
    });
    return response.data;
  }
};
