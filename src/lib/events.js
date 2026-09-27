const EVENT_DATA_CHANGED = 'pmp:data-changed';

const TABLE_QUERY_KEYS = {
  clientes: ['clientes'],
  prestamos: ['prestamos'],
  cobros: ['cobros'],
  notificaciones: ['notificaciones'],
};

function getQueryClient() {
  if (typeof globalThis !== 'undefined' && globalThis.__pmpQueryClientRef?.current) {
    return globalThis.__pmpQueryClientRef.current;
  }
  // Fallback legacy (dev): main.jsx expone window.__pmpQueryClient solo en DEV.
  if (typeof window !== 'undefined' && window.__pmpQueryClient) {
    return window.__pmpQueryClient;
  }
  return null;
}

export function emitDataChanged(table) {
  if (table && TABLE_QUERY_KEYS[table]) {
    const qc = getQueryClient();
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
