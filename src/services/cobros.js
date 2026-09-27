import { supabase, getOrgId } from '../lib/supabase';
import { throwIfError } from '../lib/supabase-errors';
import { emitDataChanged } from '../lib/events';

const DEFAULT_LIMIT = 50;

function normalizeCobro(c) {
  if (!c || typeof c !== 'object') return c;
  return {
    ...c,
    clienteId: c.clienteId ?? c.cliente_id,
    cliente_id: c.cliente_id ?? c.clienteId,
    cuotaNumero: c.cuotaNumero ?? c.cuota_numero,
    cuota_numero: c.cuota_numero ?? c.cuotaNumero,
    cobradorId: c.cobradorId ?? c.cobrador_id,
    cobrador_id: c.cobrador_id ?? c.cobradorId,
    prestamoId: c.prestamoId ?? c.prestamo_id,
    prestamo_id: c.prestamo_id ?? c.prestamoId,
    incluirInteres: c.incluirInteres ?? c.incluir_interes,
    incluir_interes: c.incluir_interes ?? c.incluirInteres,
    fechaPago: c.fechaPago ?? c.fecha,
  };
}

export async function list({ limit = DEFAULT_LIMIT, offset = 0 } = {}) {
  const orgId = await getOrgId();
  const { data, error } = await supabase
    .from('cobros')
    .select('*')
    .eq('org_id', orgId)
    .order('fecha', { ascending: false })
    .range(offset, offset + limit - 1);
  throwIfError(error, 'cobros.list', { limit, offset });
  return (data ?? []).map(normalizeCobro);
}

export async function getById(id) {
  const orgId = await getOrgId();
  const { data, error } = await supabase
    .from('cobros')
    .select('*')
    .eq('org_id', orgId)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return normalizeCobro(data);
}

export async function delDia(fechaBase) {
  const orgId = await getOrgId();
  // Límites del día LOCAL convertidos a UTC (evita desfase de toISOString en UTC-6).
  // Si se pasa fechaBase (YYYY-MM-DD o Date), filtra ese día (útil para
  // verificar cobros retroactivos); si no, filtra hoy.
  const base = fechaBase ? new Date(fechaBase) : new Date();
  // parseLocalDate-safe: si viene YYYY-MM-DD, construir en local.
  let ref = base;
  if (typeof fechaBase === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fechaBase)) {
    const [y, m, d] = fechaBase.split('-').map(Number);
    ref = new Date(y, m - 1, d);
  }
  const inicio = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 0, 0, 0, 0).toISOString();
  const fin = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 23, 59, 59, 999).toISOString();
  const { data, error } = await supabase
    .from('cobros')
    .select('*')
    .eq('org_id', orgId)
    .gte('fecha', inicio)
    .lte('fecha', fin);
  if (error) throw error;
  return (data ?? []).map(normalizeCobro);
}

export async function totalDelDia() {
  const items = await delDia();
  return items.reduce((s, c) => s + c.monto, 0);
}

export async function recientes(limit = 8) {
  const orgId = await getOrgId();
  const { data, error } = await supabase
    .from('cobros')
    .select('*')
    .eq('org_id', orgId)
    .order('fecha', { ascending: false })
    .limit(limit);
  throwIfError(error, 'cobros.recientes', { limit });
  return (data ?? []).map(normalizeCobro);
}

export async function delPrestamo(prestamoId) {
  const orgId = await getOrgId();
  const { data, error } = await supabase
    .from('cobros')
    .select('*')
    .eq('org_id', orgId)
    .eq('prestamo_id', prestamoId)
    .order('fecha', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(normalizeCobro);
}

/** Lista TODOS los cobros paginando (el resumen no debe truncar en 500). */
export async function listAll({ pageSize = 500 } = {}) {
  const all = [];
  let offset = 0;
  for (;;) {
    const page = await list({ limit: pageSize, offset });
    all.push(...page);
    if (page.length < pageSize) break;
    offset += pageSize;
  }
  return all;
}

export async function resumen() {
  const [all, hoy, count] = await Promise.all([
    listAll({ pageSize: 500 }),
    delDia(),
    (async () => {
      const orgId = await getOrgId();
      const { count: total } = await supabase
        .from('cobros')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId);
      return total ?? 0;
    })(),
  ]);
  return {
    cantidad: count,
    totalCobrado: all.reduce((s, c) => s + c.monto, 0),
    totalDelDia: hoy.reduce((s, c) => s + c.monto, 0),
    cantidadDelDia: hoy.length,
  };
}

