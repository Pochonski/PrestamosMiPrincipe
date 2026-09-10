import React from 'react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, Info, Undo2 } from 'lucide-react';
import clsx from 'clsx';

const subscribers = new Set();
const MAX_TOASTS = 3;

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

const TONES = {
  success: 'bg-success-600/70 text-white border-white/20 shadow-glass-dark',
  error: 'bg-danger-600/70 text-white border-white/20 shadow-glass-dark',
  info: 'bg-navy-800/70 text-white border-white/10 shadow-glass-dark dark:bg-black/60',
};

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

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

  const Icon = ICONS[toast.tone] || ICONS.info;

  return (
    <div
      role={toast.tone === 'error' ? 'alert' : 'status'}
      aria-live={toast.tone === 'error' ? 'assertive' : 'polite'}
      className={clsx(
        'glass-strong flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium animate-slide-up',
        TONES[toast.tone] || TONES.info,
      )}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
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
      setToasts((t) => {
        const next = [...t, toast];
        return next.length > MAX_TOASTS ? next.slice(next.length - MAX_TOASTS) : next;
      });
    }
    subscribers.add(sub);
    return () => subscribers.delete(sub);
  }, []);

  function dismiss(id) {
    setToasts((t) => t.filter((x) => x.id !== id));
  }

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="region"
      aria-live="polite"
      aria-label="Notificaciones"
      className="pointer-events-none fixed inset-x-0 top-[calc(1rem+env(safe-area-inset-top))] left-1/2 z-50 mx-auto flex w-fit -translate-x-1/2 max-w-[90vw] flex-col items-center gap-2"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onDone={() => dismiss(t.id)} />
        </div>
      ))}
    </div>,
    document.body,
  );
}
