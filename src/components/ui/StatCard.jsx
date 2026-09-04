import React from 'react';
import { memo, useMemo } from 'react';
import clsx from 'clsx';
import { TrendingUp, TrendingDown } from 'lucide-react';
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

function monotonePath(values, width, height, padding = 2) {
  if (values.length < 2) return '';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = (width - padding * 2) / (values.length - 1);
  const x = (i) => padding + i * stepX;
  const y = (v) => padding + (height - padding * 2) * (1 - (v - min) / range);
  const pts = values.map((v, i) => [x(i), y(v)]);
  const line = pts.map((p) => p.map((n) => n.toFixed(2)).join(',')).join(' ');
  const area = `${line} ${x(values.length - 1).toFixed(2)},${height} ${x(0).toFixed(2)},${height}`;
  return { line, area };
}

function Sparkline({ data, tone = 'neutral' }) {
  if (!data || data.length < 2) return null;
  const stroke = SPARK_TONES[tone];
  const values = data.map((v) => Number(v) || 0);
  const width = 200;
  const height = 36;
  const { line, area } = monotonePath(values, width, height);
  const gid = `spark-${tone}`;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="mt-3 h-9 w-full"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
          <stop offset="100%" stopColor={stroke} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gid})`} />
      <polyline points={line} fill="none" stroke={stroke} strokeWidth={1.5} />
    </svg>
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
