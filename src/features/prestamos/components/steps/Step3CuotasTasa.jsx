import { Hash, Percent, Calculator } from 'lucide-react';
import clsx from 'clsx';
import { formatCRC } from '../../../../lib/format';

const inputBase = clsx(
  'w-full rounded-xl border bg-white px-3.5 py-3 text-base outline-none transition-colors tabular-nums',
  'placeholder:text-slate-400 dark:placeholder:text-navy-300',
  'text-navy-900 dark:text-white',
  'border-slate-200 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20',
  'dark:bg-navy-800 dark:border-navy-700 dark:focus:border-gold-400',
);

export function Step3CuotasTasa({ values, errors, showError, set, touch }) {
  const capital = Number(String(values.monto).replace(/\D/g, ''));
  const tasa = Number(values.tasa);
  const nCuotas = Number(values.nCuotas);

  const cuota = capital > 0 && tasa > 0 ? Math.round((capital * tasa) / 100) : 0;
  const totalIntereses = cuota * (nCuotas || 0);
  const totalAPagar = capital + totalIntereses;
  const showPreview = capital > 0 && tasa > 0 && nCuotas > 0;

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-50 text-gold-500 dark:bg-gold-500/10 dark:text-gold-300">
          <Hash className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-navy-900 dark:text-white">
            Cuotas y tasa
          </h2>
          <p className="text-xs text-slate-500 dark:text-navy-300">
            Duración del préstamo y costo por período.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1.5 flex items-center justify-between text-sm font-medium text-navy-700 dark:text-navy-100">
            <span>
              N° de cuotas <span className="ml-0.5 text-rose-500">*</span>
            </span>
          </span>
          <div className="relative">
            <Hash className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-navy-300" />
            <input
              type="text"
              inputMode="numeric"
              value={values.nCuotas}
              onChange={(e) => set('nCuotas', e.target.value)}
              onBlur={() => touch('nCuotas')}
              placeholder="6"
              maxLength={3}
              className={clsx(inputBase, 'pl-10', showError('nCuotas') && errors.nCuotas && 'border-rose-400 focus:border-rose-400 focus:ring-rose-400/20')}
            />
          </div>
          {showError('nCuotas') && errors.nCuotas && (
            <p className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
              {errors.nCuotas}
            </p>
          )}
        </label>

        <label className="block">
          <span className="mb-1.5 flex items-center justify-between text-sm font-medium text-navy-700 dark:text-navy-100">
            <span>
              Tasa (% por cuota) <span className="ml-0.5 text-rose-500">*</span>
            </span>
          </span>
          <div className="relative">
            <Percent className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-navy-300" />
            <input
              type="text"
              inputMode="decimal"
              value={values.tasa}
              onChange={(e) => set('tasa', e.target.value)}
              onBlur={() => touch('tasa')}
              placeholder="8"
              className={clsx(inputBase, 'pl-10 pr-9', showError('tasa') && errors.tasa && 'border-rose-400 focus:border-rose-400 focus:ring-rose-400/20')}
            />
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400 dark:text-navy-300">
              %
            </span>
          </div>
          {showError('tasa') && errors.tasa && (
            <p className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
              {errors.tasa}
            </p>
          )}
        </label>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-navy-700 dark:bg-navy-700/40">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-navy-300">
          <Calculator className="h-3.5 w-3.5" />
          Cálculo automático
        </div>
        {showPreview ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <PreviewItem label="Cuota por período" value={formatCRC(cuota)} highlight />
            <PreviewItem label="Total intereses" value={formatCRC(totalIntereses)} />
            <PreviewItem label="Total a pagar" value={formatCRC(totalAPagar)} />
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-navy-300">
            Completá los campos para ver el cálculo.
          </p>
        )}
      </div>
    </div>
  );
}

function PreviewItem({ label, value, highlight }) {
  return (
    <div className="rounded-xl bg-white p-3 dark:bg-navy-800">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-navy-300">
        {label}
      </p>
      <p
        className={
          highlight
            ? 'mt-1 text-lg font-bold tabular-nums text-gold-600 dark:text-gold-300'
            : 'mt-1 text-lg font-bold tabular-nums text-navy-900 dark:text-white'
        }
      >
        {value}
      </p>
    </div>
  );
}