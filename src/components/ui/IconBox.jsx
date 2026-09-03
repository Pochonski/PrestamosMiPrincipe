import React from 'react';
import clsx from 'clsx';

const TONES = {
  neutral: 'bg-neutral-100 text-neutral-600 dark:bg-navy-700 dark:text-navy-200',
  gold: 'bg-gold-50 text-gold-600 dark:bg-gold-500/15 dark:text-gold-300',
  navy: 'bg-navy-50 text-navy-700 dark:bg-navy-700/60 dark:text-navy-100',
  emerald: 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500',
  rose: 'bg-danger-50 text-danger-600 dark:bg-danger-500/15 dark:text-danger-500',
  sky: 'bg-info-50 text-info-600 dark:bg-info-500/15 dark:text-info-500',
  amber: 'bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-500',
};

const SIZES = {
  sm: 'h-9 w-9 rounded-input',
  md: 'h-11 w-11 rounded-card',
  lg: 'h-14 w-14 rounded-card',
};

const ICON_SIZES = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

export function IconBox({ icon: Icon, tone = 'neutral', size = 'md', className, ring = false }) {
  return (
    <div
      className={clsx(
        'flex shrink-0 items-center justify-center',
        TONES[tone],
        SIZES[size],
        ring && 'ring-1 ring-inset ring-current/10',
        className,
      )}
      aria-hidden={Icon ? 'true' : undefined}
    >
      {Icon && <Icon className={ICON_SIZES[size]} />}
    </div>
  );
}
