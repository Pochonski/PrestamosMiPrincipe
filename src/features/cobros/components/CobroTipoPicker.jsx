import clsx from 'clsx';
import { Percent, Wallet } from 'lucide-react';
import { COBRO_TIPOS } from '../selectors';

const ICON_MAP = { Percent, Wallet };

export function CobroTipoPicker({ value, onChange }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-navy-700 dark:text-navy-100">
        Tipo de cobro <span className="ml-0.5 text-rose-500">*</span>
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
              className={clsx(
                'flex items-start gap-3 rounded-xl border p-3 text-left transition-colors',
                active
                  ? 'border-gold-400 bg-gold-50 dark:bg-gold-500/10'
                  : 'border-slate-200 bg-white hover:border-slate-300 dark:border-navy-700 dark:bg-navy-800 dark:hover:border-navy-600',
              )}
            >
              <div
                className={clsx(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                  active ? 'bg-gold-gradient text-navy-900' : 'bg-slate-100 text-slate-500 dark:bg-navy-700 dark:text-navy-300',
                )}
              >
                <Icon className="h-5 w-5" />
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
                <p className="text-[11px] text-slate-500 dark:text-navy-300">
                  {t.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}