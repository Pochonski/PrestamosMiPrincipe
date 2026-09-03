import React from 'react';
import clsx from 'clsx';

export function SocialButton({ icon: Icon, children, onClick, className, ...rest }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'inline-flex w-full items-center justify-center gap-2 rounded-card border px-4 py-3 text-sm font-semibold transition-all duration-200',
        'border-slate-200 bg-white text-navy-800 hover:border-gold-400 hover:bg-gold-50',
        'dark:border-navy-700 dark:bg-navy-800 dark:text-white dark:hover:border-gold-400 dark:hover:bg-navy-700',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-navy-900',
        className,
      )}
      {...rest}
    >
      {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
      {children}
    </button>
  );
}
