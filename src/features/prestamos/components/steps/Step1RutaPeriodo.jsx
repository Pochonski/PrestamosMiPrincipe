import React from 'react';
import { useEffect, useId, useState } from 'react';
import { MapPin, Calendar, X } from 'lucide-react';
import clsx from 'clsx';
import { PERIODOS, rutasUsadas } from '../../selectors';
import { MiniCalendar } from '../MiniCalendar';
import { Input } from '../../../../components/ui/Input';
import { IconBox } from '../../../../components/ui/IconBox';

export function Step1RutaPeriodo({ values, errors, showError, set, touch }) {
  const rutasId = useId();
  const [showCalendar, setShowCalendar] = useState(values.periodo?.tipo === 'dia_mes');
  const [rutas, setRutas] = useState([]);
  useEffect(() => {
    rutasUsadas().then(setRutas);
  }, []);

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
        <IconBox icon={MapPin} tone="gold" size="md" />
        <div>
          <h2 className="text-lg font-bold text-navy-900 dark:text-white">Ruta y período</h2>
          <p className="text-xs text-neutral-500 dark:text-navy-300">
            Dónde se cobra y cada cuánto se cobra.
          </p>
        </div>
      </header>

      <Input
        type="text"
        name="ruta"
        size="lg"
        label={
          <>
            Ruta <span className="text-danger-500">*</span>
          </>
        }
        hint="ej: San José Centro"
        value={values.ruta}
        onChange={(e) => set('ruta', e.target.value)}
        onBlur={() => touch('ruta')}
        placeholder="Escribí o elegí una ruta"
        error={showError('ruta') && errors.ruta}
        list={rutasId}
        autoComplete="off"
      />
      <datalist id={rutasId}>
        {rutas.map((r) => (
          <option key={r} value={r} />
        ))}
      </datalist>

      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-navy-700 dark:text-navy-200">
          Período de pago <span className="ml-0.5 text-danger-500">*</span>
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
                  'flex flex-col items-start gap-0.5 rounded-input border p-3 text-left transition-all',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-navy-900',
                  active
                    ? 'border-gold-400 bg-gold-50 shadow-sm dark:bg-gold-500/10'
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
                <span className="text-[10px] text-neutral-500 dark:text-navy-300">{p.hint}</span>
              </button>
            );
          })}
        </div>
        {showError('periodo') && errors.periodo && (
          <p className="mt-1.5 text-xs font-medium text-danger-600 dark:text-danger-500">
            {errors.periodo}
          </p>
        )}
      </div>

      {showCalendar && values.periodo?.tipo === 'dia_mes' && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-navy-700 dark:text-navy-200">
              Elegí el día del mes <span className="ml-0.5 text-danger-500">*</span>
            </p>
            <button
              type="button"
              onClick={() => setShowCalendar(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-slate-100 hover:text-neutral-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:hover:bg-navy-700 dark:hover:text-navy-200"
              aria-label="Cerrar calendario"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <MiniCalendar value={values.periodo?.diaDelMes} onChange={pickDay} />
          {values.periodo?.diaDelMes && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-gold-50 px-3 py-1 text-xs font-semibold text-gold-700 dark:bg-gold-500/10 dark:text-gold-300">
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
              Día {values.periodo.diaDelMes} de cada mes
            </p>
          )}
        </div>
      )}
    </div>
  );
}
