import React from 'react';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { PlaceholderPage } from '../ui/PlaceholderPage';
import { getTheme, setTheme } from '../../services/theme';
import * as notificacionesService from '../../services/notificaciones';
import { onDataChanged } from '../../lib/events';
import { useAuth } from '../../features/auth/useAuth';

function PageSkeleton() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-gold-500" />
    </div>
  );
}

export function AppShell({ pages = {} }) {
  const [page, setPage] = useState('dashboard');
  const [params, setParams] = useState({});
  const [theme, setThemeState] = useState(() => getTheme());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const { profile, currentOrg } = useAuth();

  const refreshNotifCount = useCallback(async () => {
    try {
      const n = await notificacionesService.countNoLeidas();
      setNotificationCount(n);
    } catch {
      setNotificationCount(0);
    }
  }, []);

  useEffect(() => {
    refreshNotifCount();
    return onDataChanged(refreshNotifCount);
  }, [refreshNotifCount]);

  const handleToggleTheme = useCallback((next) => {
    setThemeState(next);
    setTheme(next);
  }, []);

  const handleNavigate = useCallback((id, newParams = {}) => {
    setPage(id);
    setParams(newParams);
    setSidebarOpen(false);
  }, []);

  const handleCloseSidebar = useCallback(() => setSidebarOpen(false), []);
  const handleOpenSidebar = useCallback(() => setSidebarOpen(true), []);

  const PageComponent = pages[page];

  return (
    <div className="flex min-h-screen bg-slate-50 text-navy-800 dark:bg-navy-900 dark:text-navy-100">
      <Sidebar
        open={sidebarOpen}
        page={page}
        onNavigate={handleNavigate}
        onClose={handleCloseSidebar}
      />

      <div className="flex min-w-0 flex-1 flex-col lg:pl-72">
        <TopBar
          page={page}
          onNavigate={handleNavigate}
          onOpenSidebar={handleOpenSidebar}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          notificationCount={notificationCount}
        />

        <main className={clsx('flex-1 px-3 pb-28 pt-4 sm:px-5 sm:pt-6 lg:pb-10')}>
          {PageComponent ? (
            <Suspense fallback={<PageSkeleton />}>
              <PageComponent onNavigate={handleNavigate} params={params} />
            </Suspense>
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