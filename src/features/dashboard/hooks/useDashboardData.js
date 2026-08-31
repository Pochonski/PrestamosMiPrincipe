import { useEffect, useState } from 'react';
import { getKpis, getQuickBadges, getRecentActivity } from '../selectors';

export function useDashboardData() {
  const [data, setData] = useState(() => ({
    kpis: getKpis(),
    badges: getQuickBadges(),
    recent: getRecentActivity(),
  }));

  useEffect(() => {
    function refresh() {
      setData({
        kpis: getKpis(),
        badges: getQuickBadges(),
        recent: getRecentActivity(),
      });
    }
    window.addEventListener('pmp:user-changed', refresh);
    window.addEventListener('pmp:data-changed', refresh);
    return () => {
      window.removeEventListener('pmp:user-changed', refresh);
      window.removeEventListener('pmp:data-changed', refresh);
    };
  }, []);

  return data;
}