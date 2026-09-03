import React from 'react';
import { Card } from './Card';
import { IconBox } from './IconBox';

const VARIANTS = {
  default: 'neutral',
  info: 'info',
  success: 'emerald',
  warning: 'amber',
  danger: 'rose',
};

export function EmptyState({ icon: Icon, title, description, action, variant = 'default', className }) {
  return (
    <Card className={`flex flex-col items-center gap-3 p-8 text-center ${className || ''}`}>
      {Icon && <IconBox icon={Icon} tone={VARIANTS[variant] || 'neutral'} size="lg" ring />}
      <div className="max-w-sm">
        <h3 className="text-base font-bold text-navy-900 dark:text-white">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-neutral-600 dark:text-navy-300">{description}</p>
        )}
      </div>
      {action}
    </Card>
  );
}
