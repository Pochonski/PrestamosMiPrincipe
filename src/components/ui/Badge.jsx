import clsx from 'clsx';

const tones = {
  neutral: 'bg-slate-100 text-navy-700 dark:bg-navy-700 dark:text-navy-100',
  gold: 'bg-gold-50 text-gold-600 dark:bg-gold-500/10 dark:text-gold-300',
  success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  danger: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
  info: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300',
  warning: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
};

export function Badge({ tone = 'neutral', children, className }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export const badgeTone = tones;