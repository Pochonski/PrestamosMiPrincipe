import { get, set, STORAGE_KEYS } from './storage';
import { uid } from '../lib/id';
import { emitDataChanged } from '../lib/events';

function emitChange() {
  emitDataChanged();
}

export function list() {
  return get(STORAGE_KEYS.notificaciones, []);
}

export function noLeidas() {
  return list().filter((n) => !n.leida);
}

export function countNoLeidas() {
  return noLeidas().length;
}

export function existeNoLeidaPorTipo(tipo) {
  return list().some((n) => n.tipo === tipo && !n.leida);
}

export function create({ tipo, titulo, mensaje, leida = false }) {
  const all = list();
  const nueva = {
    id: uid('notif'),
    tipo,
    titulo,
    mensaje,
    fecha: new Date().toISOString(),
    leida: Boolean(leida),
  };
  all.push(nueva);
  set(STORAGE_KEYS.notificaciones, all);
  emitChange();
  return nueva;
}

export function marcarLeida(id) {
  const all = list();
  const idx = all.findIndex((n) => n.id === id);
  if (idx === -1) return null;
  if (all[idx].leida) return all[idx];
  all[idx] = { ...all[idx], leida: true };
  set(STORAGE_KEYS.notificaciones, all);
  emitChange();
  return all[idx];
}

export function marcarTodasLeidas() {
  const all = list();
  const updated = all.map((n) => (n.leida ? n : { ...n, leida: true }));
  set(STORAGE_KEYS.notificaciones, updated);
  emitChange();
  return updated;
}