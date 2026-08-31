import { get, set, remove as removeKey } from '../../services/storage';
import { emitDataChanged } from '../../lib/events';

const KEY_PREFIX = 'pmp:v1:';
const BACKUP_KEYS = [
  'usuarios',
  'clientes',
  'prestamos',
  'cobros',
  'notificaciones',
  'usuarioActual',
  'theme',
];

function readKey(key) {
  return get(KEY_PREFIX + key, null);
}

export function buildBackup() {
  const data = {};
  for (const k of BACKUP_KEYS) {
    data[k] = readKey(k);
  }
  return {
    app: 'pmp',
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  };
}

export function downloadBackup() {
  const backup = buildBackup();
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pmp-respaldo-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return backup;
}

function isArrayOfObjects(v) {
  return Array.isArray(v) && v.every((x) => x && typeof x === 'object' && !Array.isArray(x));
}

function validateBackup(parsed) {
  if (!parsed || typeof parsed !== 'object') {
    return 'El archivo no contiene un respaldo válido.';
  }
  if (parsed.app !== 'pmp') {
    return 'El archivo no es un respaldo de Préstamos Mi Príncipe.';
  }
  if (!parsed.data || typeof parsed.data !== 'object') {
    return 'El archivo no contiene datos.';
  }
  const d = parsed.data;
  if (d.clientes != null && !isArrayOfObjects(d.clientes)) {
    return 'El campo "clientes" del respaldo está corrupto.';
  }
  if (d.prestamos != null && !isArrayOfObjects(d.prestamos)) {
    return 'El campo "préstamos" del respaldo está corrupto.';
  }
  if (d.prestamos) {
    for (const p of d.prestamos) {
      if (!Array.isArray(p.cuotas)) {
        return 'Un préstamo del respaldo no tiene cuotas válidas.';
      }
    }
  }
  if (d.cobros != null && !isArrayOfObjects(d.cobros)) {
    return 'El campo "cobros" del respaldo está corrupto.';
  }
  return null;
}

export function previewBackup(parsed) {
  return {
    exportedAt: parsed.exportedAt || null,
    version: parsed.version || 1,
    counts: {
      usuarios: (parsed.data.usuarios || []).length,
      clientes: (parsed.data.clientes || []).length,
      prestamos: (parsed.data.prestamos || []).length,
      cobros: (parsed.data.cobros || []).length,
      notificaciones: (parsed.data.notificaciones || []).length,
    },
  };
}

export async function parseBackupFile(file) {
  const text = await file.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('El archivo no es un JSON válido.');
  }
  const err = validateBackup(parsed);
  if (err) throw new Error(err);
  return parsed;
}

export function applyBackup(parsed) {
  for (const key of BACKUP_KEYS) {
    const value = parsed.data[key];
    if (value == null) {
      removeKey(KEY_PREFIX + key);
    } else {
      set(KEY_PREFIX + key, value);
    }
  }
  emitDataChanged();
}