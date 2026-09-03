import React from 'react';
import clsx from 'clsx';

export function Skeleton({ className, rounded = 'rounded-input', children, ...rest }) {
  return (
    <div
      className={clsx(
        'relative overflow-hidden bg-neutral-200/70 dark:bg-navy-700/60',
        rounded,
        className,
      )}
      aria-hidden="true"
      {...rest}
    >
      <div className="absolute inset-0 shimmer" />
      {children}
    </div>
  );
}

export function SkeletonText({ lines = 1, lastWidth = '70%', className }) {
  return (
    <div className={clsx('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-3.5"
          style={i === lines - 1 ? { width: lastWidth } : undefined}
        />
      ))}
    </div>
  );
}
