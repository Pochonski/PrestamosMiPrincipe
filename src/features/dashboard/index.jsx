import { WelcomeHeader } from './components/WelcomeHeader';
import { KpiRow } from './components/KpiRow';
import { QuickActionsRow } from './components/QuickActionsRow';
import { PrimaryActions } from './components/PrimaryActions';
import { RecentActivity } from './components/RecentActivity';
import { SectionTitle } from '../../components/ui/SectionTitle';
import { Loader2 } from 'lucide-react';
import { useDashboardData } from './hooks/useDashboardData';
import { useAuth } from '../auth/useAuth';

export function DashboardPage({ onNavigate }) {
  const data = useDashboardData();
  const { user, profile } = useAuth();
  const dashboardUser = profile
    ? { nombre: profile.full_name || user?.email?.split('@')[0] || 'Usuario', color: profile.color }
    : null;

  if (data.loading) {
    return (
      <div className="mx-auto flex max-w-6xl items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 sm:gap-6">
      <WelcomeHeader user={dashboardUser} kpis={data.kpis} />

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