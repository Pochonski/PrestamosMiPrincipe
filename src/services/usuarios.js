import { get, set, STORAGE_KEYS, seed, has } from './storage';

export function list() {
  return get(STORAGE_KEYS.usuarios, []);
}

export function getActual() {
  ensureSeed();
  const id = get(STORAGE_KEYS.usuarioActual);
  const usuarios = list();
  return usuarios.find((u) => u.id === id) || usuarios[0] || null;
}

export function setActual(usuarioId) {
  set(STORAGE_KEYS.usuarioActual, usuarioId);
  return getActual();
}

export function getById(usuarioId) {
  return list().find((u) => u.id === usuarioId) || null;
}

function ensureSeed() {
  if (!has(STORAGE_KEYS.usuarios)) seed();
}