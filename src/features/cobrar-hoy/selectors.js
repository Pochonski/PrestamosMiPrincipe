import { useQueries, useQueryClient } from '@tanstack/react-query';
import * as prestamosService from '../../services/prestamos';
import * as clientesService from '../../services/clientes';
import * as cobrosService from '../../services/cobros';
import { parseLocalDate, startOfDay } from '../../lib/format';
import { useDataChange } from '../../lib/hooks/useDataChange';

export function getCobrarHoyDetalle() {
  return prestamosService.cobrarHoy().then((items) =>
    items.map(({ prestamo, cuota }) => ({
      prestamo,
      prestamoId: prestamo.id,
      clienteId: prestamo.clienteId,
      cuota,
    })),
  );
}

export function getResumenCobrarHoy() {
  return prestamosService.cobrarHoy().then((items) => ({
    cantidad: items.length,
    total: items.reduce((s, x) => s + x.cuota.monto, 0),
  }));
}

export function getAtrasadasDetalle() {
  return prestamosService.cuotasAtrasadas().then((items) =>
    (items || [])
      .map(({ prestamo, cuota }) => {
        if (!prestamo || !cuota) return null;
        const diffMs = Date.now() - new Date(cuota.fecha).getTime();
        return {
          prestamo,
          prestamoId: prestamo.id,
          clienteId: prestamo.clienteId,
          cuota,
          diasAtraso: Math.max(0, Math.floor(diffMs / 86400000)),
        };
      })
      .filter(Boolean),
  );
}

export function useCobrarHoy() {
  const results = useQueries({
    queries: [
      { queryKey: ['cobrarHoy', 'detalle'], queryFn: getCobrarHoyDetalle, staleTime: 30_000 },
      { queryKey: ['cobrarHoy', 'atrasadas'], queryFn: getAtrasadasDetalle, staleTime: 30_000 },
      { queryKey: ['clientes', 'all'], queryFn: () => clientesService.list({ limit: 500, offset: 0 }), staleTime: 60_000 },
    ],
  });
  const [itemsQ, atrasadasQ, clientesQ] = results;
  const clientes = clientesQ.data || [];
  const joinCliente = (x) => ({ ...x, cliente: clientes.find((c) => c.id === x.clienteId) || null });
  const items = (itemsQ.data || []).map(joinCliente).filter((x) => x.cliente);
  // Las fechas son disjuntas por definición (== hoy vs < hoy), pero se
  // protege contra solapamiento por si cambia la regla del servicio.
  const hoyKeys = new Set(items.map((x) => `${x.prestamoId}-${x.cuota?.numero}`));
  const atrasadas = (atrasadasQ.data || [])
    .map(joinCliente)
    .filter((x) => x.cliente && !hoyKeys.has(`${x.prestamoId}-${x.cuota?.numero}`))
    .sort((a, b) => b.diasAtraso - a.diasAtraso);
  const hoyTotal = items.reduce((s, x) => s + Number(x.cuota?.monto ?? 0), 0);
  const atrTotal = atrasadas.reduce((s, x) => s + Number(x.cuota?.monto ?? 0), 0);
  const loading = results.some((r) => r.isLoading) && !itemsQ.data;
  return {
    items,
    atrasadas,
    resumen: { cantidad: items.length, total: hoyTotal },
    resumenDia: {
      hoyCant: items.length,
      hoyTotal,
      atrCant: atrasadas.length,
      atrTotal,
      cantidad: items.length + atrasadas.length,
      total: hoyTotal + atrTotal,
    },
    loading,
  };
}

// ---------------------------------------------------------------------------
// Cobros del mes: agregación por cliente + conciliación
// ---------------------------------------------------------------------------

export const MES_TOLERANCIA = 1;

