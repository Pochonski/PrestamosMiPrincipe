import { useState } from 'react';
import { Eye, EyeOff, Calendar, CheckCircle2 } from 'lucide-react';
import { Card } from '../../../../components/ui/Card';
import { Avatar } from '../../../../components/ui/Avatar';
import { formatCRC, parseLocalDate } from '../../../../lib/format';
import { labelPeriodo, cuotaDelPeriodo, totalIntereses, totalAPagar } from '../../selectors';
import { PrestamoCalendar } from '../PrestamoCalendar';

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

function buildCuotas({ fechaInicio, periodo, nCuotas, monto, tasa }) {
  const first = firstCuotaDate(fechaInicio, periodo);
  if (!first) return [];
  const cuota = Math.round((Number(monto) * Number(tasa)) / 100);
  const out = [];
  let cursor = new Date(first);
  for (let i = 0; i < Number(nCuotas); i++) {
    out.push({
      numero: i + 1,
      fecha: cursor.toISOString(),
      monto: cuota,
      estado: 'pendiente',
    });
    cursor = nextCuotaDate(cursor, periodo);
  }
  return out;
}

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-2 border-b border-slate-100 py-2 last:border-0 dark:border-navy-700/60">
      <span className="text-xs font-medium text-slate-500 dark:text-navy-300">{label}</span>
      <span className="text-right text-sm font-semibold text-navy-900 dark:text-white">{value}</span>
    </div>
  );
}

export function Step5Resumen({ values, cliente }) {
  const [showCalendar, setShowCalendar] = useState(false);

  const prestamoPreview = {
    monto: Number(String(values.monto).replace(/\D/g, '')),
    tasa: Number(values.tasa),
    nCuotas: Number(values.nCuotas),
    periodo: values.periodo,
    fechaInicio: values.fechaInicio,
    ruta: values.ruta,
    cuotas: buildCuotas({
      fechaInicio: values.fechaInicio,
      periodo: values.periodo,
      nCuotas: values.nCuotas,
      monto: values.monto,
      tasa: values.tasa,
    }),
  };

  const cuota = cuotaDelPeriodo(prestamoPreview);
  const totalInt = totalIntereses(prestamoPreview);
  const totalPag = totalAPagar(prestamoPreview);

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-navy-900 dark:text-white">Resumen</h2>
          <p className="text-xs text-slate-500 dark:text-navy-300">
            Revisá los datos antes de guardar.
          </p>
        </div>
      </header>

      <Card className="p-4 sm:p-5">
        {cliente && (
          <div className="mb-3 flex items-center gap-3 border-b border-slate-100 pb-3 dark:border-navy-700/60">
            <Avatar nombre={cliente.nombre} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-navy-900 dark:text-white">
                {cliente.nombre}
              </p>
              <p className="truncate text-xs text-slate-500 dark:text-navy-300">
                {cliente.cedula}
              </p>
            </div>
          </div>
        )}
        <Row label="Ruta" value={values.ruta} />
        <Row label="Período" value={labelPeriodo(values.periodo)} />
        <Row label="Capital" value={formatCRC(prestamoPreview.monto)} />
        <Row label="N° de cuotas" value={prestamoPreview.nCuotas} />
        <Row label="Tasa por cuota" value={`${prestamoPreview.tasa}%`} />
        <Row label="Cuota por período" value={formatCRC(cuota)} />
        <Row label="Total intereses" value={formatCRC(totalInt)} />
        <Row label="Total a pagar" value={formatCRC(totalPag)} />
        <Row label="Fecha inicial" value={new Date(values.fechaInicio).toLocaleDateString('es-CR')} />
        {prestamoPreview.cuotas.length > 0 && (
          <Row
            label="Fecha final estimada"
            value={new Date(prestamoPreview.cuotas[prestamoPreview.cuotas.length - 1].fecha).toLocaleDateString('es-CR')}
          />
        )}
      </Card>

      <button
        type="button"
        onClick={() => setShowCalendar((v) => !v)}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-navy-700 transition-colors hover:bg-slate-50 dark:border-navy-700 dark:bg-navy-800 dark:text-navy-100 dark:hover:bg-navy-700"
      >
        {showCalendar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        {showCalendar ? 'Ocultar' : 'Ver'} calendario de cuotas
        <Calendar className="h-4 w-4" />
      </button>

      {showCalendar && prestamoPreview.cuotas.length > 0 && (
        <PrestamoCalendar cuotas={prestamoPreview.cuotas} total={totalInt} />
      )}
    </div>
  );
}