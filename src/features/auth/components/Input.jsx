import { forwardRef } from 'react';
import clsx from 'clsx';

const VARIANTS = {
  default:
    'bg-white text-navy-900 placeholder:text-slate-400 border-slate-200 ' +
    'focus-within:border-gold-400 focus-within:ring-2 focus-within:ring-gold-400/20 ' +
    'dark:bg-navy-800 dark:text-white dark:placeholder:text-navy-300 dark:border-navy-700',
  glass:
    'bg-white/10 text-white placeholder:text-white/50 border-white/20 ' +
    'focus-within:border-gold-400 focus-within:ring-2 focus-within:ring-gold-400/30 ' +
    'backdrop-blur-md',
};

const SIZES = {
  md: 'h-12 px-4 text-sm rounded-xl',
  lg: 'h-14 px-5 text-base rounded-2xl',
};

export const Input = forwardRef(function Input(
  { label, hint, error, icon: Icon, trailing, variant = 'default', size = 'md', className, ...rest },
  ref,
) {
  const hasError = Boolean(error);
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 flex items-center justify-between text-sm font-medium text-navy-700 dark:text-navy-100">
          <span>{label}</span>
          {hint && <span className="text-[10px] font-normal text-slate-400 dark:text-navy-300">{hint}</span>}
        </span>
      )}
      <div
        className={clsx(
          'flex items-center gap-2 border transition-colors',
          VARIANTS[variant],
          SIZES[size],
          hasError && 'border-rose-400 focus-within:border-rose-400 focus-within:ring-rose-400/20',
          className,
        )}
      >
        {Icon && <Icon className="h-4 w-4 shrink-0 opacity-60" />}
        <input
          ref={ref}
          className="min-w-0 flex-1 bg-transparent outline-none placeholder:opacity-60"
          {...rest}
        />
        {trailing && <div className="shrink-0">{trailing}</div>}
      </div>
      {error && (
        <p className="mt-1.5 text-xs font-medium text-rose-500 dark:text-rose-400">{error}</p>
      )}
    </label>
  );
});