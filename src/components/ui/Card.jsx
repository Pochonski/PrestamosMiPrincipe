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
        'glass rounded-card',
        // `glass` prop kept for backwards compat (glass is now the default)
        glass && 'glass',
        PAD[padding],
        hover && 'transition-all duration-200 hover:shadow-glass-strong',
        (hover || interactive) && 'glass-glare',
        interactive &&
          'cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glass-strong hover:border-white/70 dark:hover:border-white/20 active:translate-y-0',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}));
