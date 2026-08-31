import { useEffect, useState } from 'react';
import { WelcomeHeader } from './components/WelcomeHeader';
import { KpiRow } from './components/KpiRow';
import { QuickActionsRow } from './components/QuickActionsRow';
import { PrimaryActions } from './components/PrimaryActions';
import { RecentActivity } from './components/RecentActivity';
import { SectionTitle } from '../../components/ui/SectionTitle';
import { useDashboardData } from './hooks/useDashboardData';
import * as usuariosService from '../../services/usuarios';

export function DashboardPage({ onNavigate }) {
  const data = useDashboardData();
  const [user, setUser] = useState(() => usuariosService.getActual());

  useEffect(() => {
    function refresh() {
      setUser(usuariosService.getActual());
    }
    window.addEventListener('pmp:user-changed', refresh);
    return () => window.removeEventListener('pmp:user-changed', refresh);
  }, []);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 sm:gap-6">
      <WelcomeHeader user={user} kpis={data.kpis} />

      <KpiRow kpis={data.kpis} />

      <section className="space-y-2">
        <SectionTitle title="Accesos rápidos" />
        <QuickActionsRow badges={data.badges} onNavigate={onNavigate} />
      </section>

      <section className="space-y-2">
        <SectionTitle title="Acciones principales" />
        <PrimaryActions onNavigate={onNavigate} />
      </section>

      <RecentActivity items={data.recent} />
    </div>
  );
}

export default DashboardPage;