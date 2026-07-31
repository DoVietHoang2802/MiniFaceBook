import { useLayoutEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './core/auth/AuthContext';
import { ToastProvider } from './core/toast/ToastContext';
import { ThemeProvider } from './core/theme/ThemeContext';
import GuestRoute from './components/layout/GuestRoute';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AuthLayout from './components/layout/AuthLayout';
import MainLayout from './components/layout/MainLayout';
import LoginForm from './modules/auth/components/LoginForm';
import RegisterForm from './modules/auth/components/RegisterForm';
import ForgotPasswordForm from './modules/auth/components/ForgotPasswordForm';
import OAuthCallbackPage from './modules/auth/components/OAuthCallbackPage';
import OAuthCompleteProfilePage from './modules/auth/components/OAuthCompleteProfilePage';
import PostFeed from './modules/post/components/PostFeed';
import SearchPage from './modules/post/components/SearchPage';
import FriendsPage from './modules/friends/components/FriendsPage';
import ChatPage from './modules/chat/components/ChatPage';
import ProfilePage from './modules/profile/components/ProfilePage';
import SettingsPage from './modules/profile/components/SettingsPage';
import { AdminRoute } from './components/layout/AdminRoute';
import { AdminLayout } from './components/layout/AdminLayout';
import { AdminDashboardPage } from './modules/admin/pages/AdminDashboardPage';

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
                <Route element={<AuthLayout />}>
                  <Route path="/login" element={<LoginForm />} />
                  <Route path="/register" element={<RegisterForm />} />
                  <Route path="/forgot-password" element={<ForgotPasswordForm />} />
                </Route>
              </Route>

              <Route element={<AuthLayout />}>
                <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
                <Route path="/oauth/complete-profile" element={<OAuthCompleteProfilePage />} />
              </Route>

              {/* Protected routes (chỉ dành cho thành viên đã đăng nhập) */}
              <Route element={<ProtectedRoute />}>
                {/* Layout người dùng mạng xã hội */}
                <Route element={<MainLayout />}>
                  <Route path="/" element={<PostFeed />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/friends" element={<FriendsPage />} />
                  <Route path="/chats/:recipientId?" element={<ChatPage />} />
                  <Route path="/profile/:userId?" element={<ProfilePage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>

                {/* Standalone Admin Portal Layout */}
                <Route element={<AdminRoute />}>
                  <Route element={<AdminLayout />}>
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
