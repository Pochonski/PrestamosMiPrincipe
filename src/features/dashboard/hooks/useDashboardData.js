import { useQueries } from '@tanstack/react-query';
import { getKpis, getQuickBadges, getRecentActivity } from '../selectors';

const EMPTY_KPIS = {
  totalClientes: 0, prestamosActivos: 0, totalCobradoHoy: 0,
  cobrosHoyCount: 0, totalAtrasado: 0, carteraActiva: 0,
  cobrosMes: 0, cancelados30: 0, cantidadCobrarHoy: 0,
};
const EMPTY_BADGES = { notificaciones: 0, atrasados: 0, cobrarHoy: 0 };
const EMPTY_RECENT = [];

export function useDashboardData() {
  const results = useQueries({
    queries: [
      { queryKey: ['dashboard', 'kpis'], queryFn: getKpis, staleTime: 30_000 },
      { queryKey: ['dashboard', 'badges'], queryFn: getQuickBadges, staleTime: 30_000 },
      { queryKey: ['dashboard', 'recent'], queryFn: () => getRecentActivity(6), staleTime: 30_000 },
    ],
  });

  const [kpisQ, badgesQ, recentQ] = results;
  const loading = results.some((r) => r.isLoading) && !results.some((r) => r.data);

  return {
    kpis: kpisQ.data || EMPTY_KPIS,
    badges: badgesQ.data || EMPTY_BADGES,
    recent: recentQ.data || EMPTY_RECENT,
    loading,
  };
}