import React from 'react';
import clsx from 'clsx';

const tones = {
  neutral: 'bg-white border-slate-200 text-navy-700 hover:bg-slate-50 dark:bg-navy-800 dark:border-navy-700 dark:text-navy-100 dark:hover:bg-navy-700/70',
  gold: 'bg-gold-50/60 border-gold-200 text-gold-700 hover:bg-gold-50 hover:border-gold-400 dark:bg-gold-500/10 dark:border-gold-500/30 dark:text-gold-300 dark:hover:bg-gold-500/15',
  danger: 'bg-danger-50/60 border-danger-500/30 text-danger-700 hover:bg-danger-50 hover:border-danger-500 dark:bg-danger-500/10 dark:border-danger-500/40 dark:text-danger-500 dark:hover:bg-danger-500/20',
  info: 'bg-info-50/60 border-info-500/30 text-info-700 hover:bg-info-50 hover:border-info-500 dark:bg-info-500/10 dark:border-info-500/40 dark:text-info-500 dark:hover:bg-info-500/20',
};

export function QuickChip({ icon: Icon, label, badge, tone = 'neutral', onClick, active, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'group relative inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-navy-900',
        active && 'ring-2 ring-gold-400 ring-offset-2 ring-offset-white dark:ring-offset-navy-900',
        tones[tone],
        className,
      )}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />}
      <span className="whitespace-nowrap">{label}</span>
      {badge != null && badge > 0 && (
        <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-danger-500 px-1.5 text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
    </button>
  );
}
