import { get, set, STORAGE_KEYS } from './storage';
import { parseLocalDate } from '../lib/format';
import { uid } from '../lib/id';
import { emitDataChanged } from '../lib/events';
import { firstCuotaDate, nextCuotaDate } from '../lib/dates';

function emitChange() {
  emitDataChanged();
}

export function list() {
  return get(STORAGE_KEYS.prestamos, []);
}

export function getById(id) {
  return list().find((p) => p.id === id) || null;
}

function activos() {
  return list().filter((p) => getStatus(p) === 'vigente' || getStatus(p) === 'atrasado');
}

function esAtrasada(cuota) {
  if (cuota.estado === 'pagada' || cuota.estado === 'cancelada') return false;
  return new Date(cuota.fecha) < startOfDay(new Date());
}

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function cuotasAtrasadas(prestamoId = null) {
  const prestamos = prestamoId ? list().filter((p) => p.id === prestamoId) : list();
  const out = [];
  for (const p of prestamos) {
    for (const c of p.cuotas) {
      if (esAtrasada(c)) out.push({ prestamo: p, cuota: c });
    }
  }
  return out;
}

export function totalAtrasado() {
  return cuotasAtrasadas().reduce((sum, x) => sum + x.cuota.monto, 0);
}

export function carteraTotal() {
  return list().reduce((sum, p) => {
    const pendiente = p.cuotas
      .filter((c) => c.estado !== 'pagada' && c.estado !== 'cancelada')
      .reduce((s, c) => s + c.monto, 0);
    return sum + pendiente;
  }, 0);
}

export function cantidadActivos() {
  return activos().length;
}

export function cobrarHoy() {
  const hoy = startOfDay(new Date()).getTime();
  const manana = new Date(hoy);
  manana.setHours(23, 59, 59, 999);
  const out = [];
  for (const p of list()) {
    for (const c of p.cuotas) {
      if (c.estado === 'pagada' || c.estado === 'cancelada') continue;
      const t = new Date(c.fecha).getTime();
      if (t >= hoy && t <= manana.getTime()) out.push({ prestamo: p, cuota: c });
    }
  }
  return out;
}

export function totalCobrarHoy() {
  return cobrarHoy().reduce((s, x) => s + x.cuota.monto, 0);
}

export function resumen() {
  return {
    carteraTotal: carteraTotal(),
    totalAtrasado: totalAtrasado(),
    cantidadActivos: cantidadActivos(),
    cantidadAtrasados: cuotasAtrasadas().length,
    cantidadCobrarHoy: cobrarHoy().length,
    totalCobrarHoy: totalCobrarHoy(),
  };
}

export function delCliente(clienteId) {
  return list().filter((p) => p.clienteId === clienteId);
}

export function getSaldoCapital(prestamo) {
  if (!prestamo) return 0;
  return Number(prestamo.saldoCapital ?? prestamo.monto);
}

export function cuotaDelPeriodo(prestamo) {
  if (!prestamo) return 0;
  return Math.round((getSaldoCapital(prestamo) * Number(prestamo.tasa)) / 100);
}

export function totalIntereses(prestamo) {
  const saldo = getSaldoCapital(prestamo);
  return Math.round((saldo * Number(prestamo?.tasa || 0)) / 100) * (prestamo?.nCuotas || 0);
}

export function totalAPagar(prestamo) {
  return Number(prestamo?.monto || 0) + totalIntereses(prestamo);
}

export function liquidarTotal(prestamo) {
  if (!prestamo) return 0;
  const saldo = getSaldoCapital(prestamo);
  const interes = cuotaDelPeriodo(prestamo);
  return saldo + interes;
}

export function refreshPrestamo(prestamoId) {
  const all = list();
  const prestamo = all.find((p) => p.id === prestamoId);
  if (!prestamo) return null;
  if (prestamo.saldoCapital == null) {
    prestamo.saldoCapital = prestamo.monto;
    const idx = all.findIndex((p) => p.id === prestamoId);
    all[idx] = prestamo;
    set(STORAGE_KEYS.prestamos, all);
  }
  return prestamo;
}

