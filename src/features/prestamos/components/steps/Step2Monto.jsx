import { Wallet } from 'lucide-react';
import clsx from 'clsx';
import { formatCRC } from '../../../../lib/format';

const inputBase = clsx(
  'w-full rounded-xl border bg-white px-3.5 py-3.5 text-2xl font-bold outline-none transition-colors',
  'placeholder:text-slate-300 dark:placeholder:text-navy-700',
  'text-navy-900 dark:text-white tabular-nums',
  'border-slate-200 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20',
  'dark:bg-navy-800 dark:border-navy-700 dark:focus:border-gold-400',
);

export function Step2Monto({ values, errors, showError, set, touch }) {
  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-50 text-gold-500 dark:bg-gold-500/10 dark:text-gold-300">
          <Wallet className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-navy-900 dark:text-white">Monto prestado</h2>
          <p className="text-xs text-slate-500 dark:text-navy-300">
            Capital que el cliente recibe.
          </p>
        </div>
      </header>

      <label className="block">
        <span className="mb-1.5 flex items-center justify-between text-sm font-medium text-navy-700 dark:text-navy-100">
          <span>
            Capital <span className="ml-0.5 text-rose-500">*</span>
          </span>
          <span className="text-[10px] font-normal text-slate-400 dark:text-navy-300">
            en colones (₡)
          </span>
        </span>
        <div className="relative">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400 dark:text-navy-300">
            ₡
          </span>
          <input
            type="text"
            inputMode="numeric"
            value={values.monto}
            onChange={(e) => set('monto', e.target.value)}
            onBlur={() => touch('monto')}
            placeholder="0"
            className={clsx(inputBase, 'pl-10', showError('monto') && errors.monto && 'border-rose-400 focus:border-rose-400 focus:ring-rose-400/20')}
          />
        </div>
        {showError('monto') && errors.monto && (
          <p className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
            {errors.monto}
          </p>
        )}
      </label>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-navy-700 dark:bg-navy-700/40">
        <p className="text-xs text-slate-600 dark:text-navy-300">
          El cliente recibe este monto al iniciar el préstamo.
          Los cobros periódicos son solo por intereses (los definís en el siguiente paso).
        </p>
        {values.monto && !errors.monto && (
          <p className="mt-2 text-2xl font-bold tabular-nums text-navy-900 dark:text-white">
            {formatCRC(Number(String(values.monto).replace(/\D/g, '')))}
          </p>
        )}
      </div>
    </div>
  );
}