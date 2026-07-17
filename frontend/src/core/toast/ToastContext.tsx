import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

interface ToastContextType {
  triggerToast: (msg: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const value = useMemo(() => ({ triggerToast }), [triggerToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-2xl text-slate-800 text-xs font-bold tracking-wide flex items-center space-x-2 z-[999999] animate-fade-in-up">
          <div className="h-2 w-2 rounded-full bg-violet-600 animate-pulse"></div>
          <span>{toastMessage}</span>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
