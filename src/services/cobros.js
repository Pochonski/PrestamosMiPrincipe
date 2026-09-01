import { supabase, getOrgId } from '../lib/supabase';
import { startOfDay, endOfDay } from '../lib/format';

export async function list() {
  const orgId = await getOrgId();
  const { data, error } = await supabase
    .from('cobros')
    .select('*')
    .eq('org_id', orgId)
    .order('fecha', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getById(id) {
  const orgId = await getOrgId();
  const { data } = await supabase
    .from('cobros')
    .select('*')
    .eq('org_id', orgId)
    .eq('id', id)
    .maybeSingle();
  return data;
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
  return data ?? [];
}

export async function totalDelDia() {
  const items = await delDia();
  return items.reduce((s, c) => s + c.monto, 0);
}

export async function recientes(limit = 8) {
  const all = await list();
  return all.slice(0, limit);
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
  return data ?? [];
}

export async function resumen() {
  const [all, hoy] = await Promise.all([list(), delDia()]);
  return {
    cantidad: all.length,
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
    throw error;
  }
  if (!data) throw new Error('No se creó el cobro');
  return await getById(data);
}