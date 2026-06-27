import React from 'react';
import { Outlet } from 'react-router-dom';
import { MessageSquare, Share2, Shield, Flame } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header thanh lịch */}
      <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-500/20">
            <span className="text-white font-black text-xl font-outfit">V</span>
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-800 font-outfit">
            Vizo
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 hidden sm:inline-block">
            Hạ tầng Sandbox local
          </span>
          <a
            href="http://localhost:8025"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-bold transition-all hover:border-violet-500 bg-white flex items-center space-x-1 shadow-sm animate-pulse-subtle"
          >
            <span>Mailpit UI</span>
          </a>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center px-6 py-6 sm:py-10 z-10 max-w-7xl w-full mx-auto justify-center animate-fade-in-up">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full mt-10">
          
          {/* Cột trái: Slogan & Tính năng nổi bật */}
          <div className="lg:col-span-7 space-y-8 text-left hidden lg:block pr-8">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-violet-50 border border-violet-100 text-xs font-bold text-violet-600">
              <span className="h-2 w-2 rounded-full bg-violet-500 animate-pulse"></span>
              <span>Phiên bản Enterprise v1.2</span>
            </div>

            <h1 className="text-5xl font-black tracking-tight leading-[1.1] text-slate-900">
              Kết nối sâu sắc, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-500">
                Chia sẻ chân thực.
              </span>
            </h1>

            <p className="text-slate-500 text-lg max-w-lg leading-relaxed">
              Vizo mang lại một trải nghiệm mạng xã hội thế hệ mới: Nhanh hơn, bảo mật hơn và thông minh vượt trội.
            </p>

            {/* Các đặc trưng công nghệ */}
            <div className="grid grid-cols-2 gap-6 pt-4 max-w-xl">
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-white border border-slate-200 mt-1 text-violet-600 shadow-sm">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Nhắn tin thời gian thực</h4>
                  <p className="text-slate-500 text-xs mt-1">STOMP WebSocket & Redis Pub/Sub</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-white border border-slate-200 mt-1 text-indigo-600 shadow-sm">
                  <Share2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Đồ thị mạng xã hội</h4>
                  <p className="text-slate-500 text-xs mt-1">Đồ thị quan hệ bạn bè Neo4j</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-white border border-slate-200 mt-1 text-emerald-600 shadow-sm">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Bảo mật tối đa</h4>
                  <p className="text-slate-500 text-xs mt-1">HttpOnly Cookies & Token Rotation</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-white border border-slate-200 mt-1 text-amber-600 shadow-sm">
                  <Flame className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Vite & Tailwind v4</h4>
                  <p className="text-slate-500 text-xs mt-1">Build thần tốc, UI mượt mà</p>
                </div>
              </div>
            </div>
          </div>

          {/* Cột phải: Form Đăng nhập / Đăng ký / Quên mật khẩu (Outlet con) */}
          <div className="lg:col-span-5 flex justify-center w-full">
            <Outlet />
          </div>

        </div>
      </main>

      {/* Footer tối giản */}
      <footer className="w-full border-t border-slate-200 py-6 z-10 bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-4">
          <p>© 2026 Vizo Project. Bảo lưu mọi quyền.</p>
          <div className="flex space-x-6">
            <a href="#privacy" className="hover:underline">Điều khoản bảo mật</a>
            <a href="#terms" className="hover:underline">Điều khoản dịch vụ</a>
            <a href="http://localhost:8080/api/docs" target="_blank" rel="noopener noreferrer" className="hover:underline text-violet-600 font-semibold">Swagger API Docs</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AuthLayout;
