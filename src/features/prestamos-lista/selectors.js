import { useQueries, useQueryClient } from '@tanstack/react-query';
import * as prestamosService from '../../services/prestamos';
import * as clientesService from '../../services/clientes';
import { useDataChange } from '../../lib/hooks/useDataChange';

export const TABS = [
  { id: 'todos', label: 'Todos' },
  { id: 'activos', label: 'Activos' },
  { id: 'vigente', label: 'Vigentes' },
  { id: 'atrasado', label: 'Atrasados' },
  { id: 'cancelado', label: 'Cancelados' },
];

export const SORTS = [
  { id: 'proximo', label: 'Próximo vencimiento' },
  { id: 'atraso', label: 'Mayor atraso' },
  { id: 'saldo', label: 'Mayor saldo' },
  { id: 'cuota', label: 'Mayor cuota' },
  { id: 'monto', label: 'Mayor monto' },
];

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isClosed(c) {
  return c.estado === 'pagada' || c.estado === 'cancelada';
}

/**
 * Enriquece un préstamo con todos los derivados para la lista.
 * Fila rica: estado, cuota $, próxima fecha, progreso, atraso, totales.
 */
export function enrichPrestamo(prestamo, cliente) {
  const cuotas = prestamo.cuotas || [];
  const status = prestamosService.getStatus(prestamo);
  const cuotaMonto = prestamosService.cuotaDelPeriodo(prestamo);
  const proxima = prestamosService.proximoCobro(prestamo);
  const saldo = prestamosService.getSaldoCapital(prestamo);
  const totalCuotas = cuotas.length;
  const pagadas = cuotas.filter(isClosed).length;
  const pendientes = totalCuotas - pagadas;
  const hoy = todayStr();
  const vencidas = cuotas.filter((c) => !isClosed(c) && String(c.fecha).slice(0, 10) < hoy);
  const totalVencido = vencidas.reduce((s, c) => s + Number(c.monto ?? 0), 0);

  let diasAtraso = 0;
  if (vencidas.length > 0) {
    const oldest = vencidas
      .map((c) => String(c.fecha).slice(0, 10))
      .sort()[0];
    const diffMs = Date.now() - new Date(`${oldest}T12:00:00`).getTime();
    diasAtraso = Math.max(0, Math.floor(diffMs / 86400000));
  }

  const totalCuotasN = Number(prestamo.n_cuotas ?? prestamo.nCuotas ?? totalCuotas ?? 0);
  const progreso = totalCuotas > 0 ? pagadas / totalCuotas : 0;

  return {
    prestamo,
    prestamoId: prestamo.id,
    clienteId: prestamo.clienteId ?? prestamo.cliente_id,
    cliente,
    status,
    cuotaMonto,
    proxima,
    saldo,
    totalCuotas,
    totalCuotasN,
    pagadas,
    pendientes,
    vencidas: vencidas.length,
    totalVencido,
    diasAtraso,
    progreso,
    totalAPagar: prestamosService.totalAPagar(prestamo),
    totalIntereses: prestamosService.totalIntereses(prestamo),
  };
}

export function enrichPrestamos(prestamos, clientes) {
  const byId = new Map((clientes || []).map((c) => [c.id, c]));
  return (prestamos || []).map((p) =>
    enrichPrestamo(p, byId.get(p.clienteId ?? p.cliente_id) || null),
  );
}

export async function getPrestamosDetallado() {
  const [prestamos, clientes] = await Promise.all([
    prestamosService.listAll(),
    clientesService.list({ limit: 500, offset: 0 }),
  ]);
  return enrichPrestamos(prestamos, clientes);
}

export function countByTab(rows) {
  const counts = { todos: rows.length, activos: 0, vigente: 0, atrasado: 0, cancelado: 0 };
  for (const r of rows) {
    if (r.status === 'vigente') {
      counts.vigente += 1;
      counts.activos += 1;
    } else if (r.status === 'atrasado') {
      counts.atrasado += 1;
      counts.activos += 1;
    } else if (r.status === 'cancelado') {
      counts.cancelado += 1;
    }
  }
  return counts;
}

