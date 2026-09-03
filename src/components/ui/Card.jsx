import React from 'react';
import { memo, forwardRef } from 'react';
import clsx from 'clsx';

const PAD = {
  none: 'p-0',
  sm: 'p-3 sm:p-4',
  md: 'p-4 sm:p-5',
  lg: 'p-5 sm:p-6',
};

export const Card = memo(forwardRef(function Card(
  { as: Tag = 'div', padding = 'md', hover = false, interactive = false, glass = false, className, children, ...rest },
  ref,
) {
  return (
    <Tag
      ref={ref}
      className={clsx(
        'rounded-card border bg-white dark:bg-navy-800 shadow-card border-slate-100 dark:border-navy-700/60',
        glass && 'glass',
        PAD[padding],
        hover && 'transition-all duration-200 hover:shadow-cardHover',
        interactive &&
          'cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-cardHover hover:border-gold-300 dark:hover:border-gold-500/40 active:translate-y-0',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}));
