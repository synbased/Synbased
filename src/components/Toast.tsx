import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { CircleCheck, CircleX, CircleAlert, Info, X } from 'lucide-react';

interface Toast {
  id: string;
  title: string;
  message: string;
  variant: 'info' | 'success' | 'error' | 'warning';
}

interface ToastContextType {
  success: (title: string, message: string) => void;
  error: (title: string, message: string) => void;
  warning: (title: string, message: string) => void;
  info: (title: string, message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((
    title: string,
    message: string,
    variant: 'info' | 'success' | 'error' | 'warning'
  ) => {
    const id = Math.random().toString(36).substring(7);
    const newToast = { id, title, message, variant };
    setToasts(prev => [...prev, newToast]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const success = useCallback((title: string, message: string) => {
    showToast(title, message, 'success');
  }, [showToast]);

  const error = useCallback((title: string, message: string) => {
    showToast(title, message, 'error');
  }, [showToast]);

  const warning = useCallback((title: string, message: string) => {
    showToast(title, message, 'warning');
  }, [showToast]);

  const info = useCallback((title: string, message: string) => {
    showToast(title, message, 'info');
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ success, error, warning, info }}>
      {children}
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          className={`toast ${toast.variant}`}
          style={{ bottom: `${20 + index * 90}px` }}
        >
          {toast.variant === 'success' && <CircleCheck size={20} />}
          {toast.variant === 'error' && <CircleX size={20} />}
          {toast.variant === 'warning' && <CircleAlert size={20} />}
          {toast.variant === 'info' && <Info size={20} />}
          <div className="toast-content">
            <div className="toast-title">{toast.title}</div>
            <div className="toast-description">{toast.message}</div>
          </div>
          <button type="button" className="toast-close" aria-label="Melding sluiten" onClick={() => dismiss(toast.id)}>
            <X size={18} />
          </button>
        </div>
      ))}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
