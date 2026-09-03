import React from 'react';
import { memo, useMemo } from 'react';
import clsx from 'clsx';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from './Card';
import { IconBox } from './IconBox';

export const StatCard = memo(function StatCard({ label, value, sub, icon: Icon, tone = 'neutral', delta }) {
  const valueTone = {
    neutral: 'text-navy-800 dark:text-navy-50',
    gold: 'text-gold-500 dark:text-gold-400',
    success: 'text-success-600 dark:text-success-500',
    danger: 'text-danger-600 dark:text-danger-500',
    info: 'text-info-600 dark:text-info-500',
    navy: 'text-navy-800 dark:text-navy-50',
  };

  const iconTone = useMemo(() => {
    if (tone === 'gold' || tone === 'success' || tone === 'danger' || tone === 'info') return tone;
    return 'neutral';
  }, [tone]);

  return (
    <Card padding="md" hover>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-navy-300">
            {label}
          </p>
          <p className={clsx('mt-1.5 text-2xl font-bold tabular-nums sm:text-3xl', valueTone[tone] || valueTone.neutral)}>
            {value}
          </p>
          {sub && (
            <p className="mt-1 text-xs text-neutral-500 dark:text-navy-300">{sub}</p>
          )}
          {typeof delta === 'number' && (
            <p
              className={clsx(
                'mt-2 inline-flex items-center gap-1 text-xs font-semibold',
                delta >= 0 ? 'text-success-600 dark:text-success-500' : 'text-danger-600 dark:text-danger-500',
              )}
            >
              {delta >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {Math.abs(delta).toFixed(1)}%
            </p>
          )}
        </div>
        {Icon && <IconBox icon={Icon} tone={iconTone} size="md" />}
      </div>
    </Card>
  );
});
