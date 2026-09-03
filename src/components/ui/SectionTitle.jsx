import React from 'react';
import clsx from 'clsx';

export function SectionTitle({ title, action, className, description }) {
  return (
    <div className={clsx('flex items-end justify-between gap-3', className)}>
      <div className="min-w-0">
        <h2 className="text-sm font-bold uppercase tracking-wider text-navy-800 dark:text-navy-100 sm:text-base">
          {title}
        </h2>
        {description && (
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-navy-300">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
