import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { authService } from '../services/authService';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Đang xác thực email của bạn...');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Liên kết xác thực không hợp lệ.');
      return;
    }

    void authService.verifyEmail(token)
      .then(() => {
        setStatus('success');
        setMessage('Email đã được xác thực. Bạn có thể đăng nhập ngay bây giờ.');
      })
      .catch((error) => {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Liên kết xác thực không hợp lệ hoặc đã hết hạn.');
      });
  }, [searchParams]);

  const icon = status === 'loading'
    ? <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
    : status === 'success'
      ? <CheckCircle2 className="h-10 w-10 text-emerald-500" />
      : <XCircle className="h-10 w-10 text-rose-500" />;

  return (
    <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50">{icon}</div>
      <h1 className="text-xl font-black text-slate-800">Xác thực email</h1>
      <p className="mt-3 text-sm leading-6 text-slate-500">{message}</p>
      {status !== 'loading' && (
        <Link to="/login" className="mt-6 inline-flex rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white hover:bg-violet-500">
          Đến trang đăng nhập
        </Link>
      )}
    </section>
  );
}
