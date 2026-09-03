import React from 'react';
import { Calendar } from 'lucide-react';
import { Input } from '../../../../components/ui/Input';
import { IconBox } from '../../../../components/ui/IconBox';
import { firstCuotaDate, nextCuotaDate } from '../../../../lib/dates';

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
        <IconBox icon={Calendar} tone="gold" size="md" />
        <div>
          <h2 className="text-lg font-bold text-navy-900 dark:text-white">Fechas</h2>
          <p className="text-xs text-neutral-500 dark:text-navy-300">
            Cuándo arranca el préstamo y cuándo se cobran las cuotas.
          </p>
        </div>
      </header>

      <Input
        type="date"
        name="fechaInicio"
        size="lg"
        label={
          <>
            Fecha inicial <span className="text-danger-500">*</span>
          </>
        }
        hint="día que se entrega el préstamo"
        value={fechaInicio}
        onChange={(e) => set('fechaInicio', e.target.value)}
        onBlur={() => touch('fechaInicio')}
        error={showError('fechaInicio') && errors.fechaInicio}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-card border border-slate-200 bg-slate-50 p-4 dark:border-navy-700 dark:bg-navy-700/40">
          <p className="section-label">Próximo cobro</p>
          {primera ? (
            <>
              <p className="mt-1 text-lg font-bold capitalize text-navy-900 dark:text-white">
                {longFmt.format(primera)}
              </p>
              <p className="mt-1 text-xs text-neutral-500 dark:text-navy-300">Cuota #1</p>
            </>
          ) : (
            <p className="mt-1 text-sm text-neutral-500 dark:text-navy-300">—</p>
          )}
        </div>
        <div className="rounded-card border border-slate-200 bg-slate-50 p-4 dark:border-navy-700 dark:bg-navy-700/40">
          <p className="section-label">Fecha final estimada</p>
          {ultima ? (
            <>
              <p className="mt-1 text-lg font-bold capitalize text-navy-900 dark:text-white">
                {longFmt.format(ultima)}
              </p>
              <p className="mt-1 text-xs text-neutral-500 dark:text-navy-300">
                Cuota #{cuotas.length}
              </p>
            </>
          ) : (
            <p className="mt-1 text-sm text-neutral-500 dark:text-navy-300">—</p>
          )}
        </div>
      </div>
    </div>
  );
}
