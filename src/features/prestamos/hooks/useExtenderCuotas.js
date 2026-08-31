import { useMemo, useState } from 'react';
import * as prestamosService from '../../../services/prestamos';
import { formatMontoLive } from '../../../lib/format';

function parseLocalDateValue(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const datePart = value.split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      const [y, m, d] = datePart.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
  }
  return new Date(value);
}

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
      return addMonths(prev, 1);
  }
}

function buildPreviewCuotas(prestamo, nCuotas) {
  if (!prestamo || !nCuotas) return [];
  const saldo = prestamosService.getSaldoCapital(prestamo);
  const cuotaMonto = Math.round((saldo * Number(prestamo.tasa)) / 100);
  const ultima = prestamo.cuotas[prestamo.cuotas.length - 1];
  if (!ultima) return [];
  let cursor = parseLocalDateValue(ultima.fecha);
  const baseNumero = prestamo.cuotas.length;
  const out = [];
  for (let i = 0; i < Number(nCuotas); i++) {
    cursor = nextCuotaDate(cursor, prestamo.periodo);
    out.push({
      numero: baseNumero + i + 1,
      fecha: new Date(cursor),
      monto: cuotaMonto,
    });
  }
  return out;
}

export function useExtenderCuotas({ prestamo, defaultN = 2 }) {
  const [nCuotas, setNCuotas] = useState(String(defaultN));
  const [submitting, setSubmitting] = useState(false);

  const n = Number(String(nCuotas).replace(/\D/g, '').slice(0, 3)) || 0;
  const error =
    !n ? 'Ingresa cuántas cuotas agregar' :
    n < 1 ? 'Mínimo 1 cuota' :
    n > 60 ? 'Máximo 60 cuotas' :
    null;

  const preview = useMemo(
    () => buildPreviewCuotas(prestamo, n),
    [prestamo, n],
  );

  function setN(value) {
    setNCuotas(formatMontoLive(value).slice(0, 3));
  }

  function submit() {
    if (error) return { ok: false, error };
    setSubmitting(true);
    try {
      const updated = prestamosService.extenderCuotas(prestamo.id, n);
      return { ok: true, prestamo: updated };
    } catch (err) {
      return { ok: false, error: err.message || 'Error al extender cuotas' };
    } finally {
      setSubmitting(false);
    }
  }

  return {
    nCuotas: n,
    setN,
    preview,
    error,
    submitting,
    submit,
  };
}