import { Calendar } from 'lucide-react';
import clsx from 'clsx';
import { parseLocalDate } from '../../../../lib/format';

const inputBase = clsx(
  'w-full rounded-xl border bg-white px-3.5 py-3 text-base outline-none transition-colors',
  'placeholder:text-slate-400 dark:placeholder:text-navy-300',
  'text-navy-900 dark:text-white',
  'border-slate-200 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20',
  'dark:bg-navy-800 dark:border-navy-700 dark:focus:border-gold-400',
);

function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function addMonths(d, n) {
  const original = new Date(d);
  const r = new Date(original);
  r.setDate(1);
  r.setMonth(r.getMonth() + n);
  const lastDay = new Date(r.getFullYear(), r.getMonth() + 1, 0).getDate();
  r.setDate(Math.min(original.getDate(), lastDay));
  return r;
}

function firstCuotaDate(fechaInicio, periodo) {
  if (!periodo) return null;
  const base = parseLocalDate(fechaInicio);
  switch (periodo.tipo) {
    case 'diario':
      return addDays(base, 1);
    case 'semanal':
      return addDays(base, 7);
    case 'quincenal':
      return addDays(base, 14);
    case 'mensual':
      return addMonths(base, 1);
    case 'dia_mes': {
      const target = Number(periodo.diaDelMes);
      if (Number.isNaN(target)) return null;
      const baseDay = base.getDate();
      if (baseDay < target) {
        const r = new Date(base);
        r.setDate(target);
        return r;
      }
      if (baseDay > target) {
        const r = addMonths(base, 1);
        const lastDay = new Date(r.getFullYear(), r.getMonth() + 1, 0).getDate();
        r.setDate(Math.min(target, lastDay));
        return r;
      }
      return base;
    }
    default:
      return null;
  }
}

function nextCuotaDate(prev, periodo) {
  switch (periodo.tipo) {
    case 'diario':
      return addDays(prev, 1);
    case 'semanal':
      return addDays(prev, 7);
    case 'quincenal':
      return addDays(prev, 14);
    case 'mensual':
    case 'dia_mes':
      return addMonths(prev, 1);
    default:
      return prev;
  }
}

function buildCuotas({ fechaInicio, periodo, nCuotas }) {
  if (!periodo || !fechaInicio) return [];
  const first = firstCuotaDate(fechaInicio, periodo);
  if (!first) return [];
  const out = [];
  let cursor = new Date(first);
  for (let i = 0; i < Number(nCuotas); i++) {
    out.push(new Date(cursor));
    cursor = nextCuotaDate(cursor, periodo);
  }
  return out;
}

const longFmt = new Intl.DateTimeFormat('es-CR', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

export function Step4Fechas({ values, errors, showError, set, touch }) {
  const fechaInicio = values.fechaInicio;
  const periodo = values.periodo;
  const nCuotas = Number(values.nCuotas);
  const cuotas = buildCuotas({ fechaInicio, periodo, nCuotas });
  const primera = cuotas[0];
  const ultima = cuotas[cuotas.length - 1];

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-50 text-gold-500 dark:bg-gold-500/10 dark:text-gold-300">
          <Calendar className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-navy-900 dark:text-white">Fechas</h2>
          <p className="text-xs text-slate-500 dark:text-navy-300">
            Cuándo arranca el préstamo y cuándo se cobran las cuotas.
          </p>
        </div>
      </header>

      <label className="block">
        <span className="mb-1.5 flex items-center justify-between text-sm font-medium text-navy-700 dark:text-navy-100">
          <span>
            Fecha inicial <span className="ml-0.5 text-rose-500">*</span>
          </span>
          <span className="text-[10px] font-normal text-slate-400 dark:text-navy-300">
            día que se entrega el préstamo
          </span>
        </span>
        <input
          type="date"
          value={fechaInicio}
          onChange={(e) => set('fechaInicio', e.target.value)}
          onBlur={() => touch('fechaInicio')}
          className={clsx(inputBase, showError('fechaInicio') && errors.fechaInicio && 'border-rose-400 focus:border-rose-400 focus:ring-rose-400/20')}
        />
        {showError('fechaInicio') && errors.fechaInicio && (
          <p className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
            {errors.fechaInicio}
          </p>
        )}
      </label>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-navy-700 dark:bg-navy-700/40">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-navy-300">
            Próximo cobro
          </p>
          {primera ? (
            <>
              <p className="mt-1 text-lg font-bold capitalize text-navy-900 dark:text-white">
                {longFmt.format(primera)}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-navy-300">
                Cuota #1
              </p>
            </>
          ) : (
            <p className="mt-1 text-sm text-slate-500 dark:text-navy-300">—</p>
          )}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-navy-700 dark:bg-navy-700/40">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-navy-300">
            Fecha final estimada
          </p>
          {ultima ? (
            <>
              <p className="mt-1 text-lg font-bold capitalize text-navy-900 dark:text-white">
                {longFmt.format(ultima)}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-navy-300">
                Cuota #{cuotas.length}
              </p>
            </>
          ) : (
            <p className="mt-1 text-sm text-slate-500 dark:text-navy-300">—</p>
          )}
        </div>
      </div>
    </div>
  );
}