import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { postService } from '../services/postService';
import type { PostResponse } from '../types/post.types';
import CreatePostCard from './CreatePostCard';
import PostCard from './PostCard';
import { useAuth } from '../../../core/auth/AuthContext';

interface PostFeedProps {
  currentUser?: any;
}

const PostFeed: React.FC<PostFeedProps> = ({ currentUser: propCurrentUser }) => {
  const { user: contextUser } = useAuth();
  const currentUser = propCurrentUser || contextUser;
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const fetchPosts = async (pageNum: number) => {
    try {
      if (pageNum === 0) setIsLoading(true);
      else setIsFetchingMore(true);

      const data = await postService.getNewsFeed(pageNum, 10);
      
      if (pageNum === 0) {
        setPosts(data.data.content);
      } else {
        setPosts((prev) => [...prev, ...data.data.content]);
      }
      
      setHasMore(data.data.number < data.data.totalPages - 1);
    } catch (error) {
      console.error('Lỗi khi tải bảng tin:', error);
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  };

  useEffect(() => {
    fetchPosts(0);
  }, []);

  const handlePostCreated = (newPost: PostResponse) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-2 animate-fade-in">
      <CreatePostCard currentUser={currentUser} onPostCreated={handlePostCreated} />
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-10 space-y-3">
          <Loader2 className="h-8 w-8 text-violet-600 animate-spin" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Đang tải bảng tin...</span>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-10 text-slate-400 text-sm font-medium">
          Chưa có bài viết nào. Hãy là người đầu tiên chia sẻ!
        </div>
      ) : (
        <div className="space-y-6 mt-4">
          {posts.map((post) => (
            <PostCard 
              key={post.id} 
              post={post} 
              currentUser={currentUser} 
              onPostDeleted={handlePostDeleted} 
            />
          ))}
          
          {hasMore && (
            <div className="flex justify-center pt-4 pb-10">
              <button
                onClick={() => {
                  const nextPage = page + 1;
                  setPage(nextPage);
                  fetchPosts(nextPage);
                }}
                disabled={isFetchingMore}
                className="px-6 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-600 shadow-sm transition-colors flex items-center space-x-2 cursor-pointer"
              >
                {isFetchingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
                    <span>Đang tải thêm...</span>
                  </>
                ) : (
                  <span>Tải thêm bài viết</span>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PostFeed;
