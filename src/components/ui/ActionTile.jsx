import React from 'react';
import clsx from 'clsx';

export function ActionTile({ icon: Icon, title, description, tone = 'gold', onClick, className }) {
  const tones = {
    gold: 'from-gold-300 via-gold-400 to-gold-600 text-navy-900',
    navy: 'from-navy-700 via-navy-800 to-navy-900 text-white',
    emerald: 'from-success-500 via-success-600 to-success-700 text-white',
    sky: 'from-info-500 via-info-600 to-info-700 text-white',
    rose: 'from-danger-500 via-danger-600 to-danger-700 text-white',
  };
  const textTone = tone === 'gold' ? 'text-navy-900' : 'text-white';
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'group relative overflow-hidden rounded-card text-left transition-all duration-200 ease-out',
        'shadow-card hover:shadow-cardHover hover:-translate-y-0.5 active:translate-y-0',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-navy-900',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className,
      )}
    >
      <div className={clsx('absolute inset-0 bg-gradient-to-br', tones[tone])} />
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl transition-all duration-500 group-hover:scale-125" />
      <div className="absolute inset-0 bg-gold-shine opacity-0 transition-opacity duration-700 group-hover:opacity-60" />
      <div className="relative flex items-start gap-3 p-4 sm:p-5">
        <div
          className={clsx(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-input bg-white/20 backdrop-blur-sm sm:h-12 sm:w-12',
          )}
        >
          {Icon && <Icon className={clsx('h-5 w-5 sm:h-6 sm:w-6', textTone)} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className={clsx('text-base font-bold sm:text-lg', textTone)}>{title}</p>
          {description && (
            <p className={clsx('mt-0.5 text-xs opacity-90 sm:text-sm', textTone)}>{description}</p>
          )}
        </div>
      </div>
    </button>
  );
}
