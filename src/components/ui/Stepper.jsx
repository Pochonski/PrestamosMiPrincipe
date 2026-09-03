import React from 'react';
import { Check } from 'lucide-react';
import clsx from 'clsx';

export function Stepper({ steps, current, onJump }) {
  return (
    <div className="flex w-full items-center" role="list">
      {steps.map((s, i) => {
        const completed = current > s.num;
        const active = current === s.num;
        const interactive = Boolean(onJump);
        return (
          <div key={s.num} className="flex flex-1 items-center last:flex-none" role="listitem">
            <button
              type="button"
              onClick={() => interactive && onJump?.(s.num)}
              disabled={!interactive}
              aria-current={active ? 'step' : undefined}
              aria-label={`Paso ${s.num}: ${s.label}${completed ? ' (completado)' : active ? ' (actual)' : ''}`}
              className={clsx(
                'flex shrink-0 items-center gap-2 rounded-full transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-navy-900',
                interactive ? 'cursor-pointer hover:opacity-90' : 'cursor-default',
              )}
            >
              <span
                className={clsx(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-all duration-200',
                  completed && 'border-gold-500 bg-gold-500 text-navy-900 shadow-glow',
                  active && 'border-gold-400 bg-white text-gold-600 shadow-sm dark:bg-navy-800 dark:text-gold-300',
                  !completed && !active && 'border-slate-300 bg-white text-slate-400 dark:border-navy-600 dark:bg-navy-800 dark:text-navy-300',
                )}
              >
                {completed ? <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" /> : s.num}
              </span>
              <span
                className={clsx(
                  'hidden text-xs font-semibold sm:inline',
                  active || completed ? 'text-navy-900 dark:text-white' : 'text-neutral-400 dark:text-navy-300',
                )}
              >
                {s.label}
              </span>
            </button>
            {i < steps.length - 1 && (
              <div
                className={clsx(
                  'mx-2 h-0.5 flex-1 rounded-full transition-colors',
                  current > s.num ? 'bg-gold-400' : 'bg-slate-200 dark:bg-navy-700',
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
