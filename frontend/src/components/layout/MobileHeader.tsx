import { Search } from 'lucide-react';

interface MobileHeaderProps {
  onHome: () => void;
  onSearch: () => void;
  showSearch: boolean;
}

export function MobileHeader({ onHome, onSearch, showSearch }: MobileHeaderProps) {
  return (
    <header
      data-testid="mobile-header"
      className="mobile-app-header fixed inset-x-0 top-0 z-[190] flex items-center justify-between border-b border-slate-200 bg-white/95 px-3 shadow-sm backdrop-blur-xl md:hidden dark:border-slate-800 dark:bg-slate-900/95"
    >
      <button
        type="button"
        onClick={onHome}
        className="flex min-h-11 items-center gap-2 rounded-xl px-1.5 text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:text-slate-100"
        aria-label="Về Trang chủ"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-lg font-black text-white shadow-md shadow-violet-500/20">
          H
        </span>
        <span className="font-outfit text-lg font-black tracking-tight">Hizo</span>
      </button>

      {showSearch && (
        <button
          type="button"
          onClick={onSearch}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:bg-slate-800 dark:text-slate-200"
          aria-label="Tìm bài viết"
        >
          <Search className="h-5 w-5" />
        </button>
      )}
    </header>
  );
}

export default MobileHeader;
