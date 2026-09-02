import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, Info, Undo2 } from 'lucide-react';
import clsx from 'clsx';

let externalShow = null;
const subscribers = new Set();

function emit(toast) {
  subscribers.forEach((fn) => fn(toast));
}

export function showToast(message, tone = 'success', options = {}) {
  const { action, duration = 6000 } = options;
  emit({
    id: Math.random().toString(36).slice(2),
    message,
    tone,
    action,
    duration,
  });
}

function ToastItem({ toast, onDone }) {
  const [dismissed, setDismissed] = useState(false);
  const duration = toast.action ? toast.duration || 8000 : 2600;

  useEffect(() => {
    if (dismissed) return;
    const t = setTimeout(onDone, duration);
    return () => clearTimeout(t);
  }, [onDone, dismissed, duration]);

  if (dismissed) return null;

  const handleAction = () => {
    setDismissed(true);
    try {
      toast.action?.onClick?.();
    } finally {
      onDone();
    }
  };

  const icons = {
    success: <CheckCircle2 className="h-4 w-4" />,
    error: <AlertCircle className="h-4 w-4" />,
    info: <Info className="h-4 w-4" />,
  };

  return (
    <div
      className={clsx(
        'flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium shadow-cardHover animate-slide-up',
        toast.tone === 'success' && 'bg-emerald-600 text-white',
        toast.tone === 'error' && 'bg-rose-600 text-white',
        toast.tone === 'info' && 'bg-navy-800 text-white',
      )}
      role="status"
    >
      {icons[toast.tone] || icons.info}
      <span>{toast.message}</span>
      {toast.action && (
        <button
          type="button"
          onClick={handleAction}
          className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-xs font-bold uppercase tracking-wide transition-colors hover:bg-white/30"
        >
          {toast.action.icon ?? <Undo2 className="h-3 w-3" />}
          {toast.action.label}
        </button>
      )}
    </div>
  );
}

export function ToastViewport() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    function sub(toast) {
      setToasts((t) => [...t, toast]);
    }
    subscribers.add(sub);
    return () => subscribers.delete(sub);
  }, []);

  function dismiss(id) {
    setToasts((t) => t.filter((x) => x.id !== id));
  }

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 top-4 left-1/2 z-50 mx-auto flex w-fit -translate-x-1/2 max-w-[90vw] flex-col items-center gap-2">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onDone={() => dismiss(t.id)} />
        </div>
      ))}
    </div>,
    document.body,
  );
}