export class PrestamoNoEncontradoError extends Error {
  constructor(prestamoId) {
    super(`Préstamo ${prestamoId} no encontrado`);
    this.name = 'PrestamoNoEncontradoError';
    this.prestamoId = prestamoId;
  }
}

export class CuotaInvalidaError extends Error {
  constructor(cuotaNumero, motivo) {
    super(`Cuota #${cuotaNumero}: ${motivo}`);
    this.name = 'CuotaInvalidaError';
    this.cuotaNumero = cuotaNumero;
  }
}

export class MontoInvalidoError extends Error {
  constructor(motivo) {
    super(motivo);
    this.name = 'MontoInvalidoError';
  }
}

export class InteresesAtrasadosError extends Error {
  constructor(cantidad) {
    super(`Tenés ${cantidad} interés(es) atrasado(s). Pagalos antes de abonar a capital.`);
    this.name = 'InteresesAtrasadosError';
    this.cantidadAtrasados = cantidad;
  }
}

export class CuotasAgotadasError extends Error {
  constructor(saldoPendiente) {
    super(
      `Las cuotas del préstamo están agotadas pero queda saldo pendiente. Extendé las cuotas antes de hacer un abono a capital.`,
    );
    this.name = 'CuotasAgotadasError';
    this.saldoPendiente = saldoPendiente;
  }
}

export class SoloUltimoCobroError extends Error {
  constructor(accion = 'editar') {
    super(`Solo se puede ${accion} el último cobro del préstamo`);
    this.name = 'SoloUltimoCobroError';
  }
}

function mapCobroRpcError(error, { cuotaNumero, prestamoId, monto, tipo, accion = 'registrar' } = {}) {
  const msg = String(error?.message || '').toLowerCase();
  if (msg.includes('último cobro') || msg.includes('ultimo cobro')) {
    throw new SoloUltimoCobroError(accion === 'registrar' ? 'registrar' : accion);
  }
  if (msg.includes('cobro no encontrado')) {
    throw new Error('El cobro ya no existe');
  }
  if (msg.includes('monto menor')) {
    throw new MontoInvalidoError('El monto es menor que el interés del período');
  }
  if (msg.includes('cuota') && msg.includes('not pending')) {
    throw new CuotaInvalidaError(cuotaNumero, 'no está pendiente');
  }
  if (msg.includes('cuota') && msg.includes('no existe')) {
    throw new CuotaInvalidaError(cuotaNumero, 'no existe');
  }
  if (msg.includes('intereses atrasados') || msg.includes('atrasado')) {
    const match = msg.match(/(\d+)/);
    throw new InteresesAtrasadosError(match ? Number(match[1]) : 1);
  }
  if (msg.includes('cuotas agotadas') || msg.includes('agotad')) {
    throw new CuotasAgotadasError(0);
  }
  throwIfError(error, `cobros.${accion}`, { prestamoId, cuotaNumero, monto, tipo });
}

function toFechaIso(fechaPago) {
  if (!fechaPago) return null;
  if (fechaPago instanceof Date) return fechaPago.toISOString();
  if (typeof fechaPago === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fechaPago)) {
    // Mediodía local para que el día no se corra por UTC-6.
    const [y, m, d] = fechaPago.split('-').map(Number);
    return new Date(y, m - 1, d, 12, 0, 0, 0).toISOString();
  }
  const d = new Date(fechaPago);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

