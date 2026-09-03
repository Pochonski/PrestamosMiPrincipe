import React from 'react';
import clsx from 'clsx';
import { Card } from './Card';
import { IconBox } from './IconBox';

export function QuickActionCard({ icon: Icon, label, tone = 'neutral', badge, onClick, className }) {
  const showBadge = badge != null && badge > 0;
  return (
    <Card
      as="button"
      type="button"
      interactive
      padding="sm"
      onClick={onClick}
      className={clsx('flex items-center gap-2.5 text-left', className)}
      aria-label={label}
    >
      <IconBox icon={Icon} tone={tone} size="sm" />
      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-navy-800 dark:text-navy-100">
        {label}
      </span>
      {showBadge && (
        <span className="inline-flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-danger-500 px-1.5 text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
    </Card>
  );
}