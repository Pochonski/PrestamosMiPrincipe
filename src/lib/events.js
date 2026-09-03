const EVENT_DATA_CHANGED = 'pmp:data-changed';

const TABLE_QUERY_KEYS = {
  clientes: ['clientes'],
  prestamos: ['prestamos'],
  cobros: ['cobros'],
  notificaciones: ['notificaciones'],
};

export function emitDataChanged(table) {
  if (table && TABLE_QUERY_KEYS[table]) {
    const qc = typeof window !== 'undefined' ? window.__pmpQueryClient : null;
    if (qc) {
      qc.invalidateQueries({ queryKey: TABLE_QUERY_KEYS[table] });
    }
  }
  window.dispatchEvent(
    new CustomEvent(EVENT_DATA_CHANGED, { detail: { table } }),
  );
}

export function onDataChanged(handler) {
  function wrapped(e) {
    handler(e?.detail?.table);
  }
  window.addEventListener(EVENT_DATA_CHANGED, wrapped);
  return () => window.removeEventListener(EVENT_DATA_CHANGED, wrapped);
}
