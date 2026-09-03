import React from 'react';
import { memo, useMemo } from 'react';
import clsx from 'clsx';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { Card } from './Card';
import { IconBox } from './IconBox';

const SPARK_TONES = {
  neutral: '#94A3B8',
  gold: '#D4AF37',
  success: '#10B981',
  danger: '#F43F5E',
  info: '#0EA5E9',
  navy: '#334155',
};

function Sparkline({ data, tone = 'neutral' }) {
  if (!data || data.length < 2) return null;
  const stroke = SPARK_TONES[tone];
  const points = data.map((v, i) => ({ i, v: Number(v) || 0 }));
  return (
    <div className="mt-3 h-9 w-full" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`spark-${tone}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={stroke}
            strokeWidth={1.5}
            fill={`url(#spark-${tone})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export const StatCard = memo(function StatCard({ label, value, sub, icon: Icon, tone = 'neutral', delta, spark, className }) {
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
    <Card padding="md" hover className={className}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-navy-300">
            {label}
          </p>
          <p className={clsx('mt-1.5 text-xl font-bold tabular-nums sm:text-2xl lg:text-3xl', valueTone[tone] || valueTone.neutral)}>
            {value}
          </p>
          {sub && (
            <p className="mt-1 text-xs text-neutral-500 dark:text-navy-300">{sub}</p>
          )}
          {spark && <Sparkline data={spark} tone={tone} />}
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
