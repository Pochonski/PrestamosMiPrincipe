import React from 'react';
import clsx from 'clsx';
import { AlertTriangle, AlertCircle, CheckCircle2, Info } from 'lucide-react';

const TONES = {
  danger: {
    wrap: 'border-danger-500/40 bg-danger-50 text-danger-700 dark:bg-danger-500/10 dark:text-danger-500',
    Icon: AlertCircle,
  },
  warning: {
    wrap: 'border-warning-500/40 bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-500',
    Icon: AlertTriangle,
  },
  success: {
    wrap: 'border-success-500/40 bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-500',
    Icon: CheckCircle2,
  },
  info: {
    wrap: 'border-info-500/40 bg-info-50 text-info-700 dark:bg-info-500/10 dark:text-info-500',
    Icon: Info,
  },
};

export function Alert({ tone = 'info', title, children, action, className }) {
  const toneStyle = TONES[tone] || TONES.info;
  const Icon = toneStyle.Icon;
  return (
    <div
      role={tone === 'danger' || tone === 'warning' ? 'alert' : 'status'}
      aria-live={tone === 'danger' ? 'assertive' : 'polite'}
      className={clsx(
        'flex items-start gap-2.5 rounded-card border p-3 text-sm',
        toneStyle.wrap,
        className,
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {title && (
          <p className="text-xs font-bold uppercase tracking-wider opacity-90">{title}</p>
        )}
        <div className="text-sm leading-snug">{children}</div>
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  );
}
