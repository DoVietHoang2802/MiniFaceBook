import React from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Clock } from 'lucide-react';
import type { PostResponse } from '../types/post.types';

interface PostCardProps {
  post: PostResponse;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  // Format thời gian hiển thị tương đối đơn giản
  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}`;
    } catch {
      return 'Vừa xong';
    }
  };

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden mb-6 transition-all duration-300 hover:shadow-md animate-fade-in-up">
      <div className="p-5">
        {/* Header: Author info & Time */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full border border-slate-200 overflow-hidden bg-slate-100 shadow-sm shrink-0">
              {post.authorAvatar ? (
                <img src={post.authorAvatar} alt={post.authorName} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-slate-400 font-bold bg-slate-50">
                  {post.authorName?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 leading-tight">{post.authorName || 'Người dùng ẩn danh'}</h3>
              <div className="flex items-center text-[10px] text-slate-400 font-semibold space-x-1 mt-0.5">
                <Clock className="h-3 w-3 text-slate-400" />
                <span>{formatTime(post.createdAt)}</span>
              </div>
            </div>
          </div>
          <button className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg p-1.5 transition cursor-pointer">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        {post.content && (
          <p className="text-slate-600 text-sm leading-relaxed mb-4 whitespace-pre-wrap font-medium">
            {post.content}
          </p>
        )}

        {/* Image Grid */}
        {post.imageUrls && post.imageUrls.length > 0 && (
          <div className={`grid gap-1 mb-4 rounded-xl overflow-hidden border border-slate-100 ${
            post.imageUrls.length === 1 ? 'grid-cols-1' : 
            'grid-cols-2'
          }`}>
            {post.imageUrls.slice(0, 4).map((url, idx) => {
              const isLast = idx === 3;
              const remainingCount = post.imageUrls!.length - 4;
              
              // Custom layout logic for 3 images (1 big left, 2 small right)
              let itemClasses = 'relative aspect-square';
              if (post.imageUrls!.length === 1) {
                itemClasses = 'relative max-h-[500px] w-full';
              } else if (post.imageUrls!.length === 3 && idx === 0) {
                itemClasses = 'relative row-span-2 h-full w-full';
              }

              return (
                <div key={idx} className={itemClasses}>
                  <img src={url} alt="Post image" className="absolute inset-0 h-full w-full object-cover hover:scale-102 transition duration-500 cursor-pointer" style={{ position: post.imageUrls!.length === 1 ? 'relative' : 'absolute' }} />
                  
                  {isLast && remainingCount > 0 && (
                    <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center cursor-pointer hover:bg-slate-900/60 transition backdrop-blur-sm">
                      <span className="text-white text-3xl font-black font-outfit">+{remainingCount}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-4 gap-1">
          <button className={`flex items-center space-x-2 p-2 rounded-xl transition-all cursor-pointer flex-1 justify-center ${post.isReactedByMe ? 'text-rose-600 bg-rose-50 font-bold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
            <Heart className={`h-4.5 w-4.5 ${post.isReactedByMe ? 'fill-current text-rose-500' : ''}`} />
            <span className="text-xs font-bold">{post.reactCount > 0 ? `${post.reactCount} Likes` : 'Like'}</span>
          </button>
          
          <button className="flex items-center space-x-2 p-2 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all cursor-pointer flex-1 justify-center">
            <MessageCircle className="h-4.5 w-4.5" />
            <span className="text-xs font-bold">Comment</span>
          </button>
          
          <button className="flex items-center space-x-2 p-2 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all cursor-pointer flex-1 justify-center">
            <Share2 className="h-4.5 w-4.5" />
            <span className="text-xs font-bold">Share</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
