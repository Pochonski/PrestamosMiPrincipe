import React from 'react';
import { Plus } from 'lucide-react';
import clsx from 'clsx';

export function ClienteFAB({ onClick, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Nuevo cliente"
      title="Nuevo cliente"
      className={clsx(
        'fixed right-4 z-30 flex h-14 w-14 items-center justify-center rounded-card shadow-glow safe-bottom',
        'bottom-[calc(6rem+env(safe-area-inset-bottom))] sm:bottom-8 lg:right-8 lg:bottom-10',
        'bg-gold-gradient text-navy-900 transition-transform duration-200',
        'hover:scale-105 hover:shadow-cardHover active:scale-95',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-navy-900',
        className,
      )}
    >
      <Plus className="h-6 w-6" strokeWidth={2.5} aria-hidden="true" />
    </button>
  );
}
