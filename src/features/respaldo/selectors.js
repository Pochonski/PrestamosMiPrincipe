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

export const BACKUP_MAX_ROWS_PER_TABLE = 10000;
export const BACKUP_MAX_FILE_BYTES = 5 * 1024 * 1024;

async function fetchAllPaginated(table, orgId, { chunkSize = 1000, maxRows = BACKUP_MAX_ROWS_PER_TABLE } = {}) {
  const rows = [];
  let offset = 0;
  let truncated = false;
  for (;;) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('org_id', orgId)
      .range(offset, offset + chunkSize - 1);
    if (error) throw error;
    const page = data ?? [];
    const room = maxRows - rows.length;
    if (page.length > room) {
      rows.push(...page.slice(0, room));
      truncated = true;
      break;
    }
    rows.push(...page);
    if (page.length < chunkSize) break;
    offset += chunkSize;
    if (rows.length >= maxRows) {
      truncated = true;
      break;
    }
  }
  return { rows, truncated };
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

  const tables = {};
  let truncated = false;
  for (const table of TABLES_ORG_SCOPED) {
    const { rows, truncated: t } = await fetchAllPaginated(table, orgId);
    tables[table] = rows;
    truncated = truncated || t;
  }

  const data = { ...tables };

  const prestamoIds = (data.prestamos || []).map((p) => p.id);
  if (prestamoIds.length > 0) {
    // Cuotas por chunks de prestamo_ids (`.in()` grande falla) + paginación.
    const cuotasRows = [];
    let cuotasTruncated = false;
    const ID_CHUNK = 100;
    for (let i = 0; i < prestamoIds.length; i += ID_CHUNK) {
      const ids = prestamoIds.slice(i, i + ID_CHUNK);
      let offset = 0;
      for (;;) {
        const { data: page, error } = await supabase
          .from('cuotas')
          .select('*')
          .in('prestamo_id', ids)
          .range(offset, offset + 999);
        if (error) throw error;
        const rows = page ?? [];
        if (cuotasRows.length + rows.length > BACKUP_MAX_ROWS_PER_TABLE) {
          cuotasRows.push(...rows.slice(0, BACKUP_MAX_ROWS_PER_TABLE - cuotasRows.length));
          cuotasTruncated = true;
          break;
        }
        cuotasRows.push(...rows);
        if (rows.length < 1000) break;
        offset += 1000;
      }
      if (cuotasTruncated) break;
    }
    data.cuotas = cuotasRows;
    truncated = truncated || cuotasTruncated;
  } else {
    data.cuotas = [];
  }

  const backup = {
    app: 'pmp',
    version: 1,
    exportedAt: new Date().toISOString(),
    orgId,
    truncated,
    data,
  };
  if (truncated) {
    console.warn('[respaldo] backup truncado: supera el límite por tabla');
  }
  return backup;
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
  if (parsed.version != null && Number(parsed.version) !== 1) {
    return `Versión de respaldo no soportada (${parsed.version}).`;
  }
  const d = parsed.data;
  for (const t of ['clientes', 'prestamos', 'cuotas', 'cobros', 'notificaciones']) {
    if (d[t] != null && !isArrayOfObjects(d[t])) {
      return `El campo "${t}" del respaldo está corrupto.`;
    }
    if (Array.isArray(d[t]) && d[t].length > BACKUP_MAX_ROWS_PER_TABLE) {
      return `La tabla "${t}" supera el límite (${BACKUP_MAX_ROWS_PER_TABLE} filas).`;
    }
  }
  // Integridad referencial mínima: cuotas/cobros deben apuntar a préstamos incluidos.
  const prestamoIds = new Set((d.prestamos || []).map((p) => p?.id).filter(Boolean));
  if (prestamoIds.size > 0) {
    const huerfanas = (d.cuotas || []).filter((c) => c?.prestamo_id && !prestamoIds.has(c.prestamo_id));
    if (huerfanas.length > 0) {
      return `El respaldo tiene ${huerfanas.length} cuota(s) sin préstamo.`;
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
    if (file && file.size > BACKUP_MAX_FILE_BYTES) {
      reject(new Error(`El archivo supera el límite (${Math.round(BACKUP_MAX_FILE_BYTES / 1048576)} MB).`));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        if (typeof reader.result === 'string' && reader.result.length > BACKUP_MAX_FILE_BYTES * 2) {
          reject(new Error('El respaldo es demasiado grande.'));
          return;
        }
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

// Columnas permitidas por tabla: evita que un JSON manipulado inyecte
// org_id ajeno, created_by, o columnas inexistentes.
const RESTORE_ALLOWLIST = {
  clientes: ['id', 'nombre', 'cedula', 'telefono', 'direccion'],
  prestamos: ['id', 'cliente_id', 'ruta', 'periodo', 'monto', 'saldo_capital', 'tasa', 'tasa_comision', 'n_cuotas', 'fecha_inicio', 'estado'],
  cobros: ['id', 'prestamo_id', 'cliente_id', 'cuota_numero', 'monto', 'tipo', 'incluir_interes', 'capital_pagado', 'interes_pagado', 'nota', 'fecha'],
  notificaciones: ['id', 'tipo', 'titulo', 'mensaje', 'leida'],
  cuotas: ['id', 'prestamo_id', 'numero', 'fecha', 'monto', 'estado', 'pagada_en'],
};

function sanitizeRows(table, rows, orgId) {
  const allowed = RESTORE_ALLOWLIST[table] || [];
  return (rows || [])
    .filter((r) => r && typeof r === 'object')
    .map((r) => {
      const out = {};
      for (const k of allowed) {
        if (r[k] !== undefined) out[k] = r[k];
      }
      // El org_id siempre es el actual: nunca el del archivo (anti mezcla de orgs).
      if (table !== 'cuotas') out.org_id = orgId;
      return out;
    })
    .filter((r) => r.id);
}

export async function applyBackup(parsed) {
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

  const err = validateBackup(parsed);
  if (err) throw new Error(err);

  // Orden FK: clientes → prestamos → cuotas → cobros → notificaciones.
  // Secuencial (no Promise.all): un restore parcial dejaba FK rotas.
  // Es MERGE (upsert), no reemplazo: no borra lo que el backup no trae.
  const order = ['clientes', 'prestamos', 'cuotas', 'cobros', 'notificaciones'];
  for (const table of order) {
    const value = parsed.data[table];
    if (value == null) continue;
    const rows = sanitizeRows(table, Array.isArray(value) ? value : [], orgId);
    if (rows.length === 0) continue;
    // Chunks de 200 para no saturar PostgREST.
    for (let i = 0; i < rows.length; i += 200) {
      const chunk = rows.slice(i, i + 200);
      const { error } = await supabase.from(table).upsert(chunk, { onConflict: 'id' });
      if (error) throw error;
    }
  }
  emitDataChanged();
}