import { useState, useEffect } from 'react';
import LoginForm from './modules/auth/components/LoginForm';
import RegisterForm from './modules/auth/components/RegisterForm';
import ProfilePage from './modules/profile/components/ProfilePage';
import { MessageSquare, Share2, Shield, Flame, Loader2 } from 'lucide-react';
import { authService } from './modules/auth/services/authService';

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Kiểm tra trạng thái đăng nhập qua Token Cookie lúc khởi chạy (Silent Check)
  useEffect(() => {
    authService.getMe()
      .then((response: any) => {
        const apiData = response as any;
        const loggedInUser = apiData.data || apiData;
        if (loggedInUser && loggedInUser.email) {
          setUser(loggedInUser);
        }
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setIsCheckingAuth(false);
      });
  }, []);

  // Trình hiển thị Loading khi đang tải trạng thái xác thực
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] text-white flex flex-col items-center justify-center relative">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none"></div>
        
        <div className="flex flex-col items-center space-y-4 z-10">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 animate-pulse">
            <Flame className="h-7 w-7 text-white" />
          </div>
          <div className="flex items-center space-x-2">
            <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
            <span className="text-sm font-bold tracking-wider text-slate-400 uppercase">Đang đồng bộ phiên...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-white flex flex-col relative overflow-x-hidden overflow-y-auto select-none">
      {/* Hiệu ứng hào quang nền (Ambient Radial Glow) */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none"></div>

      {/* Header thanh lịch */}
      <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Flame className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 font-outfit">
            MiniFaceBook
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted))] hidden sm:inline-block">
            Hạ tầng Sandbox local
          </span>
          <a
            href="http://localhost:8025"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg border border-[hsl(var(--border))] hover:bg-slate-900/60 text-xs font-bold transition-all hover:border-[hsl(var(--primary))] bg-slate-950/20 flex items-center space-x-1"
          >
            <span>Mailpit UI</span>
          </a>
        </div>
      </header>

      {/* Phần Main Content: Bố cục Đăng nhập / Trang cá nhân */}
      <main className="flex-grow flex items-center justify-center px-6 py-6 sm:py-10 z-10 max-w-7xl w-full mx-auto">
        {user ? (
          <ProfilePage initialUser={user} onLogout={() => setUser(null)} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
            
            {/* Cột trái: Slogan & Tính năng nổi bật */}
            <div className="lg:col-span-7 space-y-8 text-left hidden lg:block pr-8">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-400">
                <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse"></span>
                <span>Phiên bản Enterprise v1.2</span>
              </div>

              <h1 className="text-5xl font-black tracking-tight leading-[1.1] text-white">
                Kết nối sâu sắc, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-400">
                  Chia sẻ chân thực.
                </span>
              </h1>

              <p className="text-[hsl(var(--muted))] text-lg max-w-lg leading-relaxed">
                MiniFaceBook mang lại một trải nghiệm mạng xã hội thế hệ mới: Nhanh hơn, bảo mật hơn và thông minh vượt trội.
              </p>

              {/* Các đặc trưng công nghệ */}
              <div className="grid grid-cols-2 gap-6 pt-4 max-w-xl">
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-lg bg-slate-900 border border-[hsl(var(--border))] mt-1 text-blue-400">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Realtime Messaging</h4>
                    <p className="text-[hsl(var(--muted))] text-xs mt-1">STOMP WebSocket & Redis Pub/Sub</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-lg bg-slate-900 border border-[hsl(var(--border))] mt-1 text-indigo-400">
                    <Share2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Social Graph DB</h4>
                    <p className="text-[hsl(var(--muted))] text-xs mt-1">Đồ thị quan hệ bạn bè Neo4j</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-lg bg-slate-900 border border-[hsl(var(--border))] mt-1 text-emerald-400">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Strict Security</h4>
                    <p className="text-[hsl(var(--muted))] text-xs mt-1">HttpOnly Cookies & Token Rotation</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-lg bg-slate-900 border border-[hsl(var(--border))] mt-1 text-amber-400">
                    <Flame className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Vite & Tailwind v4</h4>
                    <p className="text-[hsl(var(--muted))] text-xs mt-1">Build thần tốc, UI mượt mà</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cột phải: Form Đăng nhập / Đăng ký */}
            <div className="lg:col-span-5 flex justify-center w-full">
              {isLogin ? (
                <LoginForm onToggleForm={() => setIsLogin(false)} onLoginSuccess={(u) => setUser(u)} />
              ) : (
                <RegisterForm onToggleForm={() => setIsLogin(true)} />
              )}
            </div>

          </div>
        )}
      </main>

      {/* Footer tối giản */}
      <footer className="w-full border-t border-[hsl(var(--border))] py-6 z-10 bg-slate-950/20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center text-xs text-[hsl(var(--muted))] gap-4">
          <p>© 2026 MiniFaceBook Project. All rights reserved.</p>
          <div className="flex space-x-6">
            <a href="#privacy" className="hover:underline">Điều khoản bảo mật</a>
            <a href="#terms" className="hover:underline">Điều khoản dịch vụ</a>
            <a href="http://localhost:8080/api/docs" target="_blank" rel="noopener noreferrer" className="hover:underline text-[hsl(var(--primary))] font-semibold">Swagger API Docs</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
