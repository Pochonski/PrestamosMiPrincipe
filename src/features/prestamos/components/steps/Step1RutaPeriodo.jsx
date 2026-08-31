import { useId, useState } from 'react';
import { MapPin, Calendar, X } from 'lucide-react';
import clsx from 'clsx';
import { PERIODOS, rutasUsadas } from '../../selectors';
import { MiniCalendar } from '../MiniCalendar';

const inputBase = clsx(
  'w-full rounded-xl border bg-white px-3.5 py-3 text-base outline-none transition-colors',
  'placeholder:text-slate-400 dark:placeholder:text-navy-300',
  'text-navy-900 dark:text-white',
  'border-slate-200 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20',
  'dark:bg-navy-800 dark:border-navy-700 dark:focus:border-gold-400',
);

export function Step1RutaPeriodo({ values, errors, showError, set, touch }) {
  const rutasId = useId();
  const [showCalendar, setShowCalendar] = useState(values.periodo?.tipo === 'dia_mes');
  const rutas = rutasUsadas();

  function pickPeriodo(tipo) {
    if (tipo === 'dia_mes') {
      set('periodo', { tipo, diaDelMes: values.periodo?.diaDelMes || 15 });
      setShowCalendar(true);
    } else {
      set('periodo', { tipo });
      setShowCalendar(false);
    }
  }

  function pickDay(dia) {
    set('periodo', { tipo: 'dia_mes', diaDelMes: dia });
  }

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-50 text-gold-500 dark:bg-gold-500/10 dark:text-gold-300">
          <MapPin className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-navy-900 dark:text-white">Ruta y período</h2>
          <p className="text-xs text-slate-500 dark:text-navy-300">
            Dónde se cobra y cada cuánto se cobra.
          </p>
        </div>
      </header>

      <label className="block">
        <span className="mb-1.5 flex items-center justify-between text-sm font-medium text-navy-700 dark:text-navy-100">
          <span>
            Ruta <span className="ml-0.5 text-rose-500">*</span>
          </span>
          <span className="text-[10px] font-normal text-slate-400 dark:text-navy-300">
            ej: San José Centro
          </span>
        </span>
        <input
          type="text"
          list={rutasId}
          value={values.ruta}
          onChange={(e) => set('ruta', e.target.value)}
          onBlur={() => touch('ruta')}
          placeholder="Escribí o elegí una ruta"
          className={clsx(inputBase, showError('ruta') && errors.ruta && 'border-rose-400 focus:border-rose-400 focus:ring-rose-400/20')}
          autoComplete="off"
        />
        <datalist id={rutasId}>
          {rutas.map((r) => (
            <option key={r} value={r} />
          ))}
        </datalist>
        {showError('ruta') && errors.ruta && (
          <p className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
            {errors.ruta}
          </p>
        )}
      </label>

      <div>
        <p className="mb-1.5 text-sm font-medium text-navy-700 dark:text-navy-100">
          Período de pago <span className="ml-0.5 text-rose-500">*</span>
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {PERIODOS.map((p) => {
            const active = values.periodo?.tipo === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => pickPeriodo(p.id)}
                className={clsx(
                  'flex flex-col items-start gap-0.5 rounded-xl border p-3 text-left transition-colors',
                  active
                    ? 'border-gold-400 bg-gold-50 dark:bg-gold-500/10'
                    : 'border-slate-200 bg-white hover:border-slate-300 dark:border-navy-700 dark:bg-navy-800 dark:hover:border-navy-600',
                )}
              >
                <span
                  className={clsx(
                    'text-sm font-bold',
                    active ? 'text-gold-700 dark:text-gold-300' : 'text-navy-900 dark:text-white',
                  )}
                >
                  {p.label}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-navy-300">{p.hint}</span>
              </button>
            );
          })}
        </div>
        {showError('periodo') && errors.periodo && (
          <p className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
            {errors.periodo}
          </p>
        )}
      </div>

      {showCalendar && values.periodo?.tipo === 'dia_mes' && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-navy-700 dark:text-navy-100">
              Elegí el día del mes <span className="ml-0.5 text-rose-500">*</span>
            </p>
            <button
              type="button"
              onClick={() => setShowCalendar(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-navy-200"
              aria-label="Cerrar calendario"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <MiniCalendar
            value={values.periodo?.diaDelMes}
            onChange={pickDay}
          />
          {values.periodo?.diaDelMes && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-gold-50 px-3 py-1 text-xs font-semibold text-gold-700 dark:bg-gold-500/10 dark:text-gold-300">
              <Calendar className="h-3.5 w-3.5" />
              Día {values.periodo.diaDelMes} de cada mes
            </p>
          )}
        </div>
      )}
    </div>
  );
}