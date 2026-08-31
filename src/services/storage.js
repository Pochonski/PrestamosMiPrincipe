import {
  SEED_VERSION,
  seedUsuarios,
  seedClientes,
  seedPrestamos,
  seedCobros,
  seedNotificaciones,
} from '../lib/mockData';

const NS = 'pmp:v1';
const SEED_KEY = `${NS}:seed`;

const KEYS = {
  usuarios: `${NS}:usuarios`,
  clientes: `${NS}:clientes`,
  prestamos: `${NS}:prestamos`,
  cobros: `${NS}:cobros`,
  notificaciones: `${NS}:notificaciones`,
  usuarioActual: `${NS}:usuarioActual`,
  theme: `${NS}:theme`,
};

export const STORAGE_KEYS = KEYS;

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.warn('[storage] write failed', key, err);
    return false;
  }
}

export function get(key, fallback = null) {
  return read(key, fallback);
}

export function set(key, value) {
  return write(key, value);
}

export function remove(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function has(key) {
  try {
    return localStorage.getItem(key) !== null;
  } catch {
    return false;
  }
}

export function isSeeded() {
  const v = read(SEED_KEY, null);
  return v === SEED_VERSION;
}

export function seed() {
  if (isSeeded()) return false;
  write(KEYS.usuarios, seedUsuarios);
  write(KEYS.clientes, seedClientes);
  write(KEYS.prestamos, seedPrestamos);
  write(KEYS.cobros, seedCobros);
  write(KEYS.notificaciones, seedNotificaciones);
  if (!has(KEYS.usuarioActual)) write(KEYS.usuarioActual, seedUsuarios[0].id);
  write(SEED_KEY, SEED_VERSION);
  return true;
}

export function reset() {
  Object.values(KEYS).forEach(remove);
  remove(SEED_KEY);
  seed();
}