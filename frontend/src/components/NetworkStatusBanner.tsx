import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

/**
 * Banner hiển thị trạng thái mất kết nối Internet (chuẩn Facebook/Discord).
 * - Mất mạng → banner đỏ trượt xuống từ trên
 * - Có lại mạng → banner xanh "Đã kết nối lại" hiện 3s rồi tự ẩn
 */
export function NetworkStatusBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3000);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 py-2 px-4 text-sm font-semibold text-white transition-all duration-300 ${
        !isOnline
          ? 'bg-red-600 animate-slide-down'
          : 'bg-emerald-600 animate-slide-down'
      }`}
    >
      {!isOnline ? (
        <>
          <WifiOff className="h-4 w-4" />
          <span>Mất kết nối Internet. Đang chờ kết nối lại...</span>
        </>
      ) : (
        <>
          <Wifi className="h-4 w-4" />
          <span>Đã kết nối lại thành công!</span>
        </>
      )}
    </div>
  );
}
