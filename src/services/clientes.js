import { get, set, STORAGE_KEYS } from './storage';
import { uid } from '../lib/id';
import { emitDataChanged } from '../lib/events';
import * as prestamosService from './prestamos';

export function list() {
  return get(STORAGE_KEYS.clientes, []);
}

export function getById(id) {
  return list().find((c) => c.id === id) || null;
}

export function count() {
  return list().length;
}

export function buscar(query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return list();
  return list().filter(
    (c) =>
      c.nombre.toLowerCase().includes(q) ||
      c.cedula.toLowerCase().includes(q) ||
      (c.telefono || '').includes(q),
  );
}

export class ClienteTienePrestamosError extends Error {
  constructor(clienteId, cantidad) {
    super(`El cliente ${clienteId} tiene ${cantidad} préstamo(s) activo(s).`);
    this.name = 'ClienteTienePrestamosError';
    this.clienteId = clienteId;
    this.cantidadPrestamos = cantidad;
  }
}

export function prestamosDelCliente(clienteId) {
  return prestamosService.list().filter((p) => p.clienteId === clienteId);
}

export function prestamosActivosDelCliente(clienteId) {
  return prestamosDelCliente(clienteId).filter(
    (p) => p.estado === 'vigente' || p.estado === 'atrasado',
  );
}

export function tienePrestamosActivos(clienteId) {
  return prestamosActivosDelCliente(clienteId).length > 0;
}

function emitChange() {
  emitDataChanged();
}

export function create({ nombre, direccion, telefono, cedula, creadoPor }) {
  const ahora = new Date().toISOString();
  const nuevo = {
    id: uid('c'),
    nombre: String(nombre || '').trim(),
    cedula: String(cedula || '').trim(),
    telefono: String(telefono || '').trim(),
    direccion: String(direccion || '').trim(),
    creadoEn: ahora,
    creadoPor: creadoPor || null,
    actualizadoEn: ahora,
  };
  const all = list();
  all.push(nuevo);
  set(STORAGE_KEYS.clientes, all);
  emitChange();
  return nuevo;
}

export function update(id, patch) {
  const all = list();
  const idx = all.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  const actualizado = {
    ...all[idx],
    ...patch,
    nombre: patch.nombre !== undefined ? String(patch.nombre).trim() : all[idx].nombre,
    direccion: patch.direccion !== undefined ? String(patch.direccion).trim() : all[idx].direccion,
    telefono: patch.telefono !== undefined ? String(patch.telefono).trim() : all[idx].telefono,
    cedula: patch.cedula !== undefined ? String(patch.cedula).trim() : all[idx].cedula,
    actualizadoEn: new Date().toISOString(),
  };
  all[idx] = actualizado;
  set(STORAGE_KEYS.clientes, all);
  emitChange();
  return actualizado;
}

export function remove(id) {
  const activos = prestamosActivosDelCliente(id);
  if (activos.length > 0) {
    throw new ClienteTienePrestamosError(id, activos.length);
  }
  const all = list().filter((c) => c.id !== id);
  set(STORAGE_KEYS.clientes, all);

  const cobrosAll = get(STORAGE_KEYS.cobros, []);
  const cobrosFiltrados = cobrosAll.filter((c) => c.clienteId !== id);
  if (cobrosFiltrados.length !== cobrosAll.length) {
    set(STORAGE_KEYS.cobros, cobrosFiltrados);
  }

  emitChange();
  return true;
}