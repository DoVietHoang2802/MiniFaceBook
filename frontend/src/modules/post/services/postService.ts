import axiosClient from '../../../core/api/axiosClient';
import type { PostResponse, Page, ReactionRequest, CommentResponse, ReactionUserResponse } from '../types/post.types';

export const postService = {
  createPost: async (content: string, files: File[]) => {
    const formData = new FormData();
    formData.append('content', content);
    files.forEach((file) => {
      formData.append('images', file);
    });

    const response = await axiosClient.post<{ data: PostResponse }>('/posts', formData);
    return response.data;
  },

  getNewsFeed: async (page: number = 0, size: number = 10) => {
    const response = await axiosClient.get<{ data: Page<PostResponse> }>(`/posts/newsfeed`, {
      params: { page, size },
    });
    return response.data;
  },

  reactToPost: async (postId: string, request: ReactionRequest) => {
    const response = await axiosClient.post<{ data: void }>(`/posts/${postId}/react`, request);
    return response.data;
  },

  reactToComment: async (commentId: string, request: ReactionRequest) => {
    const response = await axiosClient.post<{ data: void }>(`/posts/comments/${commentId}/react`, request);
    return response.data;
  },

  addComment: async (postId: string, content: string, image?: File) => {
    const formData = new FormData();
    formData.append('content', content);
    if (image) {
      formData.append('image', image);
    }

    const response = await axiosClient.post<{ data: CommentResponse }>(`/posts/${postId}/comments`, formData);
    return response.data;
  },

  getComments: async (postId: string, page: number = 0, size: number = 10) => {
    const response = await axiosClient.get<{ data: Page<CommentResponse> }>(`/posts/${postId}/comments`, {
      params: { page, size },
    });
    return response.data;
  },

  getReactions: async (postId: string) => {
    const response = await axiosClient.get<{ data: ReactionUserResponse[] }>(`/posts/${postId}/reactions`);
    return response.data.data;
  },

  getCommentReactions: async (commentId: string) => {
    const response = await axiosClient.get<{ data: ReactionUserResponse[] }>(`/posts/comments/${commentId}/reactions`);
    return response.data.data;
  },

  deletePost: async (postId: string) => {
    const response = await axiosClient.delete<{ data: void }>(`/posts/${postId}`);
    return response.data;
  },

  deleteComment: async (commentId: string) => {
    const response = await axiosClient.delete<{ data: void }>(`/posts/comments/${commentId}`);
    return response.data;
  }
};
