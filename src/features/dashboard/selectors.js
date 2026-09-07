import { supabase } from '../../lib/supabase';
import * as prestamosService from '../../services/prestamos';
import * as cobrosService from '../../services/cobros';
import * as clientesService from '../../services/clientes';
import * as notificacionesService from '../../services/notificaciones';
import * as carteraHistoryService from '../../services/carteraHistory';
import { resumenTotales, cobrosSerieDiaria, cobrosSerieMensual } from '../../services/totales';
import { startOfDay } from '../../lib/format';

export async function getKpis() {
  const t = await resumenTotales();
  return {
    carteraTotal: Number(t.carteraTotal ?? 0),
    totalAtrasado: Number(t.totalAtrasado ?? 0),
    cantidadAtrasados: Number(t.cantidadAtrasados ?? 0),
    cantidadActivos: Number(t.prestamosActivos ?? 0),
    totalCobrarHoy: Number(t.totalCobrarHoy ?? 0),
    cantidadCobrarHoy: Number(t.cantidadCobrarHoy ?? 0),
    totalCobradoHoy: Number(t.totalCobradoHoy ?? 0),
    cantidadCobradoHoy: Number(t.cantidadCobradoHoy ?? 0),
    totalClientes: Number(t.totalClientes ?? 0),
  };
}

export async function getQuickBadges() {
  const [notifs, t] = await Promise.all([
    notificacionesService.countNoLeidas(),
    (async () => {
      try {
        return await resumenTotales();
      } catch {
        return {};
      }
    })(),
  ]);
  return {
    notificaciones: notifs,
    atrasados: Number(t.cantidadAtrasados ?? 0),
    cobrarHoy: Number(t.cantidadCobrarHoy ?? 0),
  };
}

export function buildRecentActivity({ cobros, clientes, profiles = [], limit = 6 }) {
  const clientesById = new Map(clientes.map((c) => [c.id, c]));
  const profilesById = new Map((profiles ?? []).map((p) => [p.user_id, p]));
  return cobros.slice(0, limit).map((cobro) => {
    const clienteId = cobro.clienteId ?? cobro.cliente_id;
    const cuotaNumero = cobro.cuotaNumero ?? cobro.cuota_numero;
    const cobradorId = cobro.cobradorId ?? cobro.cobrador_id;
    const profile = profilesById.get(cobradorId);
    const cobradorStr = profile?.full_name ? ` · ${profile.full_name.split(' ')[0]}` : '';
    return {
      id: cobro.id,
      tipo: 'cobro',
      titulo: `Cobro a ${clientesById.get(clienteId)?.nombre || 'Cliente'}`,
      subtitulo: `Cuota #${cuotaNumero}${cobradorStr}${cobro.nota ? ` · ${cobro.nota}` : ''}`,
      monto: cobro.monto,
      fecha: cobro.fecha,
    };
  });
}

export async function getRecentActivity(limit = 6) {
  const cobros = await cobrosService.recientes(limit);
  const cobradorIds = [...new Set(cobros.map((c) => c.cobradorId ?? c.cobrador_id).filter(Boolean))];
  const [clientes, profilesRows] = await Promise.all([
    clientesService.list({ limit: 200, offset: 0 }),
    cobradorIds.length > 0
      ? supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', cobradorIds)
          .then(({ data }) => data ?? [])
      : Promise.resolve([]),
  ]);
  return buildRecentActivity({ cobros, clientes, profiles: profilesRows, limit });
}

export async function getCobrarHoyDetalle() {
  const hoy = await prestamosService.cobrarHoy();
  return hoy.map((x) => ({
    prestamoId: x.prestamo.id,
    clienteId: x.prestamo.clienteId,
    cuota: x.cuota,
  }));
}

function isSameDay(a, b) {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

export async function getMetrics() {
  const [snapshotResult, historyRows, serieDiaria, serieMensual] = await Promise.all([
    carteraHistoryService.snapshot().catch(() => null),
    carteraHistoryService.history(35).catch(() => []),
    cobrosSerieDiaria(7).catch(() => []),
    cobrosSerieMensual(6).catch(() => []),
  ]);

  // Label de mes abreviado para cada bucket mensual.
  const cobros6m = serieMensual.map((r) => ({
    label: new Date(`${r.mes}T00:00:00`).toLocaleDateString('es-CR', { month: 'short' }),
    value: Number(r.total || 0),
  }));

  // Sparkline de 7 días: map por fecha (los días sin cobros aparecen en 0).
  const spark7 = serieDiaria.map((r) => Number(r.total || 0));

  const hoy = startOfDay(new Date());
  const ayer = new Date(hoy);
  ayer.setDate(ayer.getDate() - 1);
  const hoyDiario = serieDiaria.find((r) => isSameDay(r.fecha, hoy));
  const ayerDiario = serieDiaria.find((r) => isSameDay(r.fecha, ayer));
  const cobradoAyer = Number(ayerDiario?.total || 0);

  const snapshotHoy = (historyRows || []).find((r) => isSameDay(r.fecha, hoy)) || null;
  const snapshotMesAnterior = findSnapshotMesAnterior(historyRows || []);
  const snapshotAyer = (historyRows || []).find((r) => isSameDay(r.fecha, ayer)) || null;

  return {
    cobros6m,
    spark7,
    porEstado: { vigente: 0, atrasado: 0, cancelado: 0 },
    cobrosPrevMes: 0,
    cobrosMes: Number(hoyDiario?.total || 0),
    cobradoAyer,
    snapshotHoy,
    snapshotMesAnterior,
    snapshotAyer: snapshotAyer ?? snapshotResult,
  };
}

function findSnapshotMesAnterior(rows) {
  if (!rows || rows.length === 0) return null;
  const ahora = new Date();
  const prevStart = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
  const prevEnd = new Date(ahora.getFullYear(), ahora.getMonth(), 0);
  const prevStartDay = startOfDay(prevStart);
  const prevEndDay = startOfDay(prevEnd);
  const inPrev = rows.filter((r) => {
    const d = startOfDay(r.fecha);
    return d >= prevStartDay && d <= prevEndDay;
  });
  if (inPrev.length === 0) return null;
  return inPrev[inPrev.length - 1];
}

export function deriveDeltas({ kpis, metrics }) {
  const deltas = {
    cobradoHoy: null,
    carteraTotal: null,
    totalAtrasado: null,
    totalCobrarHoy: null,
  };

  if (!metrics) return deltas;

  if (metrics.cobradoAyer > 0 && kpis.totalCobradoHoy != null) {
    deltas.cobradoHoy = ((kpis.totalCobradoHoy - metrics.cobradoAyer) / metrics.cobradoAyer) * 100;
  }

  if (metrics.snapshotMesAnterior && metrics.snapshotMesAnterior.cartera_total != null) {
    const prev = Number(metrics.snapshotMesAnterior.cartera_total);
    if (prev > 0) {
      deltas.carteraTotal = ((kpis.carteraTotal - prev) / prev) * 100;
    }
  }

  if (metrics.snapshotAyer && metrics.snapshotAyer.total_atrasado != null) {
    const prev = Number(metrics.snapshotAyer.total_atrasado);
    if (prev > 0) {
      deltas.totalAtrasado = ((kpis.totalAtrasado - prev) / prev) * 100;
    }
  }

  if (metrics.snapshotAyer && metrics.snapshotAyer.total_por_cobrar != null) {
    const prev = Number(metrics.snapshotAyer.total_por_cobrar);
    if (prev > 0) {
      deltas.totalCobrarHoy = ((kpis.totalCobrarHoy - prev) / prev) * 100;
    }
  }

  return deltas;
}