import React, { useState, useEffect, useRef } from 'react';
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
  const observerRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    if (!hasMore || isFetchingMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchPosts(nextPage);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerRef.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isFetchingMore, isLoading, page]);

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
            <div ref={observerRef} className="flex justify-center pt-6 pb-12">
              <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
              <span className="ml-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Đang tải thêm bài viết...</span>
            </div>
          )}
          
          {!hasMore && posts.length > 0 && (
            <div className="text-center pt-6 pb-12 text-slate-400 text-xs font-bold uppercase tracking-wider">
              ✨ Bạn đã xem hết bài viết
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PostFeed;
