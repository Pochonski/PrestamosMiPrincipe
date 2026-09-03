import { supabase, getOrgId } from '../lib/supabase';
import { throwIfError } from '../lib/supabase-errors';
import { startOfDay, endOfDay } from '../lib/format';
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
  const { data } = await supabase
    .from('cobros')
    .select('*')
    .eq('org_id', orgId)
    .eq('id', id)
    .maybeSingle();
  return normalizeCobro(data);
}

export async function delDia() {
  const orgId = await getOrgId();
  const inicio = startOfDay(new Date()).toISOString();
  const fin = endOfDay(new Date()).toISOString();
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

export async function resumen() {
  const [all, hoy, count] = await Promise.all([
    list({ limit: 500, offset: 0 }),
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

export async function create({ prestamoId, cuotaNumero, monto, tipo, incluirInteres = false, cobradorId: _cobradorId, nota }) {
  const { data, error } = await supabase.rpc('create_cobro_with_updates', {
    p_prestamo_id: prestamoId,
    p_cuota_numero: Number(cuotaNumero),
    p_monto: Number(monto),
    p_tipo: tipo,
    p_incluir_interes: Boolean(incluirInteres),
    p_nota: nota || null,
  });
  if (error) {
    const msg = String(error.message || '').toLowerCase();
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
  emitDataChanged('cobros');
  return await getById(data);
}