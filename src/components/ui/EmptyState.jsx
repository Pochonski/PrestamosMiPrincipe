import clsx from 'clsx';
import { Card } from './Card';

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <Card
      className={clsx(
        'flex flex-col items-center gap-3 p-8 text-center',
        className,
      )}
    >
      {Icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-navy-700 dark:text-navy-300">
          <Icon className="h-7 w-7" />
        </div>
      )}
      <div>
        <h3 className="text-base font-bold text-navy-900 dark:text-white">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-slate-600 dark:text-navy-300">{description}</p>
        )}
      </div>
      {action}
    </Card>
  );
}