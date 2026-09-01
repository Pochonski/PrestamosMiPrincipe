import { supabase } from '../../lib/supabase';
import { emitDataChanged } from '../../lib/events';

const TABLES = ['clientes', 'prestamos', 'cobros', 'notificaciones'];

export async function buildBackup() {
  const orgId = await supabase.auth.getSession().then(
    (s) => s.data.session?.user?.id,
  );
  if (!orgId) throw new Error('No authenticated user');
  const { data: userRow } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', orgId)
    .single();

  const data = {};
  for (const table of TABLES) {
    const { data: rows } = await supabase
      .from(table)
      .select('*')
      .eq('org_id', userRow.org_id);
    data[table] = rows ?? [];
  }
  return {
    app: 'pmp',
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  };
}

export function downloadBackup() {
  return buildBackup().then((backup) => {
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
  });
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
  for (const t of ['clientes', 'prestamos', 'cuotas', 'cobros', 'notificaciones']) {
    if (d[t] != null && !isArrayOfObjects(d[t])) {
      return `El campo "${t}" del respaldo está corrupto.`;
    }
  }
  return null;
}

function isArrayOfObjects(v) {
  return Array.isArray(v) && v.every((x) => x && typeof x === 'object' && !Array.isArray(x));
}

export function previewBackup(parsed) {
  return {
    exportedAt: parsed.exportedAt || null,
    version: parsed.version || 1,
    counts: {
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

export async function applyBackup(parsed) {
  const tables = ['clientes', 'prestamos', 'cobros', 'notificaciones'];
  for (const table of tables) {
    const value = parsed.data[table];
    if (value == null) continue;
    const rows = Array.isArray(value) ? value : [];
    if (rows.length === 0) continue;
    const { error } = await supabase.from(table).upsert(rows, { onConflict: 'id' });
    if (error) throw error;
  }
  emitDataChanged();
}