export function extractRutas(rows) {
  const set = new Set();
  for (const r of rows) {
    const ruta = r.prestamo?.ruta;
    if (ruta) set.add(ruta);
  }
  return Array.from(set).sort((a, b) => String(a).localeCompare(String(b), 'es'));
}

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function filterPrestamos(rows, { tab = 'todos', q = '', ruta = '', periodo = '' } = {}) {
  const query = norm(q).trim();
  return (rows || []).filter((r) => {
    if (tab === 'activos') {
      if (!(r.status === 'vigente' || r.status === 'atrasado')) return false;
    } else if (tab && tab !== 'todos') {
      if (r.status !== tab) return false;
    }
    if (ruta && String(r.prestamo?.ruta || '') !== String(ruta)) return false;
    if (periodo && String(r.prestamo?.periodo?.tipo || '') !== String(periodo)) return false;
    if (query) {
      const hay = norm(
        `${r.cliente?.nombre || ''} ${r.cliente?.cedula || ''} ${r.cliente?.telefono || ''} ${r.prestamo?.ruta || ''}`,
      );
      if (!hay.includes(query)) return false;
    }
    return true;
  });
}

function proximaKey(r) {
  if (!r.proxima?.fecha) return '9999-99-99';
  return String(r.proxima.fecha).slice(0, 10);
}

export function sortPrestamos(rows, sort = 'proximo') {
  const arr = [...(rows || [])];
  switch (sort) {
    case 'atraso':
      return arr.sort((a, b) => b.diasAtraso - a.diasAtraso || proximaKey(a).localeCompare(proximaKey(b)));
    case 'saldo':
      return arr.sort((a, b) => b.saldo - a.saldo);
    case 'cuota':
      return arr.sort((a, b) => b.cuotaMonto - a.cuotaMonto);
    case 'monto':
      return arr.sort((a, b) => Number(b.prestamo?.monto ?? 0) - Number(a.prestamo?.monto ?? 0));
    case 'proximo':
    default:
      return arr.sort((a, b) => proximaKey(a).localeCompare(proximaKey(b)));
  }
}

export function getResumenPrestamos(rows) {
  const counts = countByTab(rows || []);
  const carteraActiva = (rows || [])
    .filter((r) => r.status === 'vigente' || r.status === 'atrasado')
    .reduce((s, r) => s + Number(r.saldo ?? 0), 0);
  const totalVencido = (rows || []).reduce((s, r) => s + Number(r.totalVencido ?? 0), 0);
  const proximaCobranza = (rows || [])
    .filter((r) => r.status === 'vigente' || r.status === 'atrasado')
    .reduce((s, r) => s + Number(r.cuotaMonto ?? 0), 0);
  return { ...counts, carteraActiva, totalVencido, proximaCobranza };
}

const EMPTY_RESUMEN = {
  todos: 0,
  activos: 0,
  vigente: 0,
  atrasado: 0,
  cancelado: 0,
  carteraActiva: 0,
  totalVencido: 0,
  proximaCobranza: 0,
};

export function usePrestamosLista() {
  const queryClient = useQueryClient();
  const results = useQueries({
    queries: [
      { queryKey: ['prestamos', 'all'], queryFn: () => prestamosService.listAll(), staleTime: 5 * 60_000 },
      { queryKey: ['clientes', 'all'], queryFn: () => clientesService.list({ limit: 500, offset: 0 }), staleTime: 10 * 60_000 },
    ],
  });
  const [prestamosQ, clientesQ] = results;

  useDataChange((table) => {
    if (!table || table === 'prestamos' || table === 'cuotas' || table === 'cobros') {
      queryClient.invalidateQueries({ queryKey: ['prestamos'] });
    }
    if (!table || table === 'clientes') {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    }
  });

  const rows = prestamosQ.data && clientesQ.data ? enrichPrestamos(prestamosQ.data, clientesQ.data) : [];
  const loading = results.some((r) => r.isLoading) && !prestamosQ.data;

  return {
    rows,
    counts: countByTab(rows),
    rutas: extractRutas(rows),
    resumen: rows.length > 0 ? getResumenPrestamos(rows) : EMPTY_RESUMEN,
    loading,
    error: prestamosQ.error || clientesQ.error || null,
  };
}
