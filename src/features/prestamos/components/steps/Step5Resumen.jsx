import React from 'react';
import { useState } from 'react';
import { Eye, EyeOff, Calendar, CheckCircle2 } from 'lucide-react';
import { Card } from '../../../../components/ui/Card';
import { Avatar } from '../../../../components/ui/Avatar';
import { Button } from '../../../../components/ui/Button';
import { IconBox } from '../../../../components/ui/IconBox';
import { formatCRC, formatDate } from '../../../../lib/format';
import { firstCuotaDate, nextCuotaDate } from '../../../../lib/dates';
import { labelPeriodo, cuotaDelPeriodo, totalIntereses, totalAPagar } from '../../selectors';
import { PrestamoCalendar } from '../PrestamoCalendar';

function buildCuotas({ fechaInicio, periodo, nCuotas, monto, tasa, comision }) {
  const first = firstCuotaDate(fechaInicio, periodo);
  if (!first) return [];
  const cuota = Math.round((Number(monto) * (Number(tasa) + Number(comision || 0))) / 100);
  const out = [];
  let cursor = new Date(first);
  for (let i = 0; i < Number(nCuotas); i++) {
    out.push({
      numero: i + 1,
      fecha: cursor.toISOString().slice(0, 10),
      monto: cuota,
      estado: 'pendiente',
    });
    cursor = nextCuotaDate(cursor, periodo);
  }
  return out;
}

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-2 border-b border-slate-100 py-2 last:border-0 dark:border-white/10">
      <span className="text-xs font-medium text-neutral-500 dark:text-navy-300">{label}</span>
      <span className="text-right text-sm font-semibold text-navy-900 dark:text-white">{value}</span>
    </div>
  );
}

export function Step5Resumen({ values, cliente }) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [showAcreedor, setShowAcreedor] = useState(false);

  const capital = Number(String(values.monto).replace(/\D/g, ''));
  const tasaBase = Number(values.tasa);
  const comision = values.comision === '' || values.comision == null ? 0 : Number(values.comision);
  const nCuotas = Number(values.nCuotas);

  const prestamoPreview = {
    monto: capital,
    tasa: tasaBase + comision,
    nCuotas,
    periodo: values.periodo,
    fechaInicio: values.fechaInicio,
    ruta: values.ruta,
    cuotas: buildCuotas({
      fechaInicio: values.fechaInicio,
      periodo: values.periodo,
      nCuotas: values.nCuotas,
      monto: values.monto,
      tasa: tasaBase,
      comision,
    }),
  };

  const cuota = cuotaDelPeriodo(prestamoPreview);
  const totalInt = totalIntereses(prestamoPreview);
  const totalPag = totalAPagar(prestamoPreview);
  const tieneComision = comision > 0;
  const cuotaBase = capital > 0 && tasaBase > 0 ? Math.round((capital * tasaBase) / 100) : 0;
  const totalIntBase = cuotaBase * (nCuotas || 0);
  const totalPagBase = capital + totalIntBase;

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3">
        <IconBox icon={CheckCircle2} tone="emerald" size="md" />
        <div>
          <h2 className="text-lg font-bold text-navy-900 dark:text-white">Resumen</h2>
          <p className="text-xs text-neutral-500 dark:text-navy-300">
            Revisá los datos antes de guardar.
          </p>
        </div>
      </header>

      <Card className="p-4 sm:p-5">
        {cliente && (
          <div className="mb-3 flex items-center gap-3 border-b border-slate-100 pb-3 dark:border-white/10">
            <Avatar nombre={cliente.nombre} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-navy-900 dark:text-white">
                {cliente.nombre}
              </p>
              <p className="truncate text-xs text-neutral-500 dark:text-navy-300">{cliente.cedula}</p>
            </div>
          </div>
        )}
        <Row label="Ruta" value={values.ruta} />
        <Row label="Período" value={labelPeriodo(values.periodo)} />
        <Row label="Capital" value={formatCRC(prestamoPreview.monto)} />
        <Row label="N° de cuotas" value={prestamoPreview.nCuotas} />
        <Row label="Tasa acreedor" value={`${tasaBase}%`} />
        {tieneComision && <Row label="Tu comisión" value={`+${comision}%`} />}
        <Row label="Cuota por período" value={formatCRC(cuota)} />
        {tieneComision && (
          <Row label="Split por cuota" value={`${formatCRC(cuotaBase)} + ${formatCRC(cuota - cuotaBase)}`} />
        )}
        <Row label="Total intereses" value={formatCRC(totalInt)} />
        <Row label="Total a pagar" value={formatCRC(totalPag)} />
        <Row label="Fecha inicial" value={formatDate(values.fechaInicio)} />
        {prestamoPreview.cuotas.length > 0 && (
          <Row
            label="Fecha final estimada"
            value={formatDate(prestamoPreview.cuotas[prestamoPreview.cuotas.length - 1].fecha)}
          />
        )}
      </Card>

      <Button
        variant="secondary"
        icon={showCalendar ? EyeOff : Eye}
        iconRight={Calendar}
        onClick={() => setShowCalendar((v) => !v)}
        fullWidth
      >
        {showCalendar ? 'Ocultar' : 'Ver'} calendario de cuotas
      </Button>

      {tieneComision && (
        <Button
          variant="secondary"
          icon={showAcreedor ? EyeOff : Eye}
          onClick={() => setShowAcreedor((v) => !v)}
          fullWidth
        >
          {showAcreedor ? 'Ocultar' : 'Mostrar'} con datos del acreedor
        </Button>
      )}

      {showAcreedor && tieneComision && (
        <Card className="p-4 sm:p-5">
          <p className="section-label">Vista acreedor (sin tu comisión)</p>
          <div className="mt-1">
            <Row label="Cuota por período" value={formatCRC(cuotaBase)} />
            <Row label="Total intereses" value={formatCRC(totalIntBase)} />
            <Row label="Total a pagar" value={formatCRC(totalPagBase)} />
          </div>
        </Card>
      )}

      {showCalendar && prestamoPreview.cuotas.length > 0 && (
        <PrestamoCalendar cuotas={prestamoPreview.cuotas} total={totalInt} />
      )}
    </div>
  );
}
