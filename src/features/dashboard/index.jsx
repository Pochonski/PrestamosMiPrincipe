import React from 'react';
import { WelcomeHeader } from './components/WelcomeHeader';
import { KpiRow } from './components/KpiRow';
import { CobrosChart } from './components/CobrosChart';
import { QuickActionsRow } from './components/QuickActionsRow';
import { PrimaryActions } from './components/PrimaryActions';
import { RecentActivity } from './components/RecentActivity';
import { Skeleton } from '../../components/ui/Skeleton';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useDashboardData } from './hooks/useDashboardData';
import { useAuth } from '../auth/useAuth';

export function DashboardPage({ onNavigate }) {
  const data = useDashboardData();
  const { user, profile } = useAuth();
  const dashboardUser = profile
    ? {
        nombre: profile.full_name || user?.email?.split('@')[0] || 'Usuario',
        color: profile.color,
      }
    : null;

  if (data.loading) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 sm:gap-6">
        <Skeleton className="h-28 w-full rounded-card sm:h-32" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full sm:h-28" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 sm:gap-6">
      <WelcomeHeader user={dashboardUser} kpis={data.kpis} />

      {data.error && (
        <Alert
          tone="danger"
          title="Error cargando datos"
          action={
            <Button variant="outline" size="sm" onClick={data.refetch}>
              Reintentar
            </Button>
          }
        >
          No se pudieron cargar las métricas del dashboard.
        </Alert>
      )}

      <KpiRow kpis={data.kpis} deltas={data.deltas} metrics={data.metrics} />

      <section className="space-y-2">
        <h2 className="section-label">Accesos rápidos</h2>
        <QuickActionsRow badges={data.badges} onNavigate={onNavigate} />
      </section>

      <section className="space-y-2">
        <h2 className="section-label">Acciones principales</h2>
        <PrimaryActions onNavigate={onNavigate} />
      </section>

      <section className="space-y-2">
        <h2 className="section-label">Cobros últimos 6 meses</h2>
        <Card className="p-4 sm:p-5">
          <CobrosChart data={data.metrics?.cobros6m} />
        </Card>
      </section>

      <RecentActivity items={data.recent} />
    </div>
  );
}

export default DashboardPage;