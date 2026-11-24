import { CheckCircle2, X } from 'lucide-react';

export interface ToastItem {
  id: number;
  message: string;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed right-4 bottom-5 left-4 z-[70] flex flex-col items-center gap-2 sm:right-auto sm:left-6 sm:items-start"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          data-testid="toast-notification"
          className="pointer-events-auto flex items-center gap-3 rounded-xl border border-[#D4AF37]/60 bg-[#12192B]/95 px-4 py-3 text-sm font-semibold text-[#F4F1EA] shadow-2xl backdrop-blur-md"
        >
          <CheckCircle2
            className="h-4 w-4 shrink-0 text-[#D4AF37]"
            aria-hidden="true"
          />
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            aria-label="إغلاق الإشعار"
            className="cursor-pointer rounded p-1 text-[#9C978B] hover:text-[#F4F1EA]"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
}
