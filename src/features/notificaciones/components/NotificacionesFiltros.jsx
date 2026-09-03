import React from 'react';
import clsx from 'clsx';

export function NotificacionesFiltros({ value, onChange, counts }) {
  const opts = [
    { id: 'todas', label: 'Todas', count: counts.total },
    { id: 'no-leidas', label: 'No leídas', count: counts.noLeidas },
  ];

  return (
    <div className="flex gap-2">
      {opts.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          aria-pressed={value === o.id}
          className={clsx(
            'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-navy-900',
            value === o.id
              ? 'border-gold-400 bg-gold-50 text-gold-700 dark:bg-gold-500/15 dark:text-gold-300'
              : 'border-slate-200 bg-white text-navy-700 hover:bg-slate-50 dark:border-navy-700 dark:bg-navy-800 dark:text-navy-100 dark:hover:bg-navy-700',
          )}
        >
          {o.label}
          <span
            className={clsx(
              'inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold',
              value === o.id
                ? 'bg-gold-500 text-navy-900'
                : 'bg-slate-200 text-slate-700 dark:bg-navy-700 dark:text-navy-200',
            )}
          >
            {o.count}
          </span>
        </button>
      ))}
    </div>
  );
}
