import { ReactNode, useEffect } from 'react';
import { CircleCheck, CircleX, CircleAlert, CircleQuestionMark, X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  type?: 'modal' | 'toast';
  variant?: 'info' | 'success' | 'error' | 'warning';
  autoClose?: boolean;
  autoCloseDuration?: number;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  type = 'modal',
  variant = 'info',
  autoClose = false,
  autoCloseDuration = 5000
}: ModalProps) {
  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDuration);

      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, autoCloseDuration, onClose]);

  if (!isOpen) return null;

  if (type === 'toast') {
    return (
      <div className={`toast ${variant}`}>
        {variant === 'success' && <CircleCheck size={20} />}
        {variant === 'error' && <CircleX size={20} />}
        {variant === 'warning' && <CircleAlert size={20} />}
        {variant === 'info' && <CircleQuestionMark size={20} />}
        <div className="toast-content">
            <div className="toast-title">{title}</div>
            <div className="toast-description">{children}</div>
        </div>
        <button type="button" className="toast-close" aria-label="Melding sluiten" onClick={onClose}>
          <X size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="modal-content">{children}</div>
      </div>
    </div>
  );
}
