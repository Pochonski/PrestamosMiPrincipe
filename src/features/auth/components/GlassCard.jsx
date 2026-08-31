import clsx from 'clsx';

export function GlassCard({ className, children, ...rest }) {
  return (
    <div
      className={clsx(
        'rounded-3xl border backdrop-blur-md shadow-card',
        'bg-white/80 border-white/40 shadow-card',
        'dark:bg-navy-800/80 dark:border-white/10',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}