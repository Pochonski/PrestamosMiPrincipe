import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { PlaceholderPage } from '../ui/PlaceholderPage';
import { getTheme, setTheme } from '../../services/theme';
import * as notificacionesService from '../../services/notificaciones';
import { onDataChanged } from '../../lib/events';
import { useAuth } from '../../features/auth/useAuth';

export function AppShell({ pages = {} }) {
  const [page, setPage] = useState('dashboard');
  const [params, setParams] = useState({});
  const [theme, setThemeState] = useState(() => getTheme());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const { profile, currentOrg } = useAuth();

  async function refreshNotifCount() {
    try {
      const n = await notificacionesService.countNoLeidas();
      setNotificationCount(n);
    } catch {
      setNotificationCount(0);
    }
  }

  useEffect(() => {
    refreshNotifCount();
    return onDataChanged(refreshNotifCount);
  }, []);

  function handleToggleTheme(next) {
    setThemeState(next);
    setTheme(next);
  }

  function handleNavigate(id, newParams = {}) {
    setPage(id);
    setParams(newParams);
    setSidebarOpen(false);
  }

  const PageComponent = pages[page];

  return (
    <div className="flex min-h-screen bg-slate-50 text-navy-800 dark:bg-navy-900 dark:text-navy-100">
      <Sidebar
        open={sidebarOpen}
        page={page}
        onNavigate={handleNavigate}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col lg:pl-72">
        <TopBar
          page={page}
          onNavigate={handleNavigate}
          onOpenSidebar={() => setSidebarOpen(true)}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          notificationCount={notificationCount}
        />

        <main className={clsx('flex-1 px-3 pb-28 pt-4 sm:px-5 sm:pt-6 lg:pb-10')}>
          {PageComponent ? (
            <PageComponent onNavigate={handleNavigate} params={params} />
          ) : (
            <PlaceholderPage titulo="Página no encontrada" descripcion="La sección solicitada no existe." />
          )}
        </main>

        <MobileBottomNav page={page} onNavigate={handleNavigate} />

        <div
          aria-hidden="true"
          className="hidden border-t border-slate-200 bg-white px-5 py-3 text-xs text-slate-500 dark:border-navy-700 dark:bg-navy-900 dark:text-navy-300 lg:block"
        >
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <span>
              Sesión activa: <strong className="text-navy-700 dark:text-navy-100">{profile?.full_name || '—'}</strong> · {currentOrg?.rol || 'miembro'}
            </span>
            <span>Préstamos Mi Príncipe · v1.0.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}