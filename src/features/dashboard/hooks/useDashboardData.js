import { useEffect, useState } from 'react';
import { getKpis, getQuickBadges, getRecentActivity } from '../selectors';
import { useDataChange } from '../../../lib/hooks/useDataChange';

export function useDashboardData() {
  const [tick, setTick] = useState(0);
  const [state, setState] = useState({ data: null, loading: true });

  useDataChange(() => setTick((t) => t + 1));

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [kpis, badges, recent] = await Promise.all([
          getKpis(),
          getQuickBadges(),
          getRecentActivity(),
        ]);
        if (!cancelled) {
          setState({ data: { kpis, badges, recent }, loading: false });
        }
      } catch {
        if (!cancelled) setState({ data: null, loading: false });
      }
    }
    load();
    return () => { cancelled = true; };
  }, [tick]);

  if (state.loading && !state.data) {
    return {
      kpis: {
        totalClientes: 0, prestamosActivos: 0, totalCobradoHoy: 0,
        cobrosHoyCount: 0, totalAtrasado: 0, carteraActiva: 0,
        cobrosMes: 0, cancelados30: 0, cantidadCobrarHoy: 0,
      },
      badges: { notificaciones: 0, atrasados: 0, cobrarHoy: 0 },
      recent: [],
      loading: true,
    };
  }
  return state.data || {
    kpis: {
      totalClientes: 0, prestamosActivos: 0, totalCobradoHoy: 0,
      cobrosHoyCount: 0, totalAtrasado: 0, carteraActiva: 0,
      cobrosMes: 0, cancelados30: 0, cantidadCobrarHoy: 0,
    },
    badges: { notificaciones: 0, atrasados: 0, cobrarHoy: 0 },
    recent: [],
    loading: false,
  };
}