// Los cobros son un libro inmutable: no hay update/delete intencionalmente.
// El cobrador se deriva de auth.uid() dentro del RPC (no se acepta por parámetro
// para evitar suplantación).
export async function create({ prestamoId, cuotaNumero, monto, tipo, incluirInteres = false, nota, fechaPago }) {
  const { data, error } = await supabase.rpc('create_cobro_with_updates', {
    p_prestamo_id: prestamoId,
    p_cuota_numero: Number(cuotaNumero),
    p_monto: Number(monto),
    p_tipo: tipo,
    p_incluir_interes: Boolean(incluirInteres),
    p_nota: nota || null,
    p_fecha: toFechaIso(fechaPago),
  });
  if (error) {
    const msg = String(error.message || '').toLowerCase();
    if (msg.includes('futura')) {
      throw new Error('La fecha de pago no puede ser futura');
    }
    if (msg.includes('monto menor')) {
      throw new MontoInvalidoError('El monto es menor que el interés del período');
    }
    if (msg.includes('cuota') && msg.includes('not pending')) {
      throw new CuotaInvalidaError(cuotaNumero, 'no está pendiente');
    }
    if (msg.includes('intereses atrasados') || msg.includes('atrasado')) {
      const match = msg.match(/(\d+)/);
      throw new InteresesAtrasadosError(match ? Number(match[1]) : 1);
    }
    if (msg.includes('cuotas agotadas') || msg.includes('agotad')) {
      throw new CuotasAgotadasError(0);
    }
    if (error.code === '42703' || msg.includes('does not exist')) {
      throw new Error(
        'El RPC create_cobro_with_updates en el servidor referencia columnas inexistentes. ' +
        'Aplicá la migración src/features/auth/sql/migrations/2026-09-03-fix-create_cobro_with_updates.sql ' +
        'en Supabase SQL Editor.',
      );
    }
    throwIfError(error, 'cobros.create', { prestamoId, cuotaNumero, monto, tipo });
  }
  if (!data) throw new Error('No se creó el cobro');
  // El RPC muta prestamos.saldo_capital/estado y cuotas.estado: invalidar todo.
  emitDataChanged('cobros');
  emitDataChanged('prestamos');
  emitDataChanged('cuotas');
  return await getById(data);
}

/**
 * Edita el ÚLTIMO cobro del préstamo (tipo, cuota, monto, nota).
 * El RPC revierte el cobro viejo y aplica el nuevo en una transacción,
 * dejando préstamo y cuotas como si el cobro original nunca hubiera existido.
 * Requiere aplicar la migración 20260909000000_cobro_edit_delete.sql.
 */
export async function updateLast(cobroId, { cuotaNumero, monto, tipo, incluirInteres = false, nota, fechaPago }) {
  const { data, error } = await supabase.rpc('update_last_cobro', {
    p_cobro_id: cobroId,
    p_cuota_numero: Number(cuotaNumero),
    p_monto: Number(monto),
    p_tipo: tipo,
    p_incluir_interes: Boolean(incluirInteres),
    p_nota: nota || null,
    p_fecha: toFechaIso(fechaPago),
  });
  if (error) {
    const msg = String(error?.message || '').toLowerCase();
    if (msg.includes('futura')) {
      throw new Error('La fecha de pago no puede ser futura');
    }
    mapCobroRpcError(error, { cuotaNumero, monto, tipo, accion: 'editar' });
  }
  if (!data) throw new Error('No se actualizó el cobro');
  emitDataChanged('cobros');
  emitDataChanged('prestamos');
  emitDataChanged('cuotas');
  return await getById(data);
}

/**
 * Elimina el ÚLTIMO cobro del préstamo y revierte sus efectos
 * (cuota → pendiente, saldo restaurado, préstamo reabierto si corresponde).
 * Requiere aplicar la migración 20260909000000_cobro_edit_delete.sql.
 * Devuelve el prestamo_id afectado.
 */
export async function removeLast(cobroId) {
  const { data, error } = await supabase.rpc('delete_last_cobro', {
    p_cobro_id: cobroId,
  });
  if (error) {
    mapCobroRpcError(error, { accion: 'eliminar' });
  }
  emitDataChanged('cobros');
  emitDataChanged('prestamos');
  emitDataChanged('cuotas');
  return data;
}