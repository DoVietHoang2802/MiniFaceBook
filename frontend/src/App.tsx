import { lazy, Suspense, useLayoutEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './core/auth/AuthContext';
import { ToastProvider } from './core/toast/ToastContext';
import { ThemeProvider } from './core/theme/ThemeContext';
import GuestRoute from './components/layout/GuestRoute';
import ProtectedRoute from './components/layout/ProtectedRoute';
import { AdminRoute } from './components/layout/AdminRoute';

const AuthLayout = lazy(() => import('./components/layout/AuthLayout'));
const MainLayout = lazy(() => import('./components/layout/MainLayout'));
const LoginForm = lazy(() => import('./modules/auth/components/LoginForm'));
const RegisterForm = lazy(() => import('./modules/auth/components/RegisterForm'));
const ForgotPasswordForm = lazy(() => import('./modules/auth/components/ForgotPasswordForm'));
const OAuthCallbackPage = lazy(() => import('./modules/auth/components/OAuthCallbackPage'));
const OAuthCompleteProfilePage = lazy(() => import('./modules/auth/components/OAuthCompleteProfilePage'));
const VerifyEmailPage = lazy(() => import('./modules/auth/components/VerifyEmailPage'));
const PostFeed = lazy(() => import('./modules/post/components/PostFeed'));
const SearchPage = lazy(() => import('./modules/post/components/SearchPage'));
const FriendsPage = lazy(() => import('./modules/friends/components/FriendsPage'));
const ChatPage = lazy(() => import('./modules/chat/components/ChatPage'));
const ProfilePage = lazy(() => import('./modules/profile/components/ProfilePage'));
const SettingsPage = lazy(() => import('./modules/profile/components/SettingsPage'));
const AdminLayout = lazy(async () => ({
  default: (await import('./components/layout/AdminLayout')).AdminLayout,
}));
const AdminDashboardPage = lazy(async () => ({
  default: (await import('./modules/admin/pages/AdminDashboardPage')).AdminDashboardPage,
}));

function PageLoader() {
  return <div className="min-h-screen bg-slate-50" aria-label="Đang tải trang" />;
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    const scrollToRouteStart = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      if (document.scrollingElement) document.scrollingElement.scrollTop = 0;
    };

    // Reset once before paint and once after route layout settles. This prevents
    // a fixed-height screen such as Chat from inheriting the previous tab's scroll offset.
    scrollToRouteStart();
    const frame = window.requestAnimationFrame(scrollToRouteStart);
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  return null;
}

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              {/* Guest routes (chỉ dành cho khách chưa đăng nhập) */}
              <Route element={<GuestRoute />}>
                <Route element={<Suspense fallback={<PageLoader />}><AuthLayout /></Suspense>}>
                  <Route path="/login" element={<LoginForm />} />
                  <Route path="/register" element={<RegisterForm />} />
                  <Route path="/forgot-password" element={<ForgotPasswordForm />} />
                </Route>
              </Route>

              <Route element={<Suspense fallback={<PageLoader />}><AuthLayout /></Suspense>}>
                <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
                <Route path="/oauth/complete-profile" element={<OAuthCompleteProfilePage />} />
                <Route path="/verify" element={<VerifyEmailPage />} />
              </Route>

              {/* Protected routes (chỉ dành cho thành viên đã đăng nhập) */}
              <Route element={<ProtectedRoute />}>
                {/* Layout người dùng mạng xã hội */}
                <Route element={<Suspense fallback={<PageLoader />}><MainLayout /></Suspense>}>
                  <Route path="/" element={<PostFeed />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/friends" element={<FriendsPage />} />
                  <Route path="/chats/:recipientId?" element={<ChatPage />} />
                  <Route path="/profile/:userId?" element={<ProfilePage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>

                {/* Standalone Admin Portal Layout */}
                <Route element={<AdminRoute />}>
                  <Route element={<Suspense fallback={<PageLoader />}><AdminLayout /></Suspense>}>
                    <Route path="/admin" element={<AdminDashboardPage />} />
                  </Route>
                </Route>
              </Route>

              {/* Điều hướng mặc định */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
