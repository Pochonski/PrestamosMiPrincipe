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
        onClick && 'rounded-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-navy-900',
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
            d="M3 18l3-10h2l1.5 4.5L11 8h2l1.5 4.5L15 8h2l3 10h-2.5l-1.5-5-1.5 5h-2l-1.5-5-1.5 5H3z"
            fill="currentColor"
            className="text-navy-900"
          />
        </svg>
      </span>
      {withText && (
        <span className={clsx('font-extrabold tracking-tight text-navy-900 dark:text-white', s.text)}>
          Mi <span className="text-gold-500">Príncipe</span>
        </span>
      )}
    </Wrapper>
  );
}
