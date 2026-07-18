import * as Sentry from '@sentry/react';

/**
 * Khởi tạo Sentry cho Frontend (Sprint 6.5).
 * Không set VITE_SENTRY_DSN → tắt hoàn toàn (local/CI không spam).
 */
export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) {
    if (import.meta.env.DEV) {
      console.info('[Sentry] Tắt — chưa có VITE_SENTRY_DSN (file .env.local?)');
    }
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    sendDefaultPii: false,
    tracesSampleRate: 0,
  });

  if (import.meta.env.DEV) {
    console.info('[Sentry] Đã bật (env=%s). Test: window.__sentryTest()', import.meta.env.MODE);
    // Gọi từ DevTools: window.__sentryTest() → Issues trên sentry.io
    (window as unknown as { __sentryTest?: () => void }).__sentryTest = () => {
      const err = new Error(`Sentry FE test ${new Date().toISOString()}`);
      Sentry.captureException(err);
      console.info('[Sentry] Đã gửi test event — đợi 10–60s rồi mở Issues (filter env: development)');
    };
  }
}

export { Sentry };
