import { memo } from 'react';
import clsx from 'clsx';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from './Card';

export const StatCard = memo(function StatCard({ label, value, sub, icon: Icon, tone = 'neutral', delta }) {
  const tones = {
    neutral: 'text-navy-700 dark:text-navy-100',
    gold: 'text-gold-500',
    success: 'text-emerald-600 dark:text-emerald-400',
    danger: 'text-rose-600 dark:text-rose-400',
    info: 'text-sky-600 dark:text-sky-400',
    navy: 'text-navy-700 dark:text-navy-100',
    emerald: 'text-emerald-600 dark:text-emerald-400',
  };

  const iconBg = {
    navy: 'bg-navy-50 text-navy-700 dark:bg-navy-700/50 dark:text-navy-100',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300',
  };
  void iconBg;
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-navy-300">
            {label}
          </p>
          <p className={clsx('mt-1.5 text-2xl font-bold tabular-nums sm:text-3xl', tones[tone])}>
            {value}
          </p>
          {sub && (
            <p className="mt-1 text-xs text-slate-500 dark:text-navy-300">{sub}</p>
          )}
          {typeof delta === 'number' && (
            <p
              className={clsx(
                'mt-2 inline-flex items-center gap-1 text-xs font-medium',
                delta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
              )}
            >
              {delta >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {Math.abs(delta).toFixed(1)}%
            </p>
          )}
        </div>
        {Icon && (
          <div
            className={clsx(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
              tone === 'gold' && 'bg-gold-50 text-gold-500 dark:bg-gold-500/10',
              tone === 'success' && 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10',
              tone === 'danger' && 'bg-rose-50 text-rose-600 dark:bg-rose-500/10',
              tone === 'info' && 'bg-sky-50 text-sky-600 dark:bg-sky-500/10',
              tone === 'neutral' && 'bg-slate-100 text-navy-700 dark:bg-navy-700 dark:text-navy-100',
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </Card>
  );
});