import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../../core/auth/AuthContext';
import type { PostResponse } from '../types/post.types';
import { postService } from '../services/postService';
import PostDetailModal from './PostDetailModal';

export default function PostDetailPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<PostResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!postId) return;
    void postService.getPost(postId)
      .then((response) => setPost(response.data))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Không tìm thấy bài viết này.'));
  }, [postId]);

  if (error) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500">{error}</div>;
  }

  if (!post) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-violet-600"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return <PostDetailModal post={post} currentUser={user} onClose={() => navigate('/')} />;
}
