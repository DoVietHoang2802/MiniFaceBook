import React, { useEffect, useState } from 'react';
import { AlertCircle, ArrowRight, Loader2, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../core/auth/AuthContext';
import { registerSchema } from '../schemas/authSchema';
import { authService } from '../services/authService';

const OAuthCompleteProfilePage: React.FC = () => {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    authService.getGoogleProfileCompletion()
      .then((response) => setName(response.data.suggestedName ?? ''))
      .catch(() => setHasError(true));
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const displayName = name.normalize('NFC').replace(/\s+/g, ' ').trim();
    setFieldError(null);
    setHasError(false);

    const nameValidation = registerSchema.shape.name.safeParse(displayName);
    if (!nameValidation.success) {
      setFieldError(nameValidation.error.issues[0]?.message ?? 'Vui lòng nhập tên hiển thị.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authService.completeGoogleProfile(displayName);
      setUser(response.data);
      navigate('/', { replace: true });
    } catch {
      setHasError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl border border-slate-200 bg-white shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)] animate-fade-in-up hover:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.12)] transition-all duration-300">
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2 font-outfit">Hoàn tất hồ sơ</h2>
        <p className="text-slate-500 text-sm">Chọn tên hiển thị để tiếp tục với Google.</p>
      </div>

      {hasError && (
        <div className="p-3.5 mb-5 rounded-lg text-sm bg-red-50 border border-red-200 text-red-600 flex items-center space-x-2 animate-shake" role="alert">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Không thể hoàn tất hồ sơ. Vui lòng thử lại.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="oauth-display-name" className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500">
            Tên hiển thị
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
              <User className="h-5 w-5" aria-hidden="true" />
            </span>
            <input
              id="oauth-display-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nguyễn Văn A"
              autoComplete="name"
              required
              maxLength={50}
              disabled={isSubmitting}
              aria-describedby={fieldError ? 'oauth-display-name-error' : undefined}
              className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-lg border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-sm sm:text-base"
            />
          </div>
          {fieldError && <span id="oauth-display-name-error" className="text-red-500 text-xs font-medium block">{fieldError}</span>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 sm:py-3 px-4 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-bold flex items-center justify-center space-x-2 transition-all hover:shadow-lg hover:shadow-violet-500/25 active:scale-[0.98] cursor-pointer text-sm sm:text-base"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin h-5 w-5" aria-hidden="true" />
              <span>Đang hoàn tất...</span>
            </>
          ) : (
            <>
              <span>Tiếp tục</span>
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default OAuthCompleteProfilePage;
