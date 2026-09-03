import { supabase } from '../../lib/supabase';
import { emitDataChanged } from '../../lib/events';

const TABLES_ORG_SCOPED = ['clientes', 'prestamos', 'cobros', 'notificaciones'];

function idleCallback(timeout = 1000) {
  if (typeof window === 'undefined') return (fn) => setTimeout(fn, 0);
  if (typeof window.requestIdleCallback === 'function') {
    return (fn) => window.requestIdleCallback(fn, { timeout });
  }
  return (fn) => setTimeout(fn, 0);
}

export function chunkedQuery(table, builder, chunkSize = 1000) {
  return async function* () {
    let offset = 0;
    while (true) {
      const { data, error } = await builder().range(offset, offset + chunkSize - 1);
      if (error) throw error;
      if (!data || data.length === 0) return;
      for (const row of data) yield row;
      if (data.length < chunkSize) return;
      offset += chunkSize;
    }
  };
}

export async function buildBackup() {
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) throw new Error('No authenticated user');

  const { data: membership, error: mErr } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', userId)
    .single();
  if (mErr) throw mErr;
  const orgId = membership.org_id;

  const orgRows = await Promise.all(
    TABLES_ORG_SCOPED.map((table) =>
      supabase
        .from(table)
        .select('*')
        .eq('org_id', orgId)
        .range(0, 999)
        .then(({ data, error }) => {
          if (error) throw error;
          return [table, data ?? []];
        }),
    ),
  );

  const data = Object.fromEntries(orgRows);

  const prestamoIds = (data.prestamos || []).map((p) => p.id);
  if (prestamoIds.length > 0) {
    const { data: cuotasRows } = await supabase
      .from('cuotas')
      .select('*')
      .in('prestamo_id', prestamoIds)
      .range(0, 999);
    data.cuotas = cuotasRows ?? [];
  } else {
    data.cuotas = [];
  }

  return {
    app: 'pmp',
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  };
}

export function downloadBackup() {
  return buildBackup().then((backup) => idleCallback()(triggerDownload.bind(null, backup)));
}

function triggerDownload(backup) {
  const json = JSON.stringify(backup);
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

export function validateBackup(parsed) {
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

export function isArrayOfObjects(v) {
  return Array.isArray(v) && v.every((x) => x && typeof x === 'object' && !Array.isArray(x));
}

export function previewBackup(parsed) {
  return {
    exportedAt: parsed.exportedAt || null,
    version: parsed.version || 1,
    counts: {
      clientes: (parsed.data.clientes || []).length,
      prestamos: (parsed.data.prestamos || []).length,
      cuotas: (parsed.data.cuotas || []).length,
      cobros: (parsed.data.cobros || []).length,
      notificaciones: (parsed.data.notificaciones || []).length,
    },
  };
}

export function parseBackupFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        const err = validateBackup(parsed);
        if (err) return reject(new Error(err));
        resolve(parsed);
      } catch {
        reject(new Error('El archivo no es un JSON válido.'));
      }
    };
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.readAsText(file);
  });
}

export async function applyBackup(parsed) {
  const tables = ['clientes', 'prestamos', 'cobros', 'notificaciones'];
  await Promise.all(
    tables.map((table) => {
      const value = parsed.data[table];
      if (value == null) return Promise.resolve();
      const rows = Array.isArray(value) ? value : [];
      if (rows.length === 0) return Promise.resolve();
      return supabase
        .from(table)
        .upsert(rows, { onConflict: 'id' })
        .then(({ error }) => {
          if (error) throw error;
        });
    }),
  );
  const cuotas = parsed.data.cuotas;
  if (Array.isArray(cuotas) && cuotas.length > 0) {
    const { error } = await supabase
      .from('cuotas')
      .upsert(cuotas, { onConflict: 'id' });
    if (error) throw error;
  }
  emitDataChanged();
}