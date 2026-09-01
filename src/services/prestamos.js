import { supabase, getOrgId } from '../lib/supabase';
import { parseLocalDate } from '../lib/format';
import { addDays, addMonths, nextCuotaDate } from '../lib/dates';

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function buildCuotasPayload({ fechaInicio, periodo, nCuotas, montoPorCuota }) {
  const out = [];
  let cursor = firstCuotaDate(fechaInicio, periodo);
  for (let i = 0; i < Number(nCuotas); i++) {
    out.push({
      numero: i + 1,
      fecha: cursor.toISOString().slice(0, 10),
      monto: montoPorCuota,
    });
    cursor = nextCuotaDate(cursor, periodo);
  }
  return out;
}

function firstCuotaDate(fechaInicio, periodo) {
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
      if (Number.isNaN(target)) return addMonths(base, 1);
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
      return addMonths(base, 1);
  }
}

export async function list() {
  const orgId = await getOrgId();
  const { data, error } = await supabase
    .from('prestamos')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getById(id) {
  const orgId = await getOrgId();
  const { data, error } = await supabase
    .from('prestamos')
    .select('*')
    .eq('org_id', orgId)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function delCliente(clienteId) {
  const { data, error } = await supabase
    .from('prestamos')
    .select('*')
    .eq('cliente_id', clienteId);
  if (error) throw error;
  return data ?? [];
}

export function activos() {
  return list().then((items) =>
    items.filter((p) => getStatus(p) === 'vigente' || getStatus(p) === 'atrasado'),
  );
}

export async function cuotasAtrasadas(prestamoId = null) {
  const items = prestamoId
    ? [await getById(prestamoId)].filter(Boolean)
    : await list();
  const out = [];
  for (const p of items) {
    const { data: cuotas } = await supabase
      .from('cuotas')
      .select('*')
      .eq('prestamo_id', p.id);
    if (!cuotas) continue;
    for (const c of cuotas) {
      if (c.estado === 'pagada' || c.estado === 'cancelada') continue;
      if (new Date(c.fecha) < startOfDay(new Date())) {
        out.push({ prestamo: p, cuota: c });
      }
    }
  }
  return out;
}

export async function totalAtrasado() {
  const items = await cuotasAtrasadas();
  return items.reduce((sum, x) => sum + x.cuota.monto, 0);
}

export async function carteraTotal() {
  const items = await list();
  return items.reduce((sum, p) => {
    const pendiente = p.saldo_capital || 0;
    return sum + pendiente;
  }, 0);
}

export async function cantidadActivos() {
  const items = await activos();
  return items.length;
}

export async function cobrarHoy() {
  const items = await list();
  const orgId = await getOrgId();
  const hoy = startOfDay(new Date());
  const manana = new Date(hoy);
  manana.setDate(manana.getDate() + 1);

  const out = [];
  for (const p of items) {
    const { data: cuotas } = await supabase
      .from('cuotas')
      .select('*')
      .eq('prestamo_id', p.id)
      .eq('estado', 'pendiente')
      .gte('fecha', hoy.toISOString().slice(0, 10))
      .lt('fecha', manana.toISOString().slice(0, 10));
    if (!cuotas) continue;
    for (const c of cuotas) {
      out.push({ prestamo: p, cuota: c });
    }
  }
  return out;
}

export async function totalCobrarHoy() {
  const items = await cobrarHoy();
  return items.reduce((sum, x) => sum + x.cuota.monto, 0);
}

export async function resumen() {
  const [carteraTotalV, totalAtrasadoV, totalCobrarHoyV, activosCount] = await Promise.all([
    carteraTotal(),
    totalAtrasado(),
    totalCobrarHoy(),
    cantidadActivos(),
  ]);
  const atrasadosList = await cuotasAtrasadas();
  const cobrarHoyList = await cobrarHoy();
  return {
    carteraTotal: carteraTotalV,
    totalAtrasado: totalAtrasadoV,
    cantidadActivos: activosCount,
    cantidadAtrasados: atrasadosList.length,
    cantidadCobrarHoy: cobrarHoyList.length,
    totalCobrarHoy: totalCobrarHoyV,
  };
}

export function getStatus(prestamo) {
  if (!prestamo) return 'cancelado';
  if (prestamo.estado === 'cancelado') return 'cancelado';
  const hoy = startOfDay(new Date());
  const tieneAtrasada = (prestamo.cuotas || []).some((c) => {
    if (c.estado === 'pagada' || c.estado === 'cancelada') return false;
    return new Date(c.fecha) < hoy;
  });
  if (tieneAtrasada) return 'atrasado';
  if (!prestamo.cuotas || prestamo.cuotas.length === 0) return 'vigente';
  const todasCerradas = prestamo.cuotas.every(
    (c) => c.estado === 'pagada' || c.estado === 'cancelada',
  );
  if (todasCerradas) return 'cancelado';
  return 'vigente';
}

export function getSaldoCapital(prestamo) {
  if (!prestamo) return 0;
  return Number(prestamo.saldo_capital || 0);
}

export function cuotaDelPeriodo(prestamo) {
  if (!prestamo) return 0;
  return Math.round((getSaldoCapital(prestamo) * Number(prestamo.tasa)) / 100);
}

export function totalIntereses(prestamo) {
  return cuotaDelPeriodo(prestamo) * Number(prestamo?.n_cuotas || 0);
}

export function totalAPagar(prestamo) {
  return Number(prestamo?.monto || 0) + totalIntereses(prestamo);
}

export function liquidarTotal(prestamo) {
  if (!prestamo) return 0;
  return getSaldoCapital(prestamo) + cuotaDelPeriodo(prestamo);
}

export function proximoCobro(prestamo) {
  if (!prestamo) return null;
  return (prestamo.cuotas || []).find(
    (c) => c.estado !== 'pagada' && c.estado !== 'cancelada',
  ) || null;
}

export function refreshPrestamo(id) {
  return getById(id);
}

export function cuotasAgotadas(prestamo) {
  if (!prestamo || !prestamo.cuotas || prestamo.cuotas.length === 0) return false;
  const todasCerradas = prestamo.cuotas.every(
    (c) => c.estado === 'pagada' || c.estado === 'cancelada',
  );
  if (!todasCerradas) return false;
  return getSaldoCapital(prestamo) > 0;
}

export async function create({ clienteId, ruta, periodo, monto, tasa, nCuotas, fechaInicio, createdBy }) {
  const orgId = await getOrgId();
  const { data: { user } } = await supabase.auth.getUser();
  const cuotaMonto = Math.round((Number(monto) * Number(tasa)) / 100);
  const cuotas = buildCuotasPayload({
    fechaInicio,
    periodo,
    nCuotas,
    montoPorCuota: cuotaMonto,
  });

  const { data, error } = await supabase.rpc('create_prestamo_with_cuotas', {
    p_cliente_id: clienteId,
    p_ruta: ruta,
    p_periodo: periodo,
    p_monto: Number(monto),
    p_tasa: Number(tasa),
    p_n_cuotas: Number(nCuotas),
    p_fecha_inicio: fechaInicio,
    p_cuotas: cuotas,
  });
  if (error) throw error;
  if (!data) throw new Error('No se creó el préstamo');
  return await getById(data);
}

export async function extenderCuotas(prestamoId, nCuotas) {
  const prestamo = await getById(prestamoId);
  if (!prestamo) return null;
  const nExistentes = (prestamo.cuotas || []).length;
  const cuotaMonto = Math.round((getSaldoCapital(prestamo) * Number(prestamo.tasa)) / 100);
  const startDate = (prestamo.cuotas && prestamo.cuotas.length > 0)
    ? prestamo.cuotas[prestamo.cuotas.length - 1].fecha
    : prestamo.fecha_inicio;
  const start = parseLocalDate(startDate);
  const nuevasCuotas = [];
  let cursor = start;
  for (let i = 0; i < Number(nCuotas); i++) {
    cursor = nextCuotaDate(cursor, prestamo.periodo);
    nuevasCuotas.push({
      numero: nExistentes + i + 1,
      fecha: cursor.toISOString().slice(0, 10),
      monto: cuotaMonto,
    });
  }

  const { error } = await supabase.rpc('extender_prestamo_cuotas', {
    p_prestamo_id: prestamoId,
    p_nuevas_cuotas: nuevasCuotas,
  });
  if (error) throw error;

  return await getById(prestamoId);
}

export class PrestamoNoEncontradoError extends Error {
  constructor(id) {
    super(`Préstamo ${id} no encontrado`);
    this.name = 'PrestamoNoEncontradoError';
    this.id = id;
  }
}