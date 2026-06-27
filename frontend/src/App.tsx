import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './core/auth/AuthContext';
import { ToastProvider } from './core/toast/ToastContext';
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

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
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
              </Route>
            </Route>

            {/* Điều hướng mặc định */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
