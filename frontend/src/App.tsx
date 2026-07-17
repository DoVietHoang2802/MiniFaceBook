import { useEffect } from 'react';
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
import PostFeed from './modules/post/components/PostFeed';
import FriendsPage from './modules/friends/components/FriendsPage';
import ChatPage from './modules/chat/components/ChatPage';
import ProfilePage from './modules/profile/components/ProfilePage';
import SettingsPage from './modules/profile/components/SettingsPage';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
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

              {/* Protected routes (chỉ dành cho thành viên đã đăng nhập) */}
              <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                  <Route path="/" element={<PostFeed />} />
                  <Route path="/friends" element={<FriendsPage />} />
                  <Route path="/chats/:recipientId?" element={<ChatPage />} />
                  <Route path="/profile/:userId?" element={<ProfilePage />} />
                  <Route path="/settings" element={<SettingsPage />} />
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
