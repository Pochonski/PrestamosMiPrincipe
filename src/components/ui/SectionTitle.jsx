import clsx from 'clsx';

export function SectionTitle({ title, action, className }) {
  return (
    <div className={clsx('flex items-center justify-between gap-2', className)}>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-navy-300">
        {title}
      </h2>
      {action}
    </div>
  );
}