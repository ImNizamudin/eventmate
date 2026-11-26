import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback(
    (message, tone = 'info') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-2), { id, message, tone }]);
      setTimeout(() => {
        dismiss(id);
      }, 4200);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed bottom-20 right-4 z-50 flex max-w-sm flex-col gap-2 md:bottom-5 md:right-5"
      >
        {toasts.map((toast) => {
          const isError = toast.tone === 'error';
          const isSuccess = toast.tone === 'success';
          return (
            <div
              key={toast.id}
              role="status"
              className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg ${
                isError
                  ? 'border-[#f1c7c7] bg-[#fdeeee] text-[#9e2424]'
                  : isSuccess
                    ? 'border-[#bde4cd] bg-[#eaf7f0] text-[#155e3d]'
                    : 'border-[#d6c8eb] bg-[#24163d] text-white'
              }`}
            >
              {isError ? (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              ) : isSuccess ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              ) : (
                <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              )}
              <span className="flex-1 leading-snug">{toast.message}</span>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Tutup pemberitahuan"
                className="rounded-md p-0.5 opacity-80 hover:opacity-100"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used inside ToastProvider');
  }
  return ctx;
}
