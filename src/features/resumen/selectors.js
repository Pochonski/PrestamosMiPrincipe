import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import * as clientesService from '../../services/clientes';
import * as prestamosService from '../../services/prestamos';
import * as cobrosService from '../../services/cobros';
import { parseLocalDate, startOfDay } from '../../lib/format';

function isSameDay(a, b) {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

function getDateRange({ rango, from, to, hoy = new Date() }) {
  const h = startOfDay(hoy);
  if (rango === 'custom' && from && to) {
    return { start: startOfDay(parseLocalDate(from)), end: startOfDay(parseLocalDate(to)) };
  }
  if (rango === 'hoy') return { start: h, end: h };
  if (rango === '7d') return { start: new Date(h.getTime() - 6 * 86400000), end: h };
  if (rango === '30d') return { start: new Date(h.getTime() - 29 * 86400000), end: h };
  if (rango === 'mes') return { start: new Date(hoy.getFullYear(), hoy.getMonth(), 1), end: h };
  return null; // no filter
}

export function computeResumen({ clientes, prestamos, cobros, hoy = new Date(), filters = {} }) {
  const { rango, from, to, ruta } = filters;
  const hoyStart = startOfDay(hoy);
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const thirtyDaysAgo = new Date(hoy.getTime() - 30 * 86400000);

  // Ruta filter: filter prestamos and derive related data
  let prestamosFiltrados = prestamos;
  if (ruta) {
    prestamosFiltrados = prestamos.filter((p) => p.ruta === ruta);
  }
  const prestamosIds = new Set(prestamosFiltrados.map((p) => p.id));
  const clientesFiltrados = ruta
    ? clientes.filter((c) => prestamosFiltrados.some((p) => p.cliente_id === c.id))
    : clientes;

  const activos = prestamosFiltrados.filter((p) => p.estado === 'vigente' || p.estado === 'atrasado');

  // Cobros filtered by ruta if needed
  let cobrosFiltrados = cobros;
  if (ruta) {
    cobrosFiltrados = cobros.filter((c) => prestamosIds.has(c.prestamo_id) || prestamosIds.has(c.prestamoId));
  }

  // Date range for cobros display (affects charts and ultimosCobros)
  const range = getDateRange({ rango, from, to, hoy });
  let cobrosEnRango = cobrosFiltrados;
  if (range) {
    cobrosEnRango = cobrosFiltrados.filter((c) => {
      const d = startOfDay(parseLocalDate(c.fecha));
      return d >= range.start && d <= range.end;
    });
  }

  const totalCobradoHoy = cobrosFiltrados
    .filter((c) => isSameDay(parseLocalDate(c.fecha), hoyStart))
    .reduce((s, c) => s + Number(c.monto || 0), 0);
  const cobrosHoyCount = cobrosFiltrados.filter((c) => isSameDay(parseLocalDate(c.fecha), hoyStart)).length;

  // Correct atrasado: solo cuotas atrasadas
  let totalAtrasado = 0;
  let cantidadAtrasados = 0;
  for (const p of prestamosFiltrados) {
    const atrasadas = (p.cuotas || []).filter((c) => c.estado === 'pendiente' && parseLocalDate(c.fecha) < hoyStart);
    if (atrasadas.length > 0) {
      cantidadAtrasados += 1;
      totalAtrasado += atrasadas.reduce((s, c) => s + Number(c.monto || 0), 0);
    }
  }

  const cobrosMes = cobrosFiltrados
    .filter((c) => parseLocalDate(c.fecha) >= inicioMes)
    .reduce((s, c) => s + Number(c.monto || 0), 0);
  const cobrosPrevMes = (() => {
    const prevStart = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    const prevEnd = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
    const prevStartDay = startOfDay(prevStart);
    const prevEndDay = startOfDay(prevEnd);
    return cobrosFiltrados
      .filter((c) => {
        const d = startOfDay(parseLocalDate(c.fecha));
        return d >= prevStartDay && d <= prevEndDay;
      })
      .reduce((s, c) => s + Number(c.monto || 0), 0);
  })();

  // Cancelados 30d: estado cancelado y updated_at within 30d, fallback to cuotas pagada_en
  const cancelados30 = prestamosFiltrados.filter((p) => {
    if (p.estado !== 'cancelado') return false;
    const ref = p.updated_at ? parseLocalDate(p.updated_at) : null;
    if (ref) return ref >= thirtyDaysAgo;
    // fallback: any cuota pagada_en within 30d
    return (p.cuotas || []).some((c) => c.pagada_en && parseLocalDate(c.pagada_en) >= thirtyDaysAgo);
  }).length;

  // Por cobrar hoy: cuotas pendientes con fecha hoy
  let totalPorCobrarHoy = 0;
  let cantidadCobrarHoy = 0;
  for (const p of prestamosFiltrados) {
    for (const c of p.cuotas || []) {
      if (c.estado === 'pendiente' && isSameDay(parseLocalDate(c.fecha), hoyStart)) {
        cantidadCobrarHoy += 1;
        totalPorCobrarHoy += Number(c.monto || 0);
      }
    }
  }

  const carteraActiva = prestamosFiltrados.reduce((s, p) => s + Number(p.saldo_capital || 0), 0);
  const tasaMorosidad = carteraActiva > 0 ? (totalAtrasado / carteraActiva) * 100 : 0;
  const eficienciaCobroHoy = totalPorCobrarHoy > 0 ? (totalCobradoHoy / totalPorCobrarHoy) * 100 : null;
  const prestamoPromedio = activos.length > 0 ? carteraActiva / activos.length : 0;

  // Deltas
  const deltaCobrosMes = cobrosPrevMes > 0 ? ((cobrosMes - cobrosPrevMes) / cobrosPrevMes) * 100 : null;

  // Cobrado 7d / 30d series for sparklines
  const spark7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(hoyStart.getTime() - i * 86400000);
    const sum = cobrosFiltrados
      .filter((c) => isSameDay(parseLocalDate(c.fecha), d))
      .reduce((s, c) => s + Number(c.monto || 0), 0);
    spark7.push(sum);
  }
  const spark30 = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(hoyStart.getTime() - i * 86400000);
    // weekly buckets for 30d spark? keep daily then compress later
    const sum = cobrosFiltrados
      .filter((c) => isSameDay(parseLocalDate(c.fecha), d))
      .reduce((s, c) => s + Number(c.monto || 0), 0);
    spark30.push(sum);
  }

  // Top clientes within filtered scope
  const enriched = prestamosFiltrados.map((p) => ({
    ...p,
    prestamosCount: 1,
    totalPrestado: Number(p.monto || 0),
    saldoPendiente: Number(p.saldo_capital || 0),
  }));
  const topClientes = clientesFiltrados
    .map((c) => {
      const ps = enriched.filter((p) => p.cliente_id === c.id);
      const totalPrestado = ps.reduce((s, p) => s + p.totalPrestado, 0);
      const saldoPendiente = ps.reduce((s, p) => s + p.saldoPendiente, 0);
      return { ...c, prestamosCount: ps.length, totalPrestado, saldoPendiente };
    })
    .sort((a, b) => b.totalPrestado - a.totalPrestado)
    .slice(0, 5);

  const topMorosos = clientesFiltrados
    .map((c) => {
      const ps = prestamosFiltrados.filter((p) => p.cliente_id === c.id);
      let atrasado = 0;
      for (const p of ps) {
        for (const q of p.cuotas || []) {
          if (q.estado === 'pendiente' && parseLocalDate(q.fecha) < hoyStart) atrasado += Number(q.monto || 0);
        }
      }
      return { ...c, atrasado, prestamosCount: ps.length };
    })
    .filter((c) => c.atrasado > 0)
    .sort((a, b) => b.atrasado - a.atrasado)
    .slice(0, 5);

  // Saldo por ruta
  const saldoPorRuta = (() => {
    const map = new Map();
    for (const p of prestamosFiltrados) {
      const key = p.ruta || 'Sin ruta';
      map.set(key, (map.get(key) || 0) + Number(p.saldo_capital || 0));
    }
    return [...map.entries()]
      .map(([ruta, saldo]) => ({ ruta, saldo }))
      .sort((a, b) => b.saldo - a.saldo)
      .slice(0, 5);
  })();

  // Prestamos por estado for donut
  const porEstado = {
    vigente: prestamosFiltrados.filter((p) => p.estado === 'vigente').length,
    atrasado: prestamosFiltrados.filter((p) => p.estado === 'atrasado').length,
    cancelado: prestamosFiltrados.filter((p) => p.estado === 'cancelado').length,
  };

  // Cobros 6m for bar chart
  const cobros6m = (() => {
    const out = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const s = startOfDay(start);
      const e = startOfDay(end);
      const sum = cobrosFiltrados
        .filter((c) => {
          const cd = startOfDay(parseLocalDate(c.fecha));
          return cd >= s && cd <= e;
        })
        .reduce((sum2, c) => sum2 + Number(c.monto || 0), 0);
      out.push({ label: d.toLocaleDateString('es-CR', { month: 'short' }), value: sum });
    }
    return out;
  })();

  const ultimosCobros = [...cobrosEnRango]
    .sort((a, b) => parseLocalDate(b.fecha) - parseLocalDate(a.fecha))
    .slice(0, 10)
    .map((cobro) => ({
      ...cobro,
      cuotaNumero: cobro.cuota_numero ?? cobro.cuotaNumero ?? cobro.cuota ?? null,
      cliente: clientes.find((c) => c.id === cobro.cliente_id),
    }));

  const rutas = [...new Set(prestamos.map((p) => p.ruta).filter(Boolean))].sort();

  return {
    kpis: {
      totalClientes: clientesFiltrados.length,
      prestamosActivos: activos.length,
      totalCobradoHoy,
      cobrosHoyCount,
      totalAtrasado,
      cantidadAtrasados,
      carteraActiva,
      cobrosMes,
      cobrosPrevMes,
      deltaCobrosMes,
      cancelados30,
      cantidadCobrarHoy,
      totalPorCobrarHoy,
      tasaMorosidad,
      eficienciaCobroHoy,
      prestamoPromedio,
    },
    topClientes,
    topMorosos,
    ultimosCobros,
    saldoPorRuta,
    porEstado,
    cobros6m,
    spark7,
    spark30,
    rutas,
    cobrosEnRangoCount: cobrosEnRango.length,
    cobros30Count: cobrosFiltrados.filter((c) => parseLocalDate(c.fecha) >= thirtyDaysAgo).length,
  };
}

