import React from 'react';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import clsx from 'clsx';

const SIZES = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-3xl',
  full: 'sm:max-w-5xl',
};

export function ModalShell({
  open,
  onClose,
  title,
  description,
  icon: Icon,
  size = 'md',
  tone = 'default',
  children,
  footer,
  closeOnOverlay = true,
  initialFocusRef,
}) {
  const panelRef = useRef(null);
  const previouslyFocused = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = typeof document !== 'undefined' ? document.activeElement : null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKeyDown(e) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current?.();
      }
    }
    document.addEventListener('keydown', onKeyDown);

    const focusTarget = initialFocusRef?.current || panelRef.current;
    if (focusTarget) {
      requestAnimationFrame(() => focusTarget.focus());
    }

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
      if (previouslyFocused.current && typeof previouslyFocused.current.focus === 'function') {
        previouslyFocused.current.focus();
      }
    };
  }, [open]);

  if (!open) return null;
  if (typeof document === 'undefined') return null;

  const headerTone = {
    default: 'border-b border-slate-200 dark:border-navy-700',
    danger: 'border-b border-danger-500/30 bg-danger-50/40 dark:bg-danger-500/10',
    success: 'border-b border-success-500/30 bg-success-50/40 dark:bg-success-500/10',
  };

  const titleTone = {
    default: 'text-navy-900 dark:text-white',
    danger: 'text-danger-700 dark:text-danger-500',
    success: 'text-success-700 dark:text-success-500',
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Cerrar diálogo"
        onClick={() => closeOnOverlay && onClose?.()}
        className={clsx(
          'absolute inset-0 bg-navy-900/60 backdrop-blur-sm transition-opacity duration-200 animate-fade-in',
          !closeOnOverlay && 'cursor-default',
        )}
      />

      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={description ? 'modal-description' : undefined}
        className={clsx(
          'relative z-10 flex w-full max-h-[95vh] flex-col overflow-hidden bg-white shadow-modal dark:bg-navy-800',
          'rounded-t-modal sm:rounded-modal',
          'border border-slate-100 dark:border-navy-700/60',
          'animate-slide-up-mobile sm:animate-slide-up',
          'focus:outline-none',
          SIZES[size],
        )}
      >
        <header className={clsx('flex shrink-0 items-start gap-3 px-5 py-4 sm:px-6', headerTone[tone] || headerTone.default)}>
          {Icon && (
            <span
              className={clsx(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-card ring-1 ring-inset ring-current/10',
                tone === 'danger' && 'bg-danger-50 text-danger-600 dark:bg-danger-500/15 dark:text-danger-500',
                tone === 'success' && 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500',
                tone === 'default' && 'bg-gold-50 text-gold-600 dark:bg-gold-500/15 dark:text-gold-300',
              )}
              aria-hidden="true"
            >
              <Icon className="h-5 w-5" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h2 id="modal-title" className={clsx('text-base font-bold sm:text-lg', titleTone[tone] || titleTone.default)}>
              {title}
            </h2>
            {description && (
              <p id="modal-description" className="mt-0.5 text-sm text-neutral-600 dark:text-navy-300">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-input text-neutral-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-navy-300 dark:hover:bg-navy-700 dark:focus-visible:ring-offset-navy-800"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5 scrollbar-thin sm:px-6">{children}</div>

        {footer && (
          <footer className="flex shrink-0 items-center justify-between gap-2 border-t border-slate-200 bg-white/80 px-5 py-4 backdrop-blur-md dark:border-navy-700 dark:bg-navy-800/80 sm:px-6">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
}
