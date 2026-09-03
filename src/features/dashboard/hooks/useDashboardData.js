import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
  getKpis,
  getQuickBadges,
  getRecentActivity,
  getMetrics,
  deriveDeltas,
} from '../selectors';

const EMPTY_KPIS = {
  carteraTotal: 0,
  totalAtrasado: 0,
  cantidadAtrasados: 0,
  cantidadActivos: 0,
  totalCobrarHoy: 0,
  cantidadCobrarHoy: 0,
  totalCobradoHoy: 0,
  cantidadCobradoHoy: 0,
  totalClientes: 0,
};

const EMPTY_BADGES = { notificaciones: 0, atrasados: 0, cobrarHoy: 0 };
const EMPTY_RECENT = [];

export function useDashboardData() {
  const results = useQueries({
    queries: [
      { queryKey: ['dashboard', 'kpis'], queryFn: getKpis, staleTime: 30_000 },
      { queryKey: ['dashboard', 'badges'], queryFn: getQuickBadges, staleTime: 30_000 },
      { queryKey: ['dashboard', 'recent'], queryFn: () => getRecentActivity(6), staleTime: 30_000 },
      { queryKey: ['dashboard', 'metrics'], queryFn: getMetrics, staleTime: 60_000 },
    ],
  });

  const [kpisQ, badgesQ, recentQ, metricsQ] = results;
  const loading = results.some((r) => r.isLoading) && !results.some((r) => r.data);
  const error = results.find((r) => r.isError)?.error || null;

  const rawKpis = kpisQ.data ?? EMPTY_KPIS;
  const kpis = {
    carteraTotal: Number(rawKpis.carteraTotal ?? 0),
    totalAtrasado: Number(rawKpis.totalAtrasado ?? 0),
    cantidadAtrasados: Number(rawKpis.cantidadAtrasados ?? 0),
    cantidadActivos: Number(rawKpis.cantidadActivos ?? 0),
    totalCobrarHoy: Number(rawKpis.totalCobrarHoy ?? 0),
    cantidadCobrarHoy: Number(rawKpis.cantidadCobrarHoy ?? 0),
    totalCobradoHoy: Number(rawKpis.totalCobradoHoy ?? 0),
    cantidadCobradoHoy: Number(rawKpis.cantidadCobradoHoy ?? 0),
    totalClientes: Number(rawKpis.totalClientes ?? 0),
  };

  const rawBadges = badgesQ.data ?? EMPTY_BADGES;
  const badges = {
    notificaciones: Number(rawBadges.notificaciones ?? 0),
    atrasados: Number(rawBadges.atrasados ?? 0),
    cobrarHoy: Number(rawBadges.cobrarHoy ?? 0),
  };

  const recent = Array.isArray(recentQ.data) ? recentQ.data : EMPTY_RECENT;
  const metrics = metricsQ.data ?? null;

  const deltas = useMemo(
    () => deriveDeltas({ kpis, metrics }),
    [kpis, metrics],
  );

  const refetch = () => results.forEach((r) => r.refetch?.());

  return { kpis, badges, recent, metrics, deltas, loading, error, refetch };
}