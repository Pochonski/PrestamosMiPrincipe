import React from 'react';
import clsx from 'clsx';
import { Percent, Wallet } from 'lucide-react';
import { COBRO_TIPOS } from '../selectors';

const ICON_MAP = { Percent, Wallet };

export function CobroTipoPicker({ value, onChange }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-navy-700 dark:text-navy-200">
        Tipo de cobro <span className="ml-0.5 text-danger-500">*</span>
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {COBRO_TIPOS.map((t) => {
          const Icon = ICON_MAP[t.icon] || Percent;
          const active = value === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.id)}
              aria-pressed={active}
              className={clsx(
                'flex items-start gap-3 rounded-input border p-3 text-left transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-navy-900',
                active
                  ? 'border-gold-400 bg-gold-50 shadow-sm dark:bg-gold-500/10'
                  : 'border-slate-200 bg-white hover:border-slate-300 dark:border-navy-700 dark:bg-navy-800 dark:hover:border-navy-600',
              )}
            >
              <div
                className={clsx(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-input',
                  active
                    ? 'bg-gold-gradient text-navy-900 shadow-glow'
                    : 'bg-slate-100 text-slate-500 dark:bg-navy-700 dark:text-navy-300',
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={clsx(
                    'text-sm font-bold',
                    active ? 'text-gold-700 dark:text-gold-300' : 'text-navy-900 dark:text-white',
                  )}
                >
                  {t.label}
                </p>
                <p className="text-[11px] text-neutral-500 dark:text-navy-300">{t.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
