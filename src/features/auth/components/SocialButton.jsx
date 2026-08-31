import clsx from 'clsx';

export function SocialButton({ icon: Icon, children, onClick, className, ...rest }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'inline-flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all',
        'border-slate-200 bg-white text-navy-800 hover:border-gold-400 hover:bg-gold-50',
        'dark:border-navy-700 dark:bg-navy-800 dark:text-white dark:hover:border-gold-400 dark:hover:bg-navy-700',
        className,
      )}
      {...rest}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  );
}