export function extenderCuotas(prestamoId, nCuotas) {
  const all = list();
  const idx = all.findIndex((p) => p.id === prestamoId);
  if (idx === -1) return null;
  const prestamo = all[idx];
  if (prestamo.saldoCapital == null) prestamo.saldoCapital = prestamo.monto;

  const saldo = prestamo.saldoCapital;
  const cuotaMonto = Math.round((saldo * Number(prestamo.tasa)) / 100);

  const ultimaCuota = prestamo.cuotas[prestamo.cuotas.length - 1];
  let cursor = parseLocalDate(ultimaCuota.fecha);
  const baseNumero = prestamo.cuotas.length;

  for (let i = 0; i < Number(nCuotas); i++) {
    cursor = nextCuotaDate(cursor, prestamo.periodo);
    prestamo.cuotas.push({
      numero: baseNumero + i + 1,
      fecha: cursor.toISOString(),
      monto: cuotaMonto,
      estado: 'pendiente',
      pagadaEn: null,
      cobroId: null,
    });
  }

  prestamo.nCuotas = prestamo.cuotas.length;
  if (prestamo.estado === 'cancelado' && saldo > 0) {
    prestamo.estado = 'vigente';
  }

  all[idx] = prestamo;
  set(STORAGE_KEYS.prestamos, all);
  emitChange();
  return prestamo;
}

export function getStatus(prestamo) {
  if (!prestamo) return 'cancelado';
  if (prestamo.estado === 'cancelado') return 'cancelado';
  const saldo = getSaldoCapital(prestamo);
  if (saldo <= 0) return 'cancelado';
  const hoy = startOfDay(new Date());
  const tieneAtrasada = prestamo.cuotas.some((c) => {
    if (c.estado === 'pagada' || c.estado === 'cancelada') return false;
    return new Date(c.fecha) < hoy;
  });
  if (tieneAtrasada) return 'atrasado';
  return 'vigente';
}

export function cuotasAgotadas(prestamo) {
  if (!prestamo || !prestamo.cuotas || prestamo.cuotas.length === 0) return false;
  const todasCerradas = prestamo.cuotas.every(
    (c) => c.estado === 'pagada' || c.estado === 'cancelada',
  );
  if (!todasCerradas) return false;
  return getSaldoCapital(prestamo) > 0;
}

export function proximoCobro(prestamo) {
  if (!prestamo) return null;
  return prestamo.cuotas.find(
    (c) => c.estado !== 'pagada' && c.estado !== 'cancelada',
  ) || null;
}

export function create({ clienteId, ruta, periodo, monto, tasa, nCuotas, fechaInicio, creadoPor }) {
  const ahora = new Date().toISOString();
  const startDate = parseLocalDate(fechaInicio);
  const cuotaMonto = Math.round((Number(monto) * Number(tasa)) / 100);
  const first = firstCuotaDate(startDate, periodo);

  const cuotas = [];
  let cursor = new Date(first);
  for (let i = 0; i < Number(nCuotas); i++) {
    cuotas.push({
      numero: i + 1,
      fecha: cursor.toISOString(),
      monto: cuotaMonto,
      estado: 'pendiente',
      pagadaEn: null,
      cobroId: null,
    });
    cursor = nextCuotaDate(cursor, periodo);
  }

  const prestamo = {
    id: uid('p'),
    clienteId,
    creadoPor: creadoPor || null,
    creadoEn: ahora,
    ruta: String(ruta || '').trim(),
    periodo,
    monto: Number(monto),
    saldoCapital: Number(monto),
    tasa: Number(tasa),
    nCuotas: Number(nCuotas),
    fechaInicio: startDate.toISOString(),
    estado: 'vigente',
    cuotas,
  };
  const all = list();
  all.push(prestamo);
  set(STORAGE_KEYS.prestamos, all);
  emitChange();
  return prestamo;
}