export const EMPTY_RESUMEN = {
  kpis: {
    totalClientes: 0,
    prestamosActivos: 0,
    totalCobradoHoy: 0,
    cobrosHoyCount: 0,
    totalAtrasado: 0,
    cantidadAtrasados: 0,
    carteraActiva: 0,
    cobrosMes: 0,
    cobrosPrevMes: 0,
    deltaCobrosMes: null,
    cancelados30: 0,
    cantidadCobrarHoy: 0,
    totalPorCobrarHoy: 0,
    tasaMorosidad: 0,
    eficienciaCobroHoy: null,
    prestamoPromedio: 0,
  },
  topClientes: [],
  topMorosos: [],
  ultimosCobros: [],
  saldoPorRuta: [],
  porEstado: { vigente: 0, atrasado: 0, cancelado: 0 },
  cobros6m: [],
  spark7: [],
  spark30: [],
  rutas: [],
  cobrosEnRangoCount: 0,
  cobros30Count: 0,
};

export function useResumenData(filters = {}) {
  const results = useQueries({
    queries: [
      { queryKey: ['clientes', 'all'], queryFn: () => clientesService.list({ limit: 500, offset: 0 }), staleTime: 60_000 },
      { queryKey: ['prestamos', 'all'], queryFn: () => prestamosService.list({ limit: 500, offset: 0 }), staleTime: 60_000 },
      { queryKey: ['cobros', 'all'], queryFn: () => cobrosService.list({ limit: 500, offset: 0 }), staleTime: 60_000 },
    ],
  });
  const [clientesQ, prestamosQ, cobrosQ] = results;
  const clientes = clientesQ.data ?? [];
  const prestamos = prestamosQ.data ?? [];
  const cobros = cobrosQ.data ?? [];
  const loading = results.some((r) => r.isLoading);
  const isError = results.some((r) => r.isError);
  const error = results.find((r) => r.error)?.error || null;
  const hasMore = [clientesQ.data, prestamosQ.data, cobrosQ.data].some((d) => Array.isArray(d) && d.length === 500);
  const data = useMemo(
    () => (clientesQ.data && prestamosQ.data && cobrosQ.data ? computeResumen({ clientes, prestamos, cobros, filters }) : EMPTY_RESUMEN),
    [clientes, prestamos, cobros, clientesQ.data, prestamosQ.data, cobrosQ.data, filters],
  );
  return { data, loading, isError, error, hasMore, refetch: () => results.forEach((r) => r.refetch?.()) };
}
