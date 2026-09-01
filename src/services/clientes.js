import { supabase, getOrgId } from '../lib/supabase';

export async function list() {
  const orgId = await getOrgId();
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('org_id', orgId)
    .order('nombre');
  if (error) throw error;
  return data ?? [];
}

export async function getById(id) {
  const orgId = await getOrgId();
  const { data } = await supabase
    .from('clientes')
    .select('*')
    .eq('org_id', orgId)
    .eq('id', id)
    .maybeSingle();
  return data;
}

export async function count() {
  const items = await list();
  return items.length;
}

export async function buscar(query) {
  const orgId = await getOrgId();
  const q = String(query || '').trim();
  let qb = supabase
    .from('clientes')
    .select('*')
    .eq('org_id', orgId);
  if (q) {
    qb = qb.or(`nombre.ilike.%${q}%,cedula.ilike.%${q}%,telefono.ilike.%${q}%`);
  }
  const { data, error } = await qb.order('nombre');
  if (error) throw error;
  return data ?? [];
}

export async function create({ nombre, cedula, telefono, direccion }) {
  const orgId = await getOrgId();
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('clientes')
    .insert({
      org_id: orgId,
      nombre: String(nombre || '').trim(),
      cedula: String(cedula || '').trim(),
      telefono: String(telefono || '').trim(),
      direccion: String(direccion || '').trim(),
      created_by: user.id,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function update(id, patch) {
  const orgId = await getOrgId();
  const { data, error } = await supabase
    .from('clientes')
    .update({
      ...(patch.nombre !== undefined ? { nombre: String(patch.nombre).trim() } : {}),
      ...(patch.cedula !== undefined ? { cedula: String(patch.cedula).trim() } : {}),
      ...(patch.telefono !== undefined ? { telefono: String(patch.telefono).trim() } : {}),
      ...(patch.direccion !== undefined ? { direccion: String(patch.direccion).trim() } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('org_id', orgId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function remove(id) {
  const activos = await prestamosActivosDelCliente(id);
  if (activos.length > 0) {
    throw new ClienteTienePrestamosError(id, activos.length);
  }
  const orgId = await getOrgId();
  const { error } = await supabase.from('clientes').delete().eq('id', id).eq('org_id', orgId);
  if (error) throw error;
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