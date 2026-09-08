import { supabase, getOrgId } from '../lib/supabase';
import { throwIfError } from '../lib/supabase-errors';
import { emitDataChanged } from '../lib/events';
import { parseLocalDate } from '../lib/format';
import { firstCuotaDate, nextCuotaDate, addDays } from '../lib/dates';

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function toLocalDateString(d) {
  const x = d instanceof Date ? d : new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, '0');
  const day = String(x.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function normalizePrestamo(p) {
  if (!p) return p;
  const { cliente_id, ...rest } = p;
  return { clienteId: cliente_id, ...rest };
}

async function hydratePrestamos(prestamos) {
  if (!prestamos || prestamos.length === 0) return prestamos;
  const ids = prestamos.map((p) => p.id);
  const { data: cuotas, error } = await supabase
    .from('cuotas')
    .select('*')
    .in('prestamo_id', ids)
    .order('numero', { ascending: true });
  throwIfError(error, 'prestamos.hydrate', { ids });
  const byPrestamo = new Map();
  for (const c of cuotas ?? []) {
    if (!byPrestamo.has(c.prestamo_id)) byPrestamo.set(c.prestamo_id, []);
    byPrestamo.get(c.prestamo_id).push(c);
  }
  return prestamos.map((p) => ({
    ...p,
    cuotas: byPrestamo.get(p.id) || [],
  }));
}

async function hydrateOne(prestamo) {
  if (!prestamo) return prestamo;
  const hydrated = await hydratePrestamos([prestamo]);
  return hydrated[0] || prestamo;
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

const DEFAULT_LIMIT = 50;

export async function list({ limit = DEFAULT_LIMIT, offset = 0 } = {}) {
  const orgId = await getOrgId();
  const { data, error } = await supabase
    .from('prestamos')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  throwIfError(error, 'prestamos.list', { limit, offset });
  const normalized = (data ?? []).map(normalizePrestamo);
  return hydratePrestamos(normalized);
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
  const normalized = normalizePrestamo(data);
  if (!normalized) return normalized;
  return hydrateOne(normalized);
}

export async function delCliente(clienteId) {
  const orgId = await getOrgId();
  const { data, error } = await supabase
    .from('prestamos')
    .select('*')
    .eq('org_id', orgId)
    .eq('cliente_id', clienteId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  const normalized = (data ?? []).map(normalizePrestamo);
  return hydratePrestamos(normalized);
}

/** Lista TODOS los préstamos paginando (las agregaciones no deben truncar en 50). */
export async function listAll({ pageSize = 200 } = {}) {
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

export function activos() {
  return listAll().then((items) =>
    items.filter((p) => getStatus(p) === 'vigente' || getStatus(p) === 'atrasado'),
  );
}

export async function cuotasAtrasadas(prestamoId = null) {
  const items = prestamoId
    ? [await getById(prestamoId)].filter(Boolean)
    : await listAll();
  const prestamoIds = items.filter(Boolean).map((p) => p.id);
  if (prestamoIds.length === 0) return [];
  const { data: cuotas, error } = await supabase
    .from('cuotas')
    .select('*')
    .in('prestamo_id', prestamoIds);
  throwIfError(error, 'prestamos.cuotasAtrasadas', { prestamoIds });
  if (!cuotas) return [];
  const hoy = startOfDay(new Date());
  const hoyStr = toLocalDateString(hoy);
  const prestamoMap = new Map(items.filter(Boolean).map((p) => [p.id, p]));
  return cuotas
    .filter((c) => c.estado === 'pendiente')
    .filter((c) => String(c.fecha).slice(0, 10) < hoyStr)
    .map((c) => ({ prestamo: prestamoMap.get(c.prestamo_id), cuota: c }));
}

export function calcCarteraTotal(items) {
  return (items || [])
    .filter((p) => p.estado !== 'cancelado')
    .reduce((sum, p) => sum + Number(p.saldo_capital ?? 0), 0);
}
export function calcTotalAtrasado(items) {
  return (items || []).reduce((sum, x) => sum + (x.cuota?.monto ?? x.monto ?? 0), 0);
}
export function calcTotalCobrarHoy(items) {
  return (items || []).reduce((sum, x) => sum + (x.cuota?.monto ?? 0), 0);
}
export async function totalAtrasado() {
  const items = await cuotasAtrasadas();
  return calcTotalAtrasado(items);
}

export async function carteraTotal() {
  const items = await listAll();
  return calcCarteraTotal(items);
}

export async function cantidadActivos() {
  const items = await activos();
  return items.length;
}

export async function cobrarHoy() {
  const items = await listAll();
  const hoy = startOfDay(new Date());
  const manana = new Date(hoy);
  manana.setDate(manana.getDate() + 1);
  const hoyStr = toLocalDateString(hoy);
  const mananaStr = toLocalDateString(manana);
  const prestamoIds = items.map((p) => p.id);
  if (prestamoIds.length === 0) return [];

  const { data: cuotas, error } = await supabase
    .from('cuotas')
    .select('*')
    .in('prestamo_id', prestamoIds)
    .eq('estado', 'pendiente')
    .gte('fecha', hoyStr)
    .lt('fecha', mananaStr);
  throwIfError(error, 'prestamos.cobrarHoy', { prestamoIds });
  if (!cuotas) return [];
  const prestamoMap = new Map(items.map((p) => [p.id, p]));
  return cuotas.map((c) => ({ prestamo: prestamoMap.get(c.prestamo_id), cuota: c }));
}

export async function totalCobrarHoy() {
  const items = await cobrarHoy();
  return calcTotalCobrarHoy(items);
}

export async function resumen() {
  const [carteraTotalV, totalAtrasadoV, totalCobrarHoyV, activosCount] = await Promise.all([
    carteraTotal(),
    totalAtrasado(),
    totalCobrarHoy(),
    cantidadActivos(),
  ]);
  const [atrasadosList, cobrarHoyList] = await Promise.all([cuotasAtrasadas(), cobrarHoy()]);
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
  const hoyStr = toLocalDateString(startOfDay(new Date()));
  const tieneAtrasada = (prestamo.cuotas || []).some((c) => {
    if (c.estado === 'pagada' || c.estado === 'cancelada') return false;
    return String(c.fecha).slice(0, 10) < hoyStr;
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
  return Number(prestamo.saldo_capital ?? prestamo.monto ?? 0);
}

export function cuotaDelPeriodo(prestamo) {
  if (!prestamo) return 0;
  return Math.round((getSaldoCapital(prestamo) * Number(prestamo.tasa ?? 0)) / 100);
}

export function totalIntereses(prestamo) {
  return cuotaDelPeriodo(prestamo) * Number(prestamo?.n_cuotas || prestamo?.nCuotas || 0);
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

export async function create({ clienteId, ruta, periodo, monto, tasa, tasaAcreedor, nCuotas, fechaInicio }) {
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
    p_tasa_acreedor: tasaAcreedor == null || tasaAcreedor === '' ? null : Number(tasaAcreedor),
  });
  if (error) throw error;
  if (!data) throw new Error('No se creó el préstamo');
  emitDataChanged('prestamos');
  emitDataChanged('cuotas');
  return await getById(data);
}

export async function extenderCuotas(prestamoId, nCuotas) {
  const n = Number(nCuotas);
  if (!Number.isFinite(n) || n < 1 || n > 60) {
    throw new Error('Cantidad de cuotas a extender inválida (1-60)');
  }
  const prestamo = await getById(prestamoId);
  if (!prestamo) throw new PrestamoNoEncontradoError(prestamoId);

  const cuotaMonto = Math.round((getSaldoCapital(prestamo) * Number(prestamo.tasa || 0)) / 100);
  const startDate = (prestamo.cuotas && prestamo.cuotas.length > 0)
    ? prestamo.cuotas[prestamo.cuotas.length - 1].fecha
    : prestamo.fecha_inicio;
  const start = parseLocalDate(startDate);
  const nuevasCuotas = [];
  let cursor = start;
  for (let i = 0; i < Number(nCuotas); i++) {
    cursor = nextCuotaDate(cursor, prestamo.periodo);
    nuevasCuotas.push({
      numero: prestamo.n_cuotas + i + 1,
      fecha: cursor.toISOString().slice(0, 10),
      monto: cuotaMonto,
    });
  }

  const { error } = await supabase.rpc('extender_prestamo_cuotas', {
    p_prestamo_id: prestamoId,
    p_nuevas_cuotas: nuevasCuotas,
  });
  if (error) throw error;

  // Sincronizar n_cuotas en la DB: el RPC antiguo solo insertaba cuotas sin
  // actualizar prestamos.n_cuotas (dejaba la DB inconsistente y provocaba
  // choques de unique(prestamo_id, numero) en la próxima extensión).
  // El RPC nuevo ya lo incrementa; este update es auto-reparador e idempotente.
  const esperado = Number(prestamo.n_cuotas) + n;
  try {
    const orgId = await getOrgId();
    await supabase
      .from('prestamos')
      .update({ n_cuotas: esperado, updated_at: new Date().toISOString() })
      .eq('id', prestamoId)
      .eq('org_id', orgId);
  } catch {
    // No bloquear: el getById siguiente expone el estado real.
  }

  emitDataChanged('prestamos');
  emitDataChanged('cuotas');
  return await getById(prestamoId);
}

export async function update(id, patch) {
  if (!patch || typeof patch !== 'object') patch = {};
  const prestamo = await getById(id);
  if (!prestamo) throw new PrestamoNoEncontradoError(id);

  // Resolver valores finales (patch o actual) con fallback seguro
  const p_ruta = patch.ruta !== undefined ? String(patch.ruta).trim() : prestamo.ruta;
  const p_periodo = patch.periodo !== undefined ? patch.periodo : prestamo.periodo || { tipo: 'mensual' };
  const p_monto = patch.monto !== undefined ? Number(patch.monto) : Number(prestamo.monto);
  const p_tasa = patch.tasa !== undefined ? Number(patch.tasa) : Number(prestamo.tasa ?? 0);
  const p_tasa_acreedor =
    patch.tasa_acreedor !== undefined
      ? (patch.tasa_acreedor == null || patch.tasa_acreedor === '' ? null : Number(patch.tasa_acreedor))
      : (prestamo.tasa_acreedor ?? null);
  const p_n_cuotas = patch.n_cuotas !== undefined ? Number(patch.n_cuotas) : Number(prestamo.n_cuotas);
  const p_fecha_inicio = patch.fecha_inicio !== undefined ? patch.fecha_inicio : prestamo.fecha_inicio || new Date().toISOString().slice(0, 10);

  const rutaChanged = patch.ruta !== undefined && p_ruta !== prestamo.ruta;
  const periodoChanged = patch.periodo !== undefined && JSON.stringify(p_periodo) !== JSON.stringify(prestamo.periodo);
  const montoChanged = patch.monto !== undefined && p_monto !== Number(prestamo.monto);
  const tasaChanged = patch.tasa !== undefined && p_tasa !== Number(prestamo.tasa ?? 0);
  const nCuotasChanged = patch.n_cuotas !== undefined && p_n_cuotas !== Number(prestamo.n_cuotas);
  const fechaChanged = patch.fecha_inicio !== undefined && p_fecha_inicio !== prestamo.fecha_inicio;
  const normTasaAcreedor = (v) => (v == null || v === '' ? null : Number(v));
  const tasaAcreedorChanged =
    patch.tasa_acreedor !== undefined &&
    normTasaAcreedor(p_tasa_acreedor) !== normTasaAcreedor(prestamo.tasa_acreedor);

  if (p_tasa_acreedor != null && p_tasa_acreedor > p_tasa) {
    throw new Error('La tasa del acreedor no puede superar la del cliente');
  }

  const cuotasAfectadas = montoChanged || tasaChanged || nCuotasChanged || periodoChanged || fechaChanged;

  // Nada que actualizar
  if (!cuotasAfectadas && !rutaChanged && !tasaAcreedorChanged) {
    return prestamo;
  }

  // Solo ruta y/o tasa_acreedor: update simple, sin tocar cuotas
  if (!cuotasAfectadas && (rutaChanged || tasaAcreedorChanged)) {
    const orgId = await getOrgId();
    const { data, error } = await supabase
      .from('prestamos')
      .update({ ruta: p_ruta, tasa_acreedor: p_tasa_acreedor, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single();
    throwIfError(error, 'prestamos.update.simple', { id });
    emitDataChanged('prestamos');
    return hydrateOne(normalizePrestamo(data));
  }

  // Recalcular cuotas pendientes preservando pagadas/canceladas
  const pagadas = (prestamo.cuotas || []).filter((c) => c.estado === 'pagada' || c.estado === 'cancelada');
  if (p_n_cuotas < pagadas.length) {
    throw new Error(`No se puede reducir a ${p_n_cuotas} cuotas: ya hay ${pagadas.length} cuotas pagadas/canceladas`);
  }
  const lastPagada = pagadas.length > 0
    ? pagadas.reduce((max, c) => (Number(c.numero) > Number(max.numero) ? c : max), pagadas[0])
    : null;
  const pendingCount = Math.max(0, p_n_cuotas - pagadas.length);
  const montoPorCuota = Math.round((p_monto * p_tasa) / 100);
  // Si cambió la fecha de inicio y hay cuotas pagadas, las pendientes se
  // desplazan por el mismo delta (las pagadas/canceladas quedan intactas
  // como historial). Sin esto, en préstamos con cobros la nueva fecha se
  // ignoraba por completo porque el cronograma se anclaba a la última
  // cuota pagada. Sin pagadas no se aplica: el cronograma ya nace de la
  // fecha nueva y el delta lo duplicaría.
  let deltaDias = 0;
  if (fechaChanged && lastPagada) {
    const oldFecha = parseLocalDate(prestamo.fecha_inicio);
    const newFecha = parseLocalDate(p_fecha_inicio);
    if (oldFecha && newFecha) {
      deltaDias = Math.round((newFecha - oldFecha) / 86400000);
    }
  }
  const pendingCuotas = [];
  if (pendingCount > 0) {
    const cursor = lastPagada
      ? nextCuotaDate(parseLocalDate(lastPagada.fecha), p_periodo)
      : firstCuotaDate(p_fecha_inicio, p_periodo);
    const startNumero = lastPagada ? Number(lastPagada.numero) + 1 : 1;
    let c = cursor;
    for (let i = 0; i < pendingCount; i++) {
      const f = deltaDias !== 0 ? addDays(c, deltaDias) : c;
      pendingCuotas.push({
        numero: startNumero + i,
        fecha: f.toISOString().slice(0, 10),
        monto: montoPorCuota,
      });
      c = nextCuotaDate(c, p_periodo);
    }
  }

  const { data: updatedId, error } = await supabase.rpc('update_prestamo_with_cuotas', {
    p_prestamo_id: id,
    p_ruta: p_ruta,
    p_periodo: p_periodo,
    p_monto: p_monto,
    p_tasa: p_tasa,
    p_n_cuotas: p_n_cuotas,
    p_fecha_inicio: p_fecha_inicio,
    p_cuotas: pendingCuotas,
    p_tasa_acreedor: p_tasa_acreedor,
  });
  throwIfError(error, 'prestamos.update.rpc', { id, patch });
  if (!updatedId) throw new Error('No se actualizó el préstamo');
  emitDataChanged('prestamos');
  emitDataChanged('cuotas');
  return await getById(id);
}

export async function remove(id) {
  const orgId = await getOrgId();
  const { data: prestamo, error: e1 } = await supabase
    .from('prestamos')
    .select('id, n_cuotas')
    .eq('id', id)
    .eq('org_id', orgId)
    .maybeSingle();
  throwIfError(e1, 'prestamos.remove.load', { id });
  if (!prestamo) throw new PrestamoNoEncontradoError(id);

  const { data: cobros, error: e2 } = await supabase
    .from('cobros')
    .select('id')
    .eq('org_id', orgId)
    .eq('prestamo_id', id);
  throwIfError(e2, 'prestamos.remove.checkCobros', { id });
  if (cobros && cobros.length > 0) {
    throw new Error(
      'No se puede eliminar un préstamo con cobros registrados. Si necesitas borrarlo, eliminá los cobros primero.',
    );
  }

  const { error: e3 } = await supabase
    .from('cuotas')
    .delete()
    .eq('prestamo_id', id);
  throwIfError(e3, 'prestamos.remove.deleteCuotas', { id });

  const { error } = await supabase
    .from('prestamos')
    .delete()
    .eq('id', id)
    .eq('org_id', orgId);
  throwIfError(error, 'prestamos.remove', { id });
  emitDataChanged('prestamos');
  emitDataChanged('cuotas');
  return true;
}

export class PrestamoNoEncontradoError extends Error {
  constructor(id) {
    super(`Préstamo ${id} no encontrado`);
    this.name = 'PrestamoNoEncontradoError';
    this.id = id;
  }
}
