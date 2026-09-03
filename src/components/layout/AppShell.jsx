import React from 'react';
import { Suspense, useCallback, useEffect, useState } from 'react';
import clsx from 'clsx';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { PlaceholderPage } from '../ui/PlaceholderPage';
import { Spinner } from '../ui/Spinner';
import { getTheme, setTheme } from '../../services/theme';
import * as notificacionesService from '../../services/notificaciones';
import { onDataChanged } from '../../lib/events';
import { useAuth } from '../../features/auth/useAuth';

function PageSkeleton() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Spinner size="lg" tone="gold" />
    </div>
  );
}

export function AppShell({ pages = {}, page: controlledPage, params: controlledParams, onNavigate: controlledOnNavigate }) {
  const [internalPage, setInternalPage] = useState('dashboard');
  const [internalParams, setInternalParams] = useState({});
  const isControlled = controlledPage !== undefined && controlledOnNavigate !== undefined;
  const page = isControlled ? controlledPage : internalPage;
  const params = isControlled ? controlledParams ?? {} : internalParams;
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

  const handleNavigate = useCallback(
    (id, newParams = {}) => {
      if (isControlled) {
        controlledOnNavigate(id, newParams);
      } else {
        setInternalPage(id);
        setInternalParams(newParams);
      }
      setSidebarOpen(false);
    },
    [isControlled, controlledOnNavigate],
  );

  const handleCloseSidebar = useCallback(() => setSidebarOpen(false), []);
  const handleOpenSidebar = useCallback(() => setSidebarOpen(true), []);

  const PageComponent = pages[page];

  return (
    <div className="flex min-h-screen bg-neutral-50 text-navy-800 dark:bg-navy-900 dark:text-navy-100">
      <Sidebar
        open={sidebarOpen}
        page={page}
        onNavigate={handleNavigate}
        onClose={handleCloseSidebar}
      />

      <div className="flex min-w-0 flex-1 flex-col lg:pl-[var(--sidebar-w)]">
        <TopBar
          page={page}
          onNavigate={handleNavigate}
          onOpenSidebar={handleOpenSidebar}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          notificationCount={notificationCount}
        />

        <main
          className={clsx(
            'mx-auto w-full max-w-6xl flex-1 px-3 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-4 sm:px-5 sm:pt-6 lg:pb-10',
          )}
        >
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
          className="hidden border-t border-slate-200 bg-white px-5 py-3 text-xs text-neutral-500 dark:border-navy-700 dark:bg-navy-900 dark:text-navy-300 lg:block"
        >
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <span>
              Sesión activa:{' '}
              <strong className="text-navy-700 dark:text-navy-100">
                {profile?.full_name || '—'}
              </strong>{' '}
              · {currentOrg?.rol || 'miembro'}
            </span>
            <span>Préstamos Mi Príncipe · v1.0.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