export function monthKeyOf(date = new Date()) {
  const d = date instanceof Date ? date : parseLocalDate(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function shiftMonth(monthKey, delta) {
  const [y, m] = String(monthKey).split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return monthKeyOf(d);
}

export function getMonthBounds(monthKey) {
  const [y, m] = String(monthKey).split('-').map(Number);
  const start = startOfDay(new Date(y, m - 1, 1));
  const end = startOfDay(new Date(y, m, 0));
  const label = new Date(y, m - 1, 1).toLocaleDateString('es-CR', { month: 'long', year: 'numeric' });
  return { start, end, label: label.charAt(0).toUpperCase() + label.slice(1) };
}

export function cobrosDelMes(cobros, monthKey) {
  const { start, end } = getMonthBounds(monthKey);
  return (cobros || []).filter((c) => {
    const d = startOfDay(parseLocalDate(c.fecha));
    return d >= start && d <= end;
  });
}

/** Desglose capital/interés con fallback por tipo para cobros viejos sin detalle. */
export function splitCapitalInteres(cobro) {
  const cap = Number(cobro?.capital_pagado ?? cobro?.capitalPagado ?? NaN);
  const inter = Number(cobro?.interes_pagado ?? cobro?.interesPagado ?? NaN);
  if (Number.isFinite(cap) && Number.isFinite(inter)) return { capital: cap, interes: inter };
  const monto = Number(cobro?.monto ?? 0);
  if (cobro?.tipo === 'capital') return { capital: monto, interes: 0 };
  return { capital: 0, interes: monto };
}

function cobroId(c) {
  return c.prestamo_id ?? c.prestamoId;
}

function clienteIdDe(c) {
  return c.cliente_id ?? c.clienteId;
}

export function agruparPorCliente(cobros, clientes = [], prestamos = []) {
  const clienteById = new Map((clientes || []).map((c) => [c.id, c]));
  const rutaByPrestamo = new Map((prestamos || []).map((p) => [p.id, p.ruta || 'Sin ruta']));
  const map = new Map();
  for (const cobro of cobros || []) {
    const cid = clienteIdDe(cobro);
    if (!map.has(cid)) {
      map.set(cid, {
        clienteId: cid,
        cliente: clienteById.get(cid) || null,
        total: 0,
        capital: 0,
        interes: 0,
        count: 0,
        ultimo: null,
        cobros: [],
      });
    }
    const g = map.get(cid);
    const { capital, interes } = splitCapitalInteres(cobro);
    const monto = Number(cobro.monto ?? 0);
    g.total += monto;
    g.capital += capital;
    g.interes += interes;
    g.count += 1;
    if (!g.ultimo || parseLocalDate(cobro.fecha) > parseLocalDate(g.ultimo)) g.ultimo = cobro.fecha;
    g.cobros.push({
      ...cobro,
      cuotaNumero: cobro.cuota_numero ?? cobro.cuotaNumero ?? null,
      ruta: rutaByPrestamo.get(cobroId(cobro)) || 'Sin ruta',
      _capital: capital,
      _interes: interes,
    });
  }
  for (const g of map.values()) {
    g.cobros.sort((a, b) => parseLocalDate(b.fecha) - parseLocalDate(a.fecha));
  }
  return [...map.values()];
}

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function filterGrupos(rows, { q = '', ruta = '', tipo = '' } = {}) {
  const query = norm(q).trim();
  return (rows || [])
    .map((g) => {
      let cobros = g.cobros;
      if (tipo === 'capital' || tipo === 'interes') cobros = cobros.filter((c) => c.tipo === tipo);
      if (ruta) cobros = cobros.filter((c) => String(c.ruta || '') === String(ruta));
      return { ...g, cobros };
    })
    .filter((g) => {
      if (g.cobros.length === 0) return false;
      if (query) {
        const hay = norm(`${g.cliente?.nombre || ''} ${g.cliente?.cedula || ''} ${g.cliente?.telefono || ''}`);
        if (!hay.includes(query)) return false;
      }
      return true;
    })
    .map((g) => {
      // Re-totalizar cuando hay filtro de tipo/ruta para que la fila cuadre con lo visible
      if (tipo || ruta) {
        const total = g.cobros.reduce((s, c) => s + Number(c.monto ?? 0), 0);
        const capital = g.cobros.reduce((s, c) => s + Number(c._capital ?? 0), 0);
        const interes = g.cobros.reduce((s, c) => s + Number(c._interes ?? 0), 0);
        return { ...g, total, capital, interes, count: g.cobros.length };
      }
      return g;
    });
}

export function sortGrupos(rows, sort = 'total') {
  const arr = [...(rows || [])];
  switch (sort) {
    case 'cobros':
      return arr.sort((a, b) => b.count - a.count || b.total - a.total);
    case 'nombre':
      return arr.sort((a, b) => norm(a.cliente?.nombre).localeCompare(norm(b.cliente?.nombre, 'es')));
    case 'reciente':
      return arr.sort((a, b) => parseLocalDate(b.ultimo) - parseLocalDate(a.ultimo));
    case 'total':
    default:
      return arr.sort((a, b) => b.total - a.total);
  }
}

export function totalesMes(cobros) {
  return (cobros || []).reduce(
    (acc, c) => {
      const { capital, interes } = splitCapitalInteres(c);
      acc.total += Number(c.monto ?? 0);
      acc.capital += capital;
      acc.interes += interes;
      acc.count += 1;
      return acc;
    },
    { total: 0, capital: 0, interes: 0, count: 0 },
  );
}

/**
 * Verifica que las cuentas cuadren:
 * 1) suma por cliente == total del mes
 * 2) capital + interés == total
 * 3) todos los cobros dentro del mes
 */
export function validarConciliacion({ cobros = [], grupos = [], totales = null, monthKey }) {
  const t = totales || totalesMes(cobros);
  const sumaClientes = (grupos || []).reduce((s, g) => s + Number(g.total ?? 0), 0);
  const { start, end } = getMonthBounds(monthKey);
  const fueraMes = (cobros || []).filter((c) => {
    const d = startOfDay(parseLocalDate(c.fecha));
    return d < start || d > end;
  }).length;
  const checks = [
    {
      id: 'suma-clientes',
      label: 'Suma por cliente = total del mes',
      ok: Math.abs(sumaClientes - t.total) <= MES_TOLERANCIA,
      detalle: `${sumaClientes} vs ${t.total}`,
    },
    {
      id: 'capital-interes',
      label: 'Capital + interés = total',
      ok: Math.abs(t.capital + t.interes - t.total) <= MES_TOLERANCIA,
      detalle: `${t.capital} + ${t.interes} vs ${t.total}`,
    },
    {
      id: 'rango-mes',
      label: 'Cobros dentro del mes',
      ok: fueraMes === 0,
      detalle: fueraMes === 0 ? `${t.count} cobros en rango` : `${fueraMes} fuera de rango`,
    },
  ];
  return { ok: checks.every((c) => c.ok), checks };
}

export async function getCobrosMesDetallado() {
  const [cobros, clientes, prestamos] = await Promise.all([
    cobrosService.listAll(),
    clientesService.list({ limit: 500, offset: 0 }),
    prestamosService.listAll(),
  ]);
  return { cobros, clientes, prestamos };
}

const EMPTY_MES = { total: 0, capital: 0, interes: 0, count: 0 };

export function useCobrosMes(monthKey) {
  const queryClient = useQueryClient();
  const results = useQueries({
    queries: [
      { queryKey: ['cobros', 'all'], queryFn: () => cobrosService.listAll(), staleTime: 30_000 },
      { queryKey: ['clientes', 'all'], queryFn: () => clientesService.list({ limit: 500, offset: 0 }), staleTime: 60_000 },
      { queryKey: ['prestamos', 'all'], queryFn: () => prestamosService.listAll(), staleTime: 30_000 },
    ],
  });
  const [cobrosQ, clientesQ, prestamosQ] = results;

  useDataChange((table) => {
    if (!table || table === 'cobros' || table === 'cuotas' || table === 'prestamos') {
      queryClient.invalidateQueries({ queryKey: ['cobros'] });
      queryClient.invalidateQueries({ queryKey: ['prestamos'] });
    }
    if (!table || table === 'clientes') {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    }
  });

  const ready = Boolean(cobrosQ.data && clientesQ.data && prestamosQ.data);
  const cobros = ready ? cobrosDelMes(cobrosQ.data, monthKey) : [];
  const grupos = ready ? agruparPorCliente(cobros, clientesQ.data, prestamosQ.data) : [];
  const totales = ready ? totalesMes(cobros) : EMPTY_MES;
  const prevKey = shiftMonth(monthKey, -1);
  const totalesPrev =
    ready && cobrosQ.data ? totalesMes(cobrosDelMes(cobrosQ.data, prevKey)) : EMPTY_MES;
  const validacion = ready
    ? validarConciliacion({ cobros, grupos, totales, monthKey })
    : { ok: true, checks: [] };
  const rutas = ready
    ? [...new Set((prestamosQ.data || []).map((p) => p.ruta).filter(Boolean))].sort((a, b) =>
        String(a).localeCompare(String(b), 'es'),
      )
    : [];
  const loading = results.some((r) => r.isLoading) && !cobrosQ.data;

  return {
    cobros,
    grupos,
    totales,
    totalesPrev,
    validacion,
    rutas,
    loading,
    error: cobrosQ.error || clientesQ.error || prestamosQ.error || null,
  };
}
