const NOTIF_TIPOS = {
  mora: { label: 'Mora', tone: 'danger', icon: 'AlertTriangle' },
  cobro: { label: 'Cobro', tone: 'success', icon: 'HandCoins' },
  info: { label: 'Info', tone: 'info', icon: 'Info' },
};

export function getTipoMeta(tipo) {
  return NOTIF_TIPOS[tipo] || { label: tipo, tone: 'neutral', icon: 'Bell' };
}

export function getNotificacionesAgrupadas(items) {
  const ahora = new Date();
  const hoy = new Date(ahora);
  hoy.setHours(0, 0, 0, 0);
  const ayer = new Date(hoy);
  ayer.setDate(ayer.getDate() - 1);
  const haceSemana = new Date(hoy);
  haceSemana.setDate(haceSemana.getDate() - 7);

  const grupos = {
    Hoy: [],
    Ayer: [],
    'Esta semana': [],
    'Más antiguas': [],
  };

  for (const n of items) {
    const d = new Date(n.fecha);
    if (d >= hoy) grupos.Hoy.push(n);
    else if (d >= ayer) grupos.Ayer.push(n);
    else if (d >= haceSemana) grupos['Esta semana'].push(n);
    else grupos['Más antiguas'].push(n);
  }

  return Object.entries(grupos)
    .filter(([, list]) => list.length > 0)
    .map(([label, list]) => ({ label, list }));
}

export function formatFechaRelativa(fecha) {
  const d = new Date(fecha);
  const ahora = new Date();
  const diffMs = ahora - d;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'ahora';
  if (diffMin < 60) return `hace ${diffMin} min`;
  if (diffHr < 24) return `hace ${diffHr} h`;
  if (diffDay < 7) return `hace ${diffDay} d`;
  return d.toLocaleDateString('es-CR', { day: '2-digit', month: 'short' });
}

export const NAVT = {
  mora: 'atrasados',
  cobro: 'cobrar-hoy',
  info: null,
};