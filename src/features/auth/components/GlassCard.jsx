import React from 'react';
import clsx from 'clsx';

export function GlassCard({ className, children, ...rest }) {
  return (
    <div
      className={clsx(
        'rounded-modal border backdrop-blur-md shadow-card',
        'bg-white/85 border-white/40',
        'dark:bg-navy-800/80 dark:border-white/10',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
