import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Loader2, Search, SearchX } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../core/auth/AuthContext';
import { postService } from '../services/postService';
import type { PostResponse } from '../types/post.types';
import PostCard from './PostCard';

const normalizeQuery = (value: string) => value.normalize('NFC').trim().replace(/\s+/g, ' ');

export default function SearchPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = normalizeQuery(searchParams.get('q') ?? '');
  const [input, setInput] = useState(query);
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const requestRef = useRef<AbortController | null>(null);

  const loadPage = async (requestedPage: number, append: boolean) => {
    if (query.length < 2) {
      setPosts([]);
      setHasMore(false);
      return;
    }

    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setError('');
    if (append) setIsLoadingMore(true);
    else setIsLoading(true);

    try {
      const response = await postService.searchPosts(query, requestedPage, 10, controller.signal);
      const result = response.data;
      setPosts((current) => append ? [...current, ...result.content] : result.content);
      setPage(result.number);
      setHasMore(result.number < result.totalPages - 1);
    } catch (requestError: any) {
      if (requestError?.code !== 'ERR_CANCELED') {
        setError('Không thể tải kết quả tìm kiếm. Vui lòng thử lại.');
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    }
  };

  useEffect(() => {
    setInput(query);
    setPage(0);
    void loadPage(0, false);
    return () => requestRef.current?.abort();
  }, [query]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const nextQuery = normalizeQuery(input);
    if (nextQuery.length >= 2) setSearchParams({ q: nextQuery });
  };

  const handlePostDeleted = (postId: string) => {
    setPosts((current) => current.filter((post) => post.id !== postId));
  };

  return (
    <section className="mx-auto w-full max-w-2xl py-2 md:py-4" aria-label="Kết quả tìm kiếm bài viết">
      <div className="mb-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <form onSubmit={submit} className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            aria-label="Tìm bài viết"
            placeholder="Tìm bài viết..."
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-500/15 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </form>
      </div>

      {query.length < 2 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center dark:border-slate-800 dark:bg-slate-900">
          <Search className="mx-auto h-9 w-9 text-violet-400" />
          <h1 className="mt-3 font-outfit text-lg font-black text-slate-800 dark:text-slate-100">Tìm bài viết</h1>
          <p className="mt-1 text-sm text-slate-500">Nhập ít nhất 2 ký tự để bắt đầu tìm kiếm.</p>
        </div>
      ) : isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <Loader2 className="h-7 w-7 animate-spin text-violet-600" />
          <span className="mt-3 text-xs font-bold uppercase tracking-wider">Đang tìm kiếm...</span>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-5 py-8 text-center dark:border-rose-900/50 dark:bg-rose-950/20">
          <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">{error}</p>
          <button type="button" onClick={() => void loadPage(0, false)} className="mt-3 text-sm font-bold text-violet-600 hover:text-violet-500">Thử lại</button>
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center dark:border-slate-800 dark:bg-slate-900">
          <SearchX className="mx-auto h-9 w-9 text-slate-300" />
          <h1 className="mt-3 font-outfit text-lg font-black text-slate-800 dark:text-slate-100">Không tìm thấy bài viết</h1>
          <p className="mt-1 text-sm text-slate-500">Không có kết quả cho "{query}".</p>
        </div>
      ) : (
        <>
          <p className="mb-2 px-1 text-xs font-semibold text-slate-500">Kết quả cho "{query}"</p>
          <div className="space-y-0">
            {posts.map((post) => <PostCard key={post.id} post={post} currentUser={user} onPostDeleted={handlePostDeleted} />)}
          </div>
          {hasMore && (
            <div className="flex justify-center py-6">
              <button type="button" onClick={() => void loadPage(page + 1, true)} disabled={isLoadingMore} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-violet-600 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900">
                {isLoadingMore ? 'Đang tải...' : 'Tải thêm kết quả'}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
