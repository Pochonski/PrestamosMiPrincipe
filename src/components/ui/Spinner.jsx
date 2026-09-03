import React from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

const SIZES = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

const TONES = {
  gold: 'text-gold-500',
  navy: 'text-navy-700 dark:text-navy-200',
  neutral: 'text-neutral-500 dark:text-navy-300',
  white: 'text-white',
};

export function Spinner({ size = 'md', tone = 'gold', label = 'Cargando', className }) {
  return (
    <span
      role="status"
      aria-live="polite"
      className={clsx('inline-flex items-center gap-2', className)}
    >
      <Loader2 className={clsx('animate-spin', SIZES[size], TONES[tone])} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  );
}
