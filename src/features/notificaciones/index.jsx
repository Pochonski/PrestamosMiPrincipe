import { useMemo, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
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

  const agrupadas = useMemo(
    () => data.getAgrupadas(filter),
    [filter, data],
  );

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
    <div className="mx-auto flex max-w-3xl flex-col gap-5 sm:gap-6">
      <header>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-navy-900 sm:text-2xl dark:text-white">
                Notificaciones
              </h1>
              <p className="mt-0.5 text-sm text-slate-600 dark:text-navy-300">
                Avisos sobre cobros, atrasos e información del negocio.
              </p>
            </div>
          </div>

          {data.countNoLeidas > 0 && (
            <button
              type="button"
              onClick={handleMarcarTodas}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-navy-700 transition-colors hover:bg-slate-50 dark:border-navy-700 dark:bg-navy-800 dark:text-navy-100 dark:hover:bg-navy-700"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Marcar todas
            </button>
          )}
        </div>
      </header>

      <section>
        <SectionTitle title="Resumen" />
        <div className="mt-3 grid grid-cols-2 gap-3 sm:gap-4">
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
                <p className="px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-navy-300">
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