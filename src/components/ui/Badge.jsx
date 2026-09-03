import React from 'react';
import clsx from 'clsx';

const tones = {
  neutral: 'bg-neutral-100 text-navy-700 dark:bg-navy-700 dark:text-navy-100',
  gold: 'bg-gold-50 text-gold-700 dark:bg-gold-500/15 dark:text-gold-300',
  success: 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500',
  danger: 'bg-danger-50 text-danger-700 dark:bg-danger-500/15 dark:text-danger-500',
  info: 'bg-info-50 text-info-700 dark:bg-info-500/15 dark:text-info-500',
  warning: 'bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-500',
};

export function Badge({ tone = 'neutral', children, className, icon: Icon }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {Icon && <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />}
      {children}
    </span>
  );
}

export const badgeTone = tones;
