import React from 'react';
import { forwardRef } from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary:
    'bg-gold-gradient text-navy-900 shadow-glow hover:shadow-cardHover ' +
    'hover:brightness-[1.03] active:brightness-100 ' +
    'border border-gold-500/40',
  secondary:
    'bg-white text-navy-800 border border-slate-200 shadow-card ' +
    'hover:bg-slate-50 hover:border-slate-300 ' +
    'dark:bg-navy-800 dark:text-navy-100 dark:border-navy-700 dark:hover:bg-navy-700/70 dark:hover:border-navy-600',
  outline:
    'bg-transparent text-navy-800 border border-slate-300 ' +
    'hover:bg-slate-100 hover:border-slate-400 ' +
    'dark:text-navy-100 dark:border-navy-600 dark:hover:bg-navy-800 dark:hover:border-navy-500',
  ghost:
    'bg-transparent text-navy-700 hover:bg-slate-100 ' +
    'dark:text-navy-200 dark:hover:bg-navy-800',
  danger:
    'bg-danger-600 text-white border border-danger-700 shadow-card ' +
    'hover:bg-danger-700 hover:shadow-cardHover active:bg-danger-700',
  emerald:
    'bg-success-600 text-white border border-success-700 shadow-card ' +
    'hover:bg-success-700 hover:shadow-cardHover active:bg-success-700',
  warning:
    'bg-warning-600 text-white border border-warning-700 shadow-card ' +
    'hover:bg-warning-700 hover:shadow-cardHover active:bg-warning-700',
};

const SIZES = {
  sm: 'h-9 px-3 text-sm gap-1.5 rounded-input',
  md: 'h-11 px-4 text-sm gap-2 rounded-input',
  lg: 'h-14 px-5 text-base gap-2 rounded-card',
};

const ICON_SIZES = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-5 w-5',
};

export const Button = forwardRef(function Button(
  {
    as: Tag = 'button',
    variant = 'primary',
    size = 'md',
    icon: Icon,
    iconRight: IconRight,
    loading = false,
    disabled = false,
    fullWidth = false,
    className,
    children,
    type = 'button',
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || loading;
  return (
    <Tag
      ref={ref}
      type={Tag === 'button' ? type : undefined}
      disabled={Tag === 'button' ? isDisabled : undefined}
      aria-busy={loading || undefined}
      className={clsx(
        'inline-flex items-center justify-center font-semibold select-none whitespace-nowrap',
        'transition-all duration-200 ease-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gold-400 focus-visible:ring-offset-white dark:focus-visible:ring-offset-navy-900',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? (
        <Loader2 className={clsx('animate-spin', ICON_SIZES[size])} aria-hidden="true" />
      ) : Icon ? (
        <Icon className={clsx('shrink-0', ICON_SIZES[size])} aria-hidden="true" />
      ) : null}
      {children && <span className="truncate">{children}</span>}
      {IconRight && !loading && (
        <IconRight className={clsx('shrink-0', ICON_SIZES[size])} aria-hidden="true" />
      )}
    </Tag>
  );
});
