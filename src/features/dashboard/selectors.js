import { supabase } from '../../lib/supabase';
import * as prestamosService from '../../services/prestamos';
import * as cobrosService from '../../services/cobros';
import * as clientesService from '../../services/clientes';
import * as notificacionesService from '../../services/notificaciones';
import * as carteraHistoryService from '../../services/carteraHistory';
import { startOfDay } from '../../lib/format';
import { computeResumen } from '../resumen/selectors';

export async function getKpis() {
  const [prestamos, cobros, totalClientes] = await Promise.all([
    prestamosService.resumen(),
    cobrosService.resumen(),
    clientesService.count(),
  ]);
  return {
    carteraTotal: prestamos.carteraTotal,
    totalAtrasado: prestamos.totalAtrasado,
    cantidadAtrasados: prestamos.cantidadAtrasados,
    cantidadActivos: prestamos.cantidadActivos,
    totalCobrarHoy: prestamos.totalCobrarHoy,
    cantidadCobrarHoy: prestamos.cantidadCobrarHoy,
    totalCobradoHoy: cobros.totalDelDia,
    cantidadCobradoHoy: cobros.cantidadDelDia,
    totalClientes,
  };
}

export async function getQuickBadges() {
  const [notifs, atrasadas, hoy] = await Promise.all([
    notificacionesService.countNoLeidas(),
    prestamosService.cuotasAtrasadas(),
    prestamosService.cobrarHoy(),
  ]);
  return {
    notificaciones: notifs,
    atrasados: atrasadas.length,
    cobrarHoy: hoy.length,
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
  const [snapshotResult, historyRows, cobros, prestamos, clientes] = await Promise.all([
    carteraHistoryService.snapshot().catch(() => null),
    carteraHistoryService.history(35).catch(() => []),
    cobrosService.list({ limit: 1000, offset: 0 }),
    prestamosService.list({ limit: 500, offset: 0 }),
    clientesService.list({ limit: 500, offset: 0 }),
  ]);

  const resumen = computeResumen({ clientes, prestamos, cobros });

  const cobradoAyer = cobros
    .filter((c) => {
      const ayer = startOfDay(new Date());
      ayer.setDate(ayer.getDate() - 1);
      return isSameDay(c.fecha, ayer);
    })
    .reduce((s, c) => s + Number(c.monto || 0), 0);

  const hoy = startOfDay(new Date());
  const snapshotHoy = (historyRows || []).find((r) => isSameDay(r.fecha, hoy)) || null;
  const snapshotMesAnterior = findSnapshotMesAnterior(historyRows || []);
  const snapshotAyer = (historyRows || []).find((r) => {
    const ayer = startOfDay(new Date());
    ayer.setDate(ayer.getDate() - 1);
    return isSameDay(r.fecha, ayer);
  }) || null;

  return {
    cobros6m: resumen.cobros6m || [],
    spark7: resumen.spark7 || [],
    porEstado: resumen.porEstado,
    cobrosPrevMes: resumen.kpis.cobrosPrevMes,
    cobrosMes: resumen.kpis.cobrosMes,
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