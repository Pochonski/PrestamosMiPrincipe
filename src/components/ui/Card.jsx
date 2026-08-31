import clsx from 'clsx';

export function Card({ as: Tag = 'div', className, children, ...rest }) {
  return (
    <Tag
      className={clsx(
        'rounded-2xl bg-white dark:bg-navy-800 shadow-card border border-slate-100 dark:border-navy-700/60',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}