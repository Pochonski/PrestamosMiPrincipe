import React from 'react';
import { useMemo, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { Skeleton } from '../../components/ui/Skeleton';
import { IconBox } from '../../components/ui/IconBox';
import { Button } from '../../components/ui/Button';
import { SectionTitle } from '../../components/ui/SectionTitle';
import { StatCard } from '../../components/ui/StatCard';
import { showToast } from '../../components/ui/Toast';
import { useNotificaciones } from './hooks/useNotificaciones';
import { NotificacionItem } from './components/NotificacionItem';
import { NotificacionesFiltros } from './components/NotificacionesFiltros';
import { EmptyNotificaciones } from './components/EmptyNotificaciones';
import { NAVT } from './selectors';

export function NotificacionesPage({ onNavigate }) {
  const data = useNotificaciones();
  const [filter, setFilter] = useState('todas');

  const agrupadas = useMemo(() => data.getAgrupadas(filter), [filter, data.todas]);

  if (data.loading) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 sm:gap-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  function handleClick(item) {
    data.marcarLeida(item.id);
    const destino = NAVT[item.tipo];
    if (destino) {
      onNavigate?.(destino);
    }
  }

  function handleMarcarTodas() {
    data.marcarTodas();
    showToast('Todas marcadas como leídas', 'success');
  }

  const counts = { total: data.total, noLeidas: data.countNoLeidas };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 sm:gap-6">
      <header>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <IconBox icon={Bell} tone="info" size="md" />
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-navy-900 sm:text-2xl dark:text-white">
                Notificaciones
              </h1>
              <p className="mt-0.5 text-sm text-neutral-600 dark:text-navy-300">
                Avisos sobre cobros, atrasos e información del negocio.
              </p>
            </div>
          </div>

          {data.countNoLeidas > 0 && (
            <Button variant="secondary" size="sm" icon={CheckCheck} onClick={handleMarcarTodas}>
              Marcar todas
            </Button>
          )}
        </div>
      </header>

      <section className="space-y-2">
        <SectionTitle title="Resumen" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <StatCard
            label="Total"
            value={data.total}
            sub={data.total === 1 ? 'notificación' : 'notificaciones'}
            icon={Bell}
            tone="navy"
          />
          <StatCard
            label="No leídas"
            value={data.countNoLeidas}
            sub={data.countNoLeidas === 1 ? 'pendiente' : 'pendientes'}
            icon={Bell}
            tone={data.countNoLeidas > 0 ? 'gold' : 'neutral'}
          />
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <SectionTitle title="Bandeja" />
          <NotificacionesFiltros value={filter} onChange={setFilter} counts={counts} />
        </div>

        {agrupadas.length === 0 ? (
          <EmptyNotificaciones filter={filter} />
        ) : (
          <div className="space-y-5">
            {agrupadas.map((grupo) => (
              <div key={grupo.label} className="space-y-2">
                <p className="section-label px-1">
                  {grupo.label} · {grupo.list.length}
                </p>
                <ul className="space-y-2">
                  {grupo.list.map((item) => (
                    <li key={item.id} className="animate-fade-in">
                      <NotificacionItem item={item} onClick={handleClick} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default NotificacionesPage;
