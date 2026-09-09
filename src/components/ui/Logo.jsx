import React from 'react';
import clsx from 'clsx';

export function Logo({ withText = true, size = 'md', className, onClick }) {
  const sizes = {
    sm: { box: 'h-7 w-7 rounded-input', icon: 'h-4 w-4', text: 'text-sm' },
    md: { box: 'h-9 w-9 rounded-card', icon: 'h-5 w-5', text: 'text-base' },
    lg: { box: 'h-12 w-12 rounded-card', icon: 'h-6 w-6', text: 'text-lg' },
  };
  const s = sizes[size];
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={clsx(
        'inline-flex items-center gap-2.5',
        onClick && 'rounded-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black',
        className,
      )}
    >
      <span
        className={clsx(
          'flex items-center justify-center bg-gold-gradient shadow-glow',
          s.box,
        )}
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" fill="none" className={s.icon}>
          <path
            d="M5 16 L6.5 9 L9.5 12 L12 7 L14.5 12 L17.5 9 L19 16 Z"
            fill="currentColor"
            className="text-navy-900"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinejoin="round"
          />
          <circle cx="6.5" cy="8" r="1.1" fill="currentColor" className="text-navy-900" />
          <circle cx="12" cy="6" r="1.25" fill="currentColor" className="text-navy-900" />
          <circle cx="17.5" cy="8" r="1.1" fill="currentColor" className="text-navy-900" />
          <rect x="5" y="16.5" width="14" height="1.5" rx="0.6" fill="currentColor" className="text-navy-900" />
        </svg>
      </span>
      {withText && (
        <span className={clsx('font-display font-bold tracking-tight text-navy-900 dark:text-white', s.text)}>
          Mi <span className="text-gold-500">Príncipe</span>
        </span>
      )}
    </Wrapper>
  );
}
