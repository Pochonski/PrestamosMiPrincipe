import { supabase, getOrgId } from '../lib/supabase';
import { throwIfError } from '../lib/supabase-errors';
import { emitDataChanged } from '../lib/events';

const DEFAULT_LIMIT = 50;

export async function list({ limit = DEFAULT_LIMIT, offset = 0 } = {}) {
  const orgId = await getOrgId();
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('org_id', orgId)
    .order('nombre')
    .range(offset, offset + limit - 1);
  throwIfError(error, 'clientes.list', { limit, offset });
  return data ?? [];
}

export async function getById(id) {
  const orgId = await getOrgId();
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('org_id', orgId)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function count() {
  const orgId = await getOrgId();
  const { count: total, error } = await supabase
    .from('clientes')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId);
  if (error) throw error;
  return total ?? 0;
}

export async function buscar(query, { limit = DEFAULT_LIMIT, offset = 0 } = {}) {
  const orgId = await getOrgId();
  const raw = String(query || '').trim();
  let qb = supabase
    .from('clientes')
    .select('*')
    .eq('org_id', orgId);
  if (raw) {
    const safe = raw.replace(/[%_,\\]/g, '');
    qb = qb.or(`nombre.ilike.%${safe}%,cedula.ilike.%${safe}%,telefono.ilike.%${safe}%,direccion.ilike.%${safe}%`);
  }
  const { data, error } = await qb
    .order('nombre')
    .range(offset, offset + limit - 1);
  throwIfError(error, 'clientes.buscar', { query: raw, limit, offset });
  return data ?? [];
}

export async function create({ nombre, cedula, telefono, direccion }) {
  const orgId = await getOrgId();
  const payload = {
    org_id: orgId,
    nombre: String(nombre || '').trim(),
    cedula: String(cedula || '').trim(),
    telefono: String(telefono || '').trim(),
    direccion: String(direccion || '').trim(),
  };
  const { data, error } = await supabase
    .from('clientes')
    .insert(payload)
    .select()
    .single();
  throwIfError(error, 'clientes.create', { payload });
  emitDataChanged('clientes');
  return data;
}

export async function update(id, patch) {
  const orgId = await getOrgId();
  const payload = {
    ...(patch.nombre !== undefined ? { nombre: String(patch.nombre).trim() } : {}),
    ...(patch.cedula !== undefined ? { cedula: String(patch.cedula).trim() } : {}),
    ...(patch.telefono !== undefined ? { telefono: String(patch.telefono).trim() } : {}),
    ...(patch.direccion !== undefined ? { direccion: String(patch.direccion).trim() } : {}),
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from('clientes')
    .update(payload)
    .eq('id', id)
    .eq('org_id', orgId)
    .select()
    .single();
  throwIfError(error, 'clientes.update', { id, payload });
  emitDataChanged('clientes');
  return data;
}

export async function remove(id) {
  const activos = await prestamosActivosDelCliente(id);
  if (activos.length > 0) {
    throw new ClienteTienePrestamosError(id, activos.length);
  }
  const orgId = await getOrgId();
  const { error } = await supabase.from('clientes').delete().eq('id', id).eq('org_id', orgId);
  throwIfError(error, 'clientes.remove', { id });
  emitDataChanged('clientes');
  return true;
}

export async function prestamosDelCliente(clienteId) {
  const orgId = await getOrgId();
  const { data, error } = await supabase
    .from('prestamos')
    .select('*')
    .eq('org_id', orgId)
    .eq('cliente_id', clienteId);
  if (error) throw error;
  return data ?? [];
}

export async function prestamosActivosDelCliente(clienteId) {
  const all = await prestamosDelCliente(clienteId);
  return all.filter(
    (p) => p.estado === 'vigente' || p.estado === 'atrasado',
  );
}

export async function tienePrestamosActivos(clienteId) {
  const all = await prestamosActivosDelCliente(clienteId);
  return all.length > 0;
}

export class ClienteTienePrestamosError extends Error {
  constructor(clienteId, cantidad) {
    super(`El cliente tiene ${cantidad} préstamo(s) activo(s).`);
    this.name = 'ClienteTienePrestamosError';
    this.clienteId = clienteId;
    this.cantidadPrestamos = cantidad;
  }
}