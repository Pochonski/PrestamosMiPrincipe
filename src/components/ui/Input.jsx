import React from 'react';
import { forwardRef } from 'react';
import clsx from 'clsx';

const VARIANTS = {
  default:
    'bg-white text-navy-900 placeholder:text-neutral-400 border-slate-200 ' +
    'dark:bg-navy-800 dark:text-white dark:placeholder:text-navy-300 dark:border-navy-700',
  glass:
    'bg-white/10 text-white placeholder:text-white/50 border-white/20 backdrop-blur-md',
};

const SIZES = {
  md: 'px-4 text-sm rounded-input min-h-[2.75rem] py-2.5',
  lg: 'px-5 text-base rounded-card min-h-[3.5rem] py-3',
};

const VARIANT_FOCUS = {
  default: 'focus-within:border-gold-400 focus-within:ring-2 focus-within:ring-gold-400/25',
  glass: 'focus-within:border-gold-400 focus-within:ring-2 focus-within:ring-gold-400/30',
};

export const Input = forwardRef(function Input(
  {
    label,
    hint,
    error,
    icon: Icon,
    trailing,
    variant = 'default',
    size = 'md',
    prefix,
    className,
    wrapperClassName,
    id,
    as = 'input',
    ...rest
  },
  ref,
) {
  const hasError = Boolean(error);
  const inputId = id || rest.name || undefined;
  const Component = as;
  const isTextarea = as === 'textarea';
  return (
    <div className={clsx('block', wrapperClassName)}>
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-navy-700 dark:text-navy-200"
        >
          <span>{label}</span>
          {hint && (
            <span className="text-[10px] font-normal normal-case tracking-normal text-neutral-400 dark:text-navy-300">
              {hint}
            </span>
          )}
        </label>
      )}
      <div
        className={clsx(
          'flex w-full border transition-all duration-150',
          isTextarea ? 'items-start' : 'items-center gap-2',
          VARIANTS[variant],
          VARIANT_FOCUS[variant],
          !isTextarea && SIZES[size],
          hasError &&
            'border-danger-500 focus-within:border-danger-500 focus-within:ring-danger-500/20 dark:border-danger-500',
          isTextarea && size === 'lg' && 'rounded-card px-5 py-3',
          isTextarea && size === 'md' && 'rounded-input px-4 py-2.5',
          className,
        )}
      >
        {Icon && !isTextarea && (
          <Icon className="h-4 w-4 shrink-0 text-neutral-400 dark:text-navy-300" aria-hidden="true" />
        )}
        {prefix && !isTextarea && (
          <span className="shrink-0 text-sm font-medium text-neutral-400 dark:text-navy-300">
            {prefix}
          </span>
        )}
        <Component
          ref={ref}
          id={inputId}
          className={clsx(
            'min-w-0 flex-1 bg-transparent outline-none placeholder:font-normal placeholder:opacity-70',
            isTextarea ? 'resize-y text-sm font-medium leading-relaxed' : 'text-sm font-medium',
          )}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError && error ? `${inputId}-error` : undefined}
          {...rest}
        />
        {trailing && <div className="shrink-0">{trailing}</div>}
      </div>
      {error && (
        <p
          id={`${inputId}-error`}
          className="mt-1.5 text-xs font-medium text-danger-600 dark:text-danger-500"
        >
          {error}
        </p>
      )}
    </div>
  );
});
