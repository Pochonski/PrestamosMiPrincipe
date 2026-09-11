import React from 'react';
import { Suspense, useCallback, useEffect, useState } from 'react';
import clsx from 'clsx';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { PlaceholderPage } from '../ui/PlaceholderPage';
import { Spinner } from '../ui/Spinner';
import { MeshGradient } from '../../features/auth/components/MeshGradient';
import { GrainOverlay } from '../ui/GrainOverlay';
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

  // Luz glass: posiciona el glare (--mx/--my) en la card bajo el cursor (delegación)
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    if (window.matchMedia('(hover: none)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    function onMove(e) {
      const el = e.target?.closest?.('.glass-glare');
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    }
    document.addEventListener('mousemove', onMove, { passive: true });
    return () => document.removeEventListener('mousemove', onMove);
  }, []);

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
    <div className="relative flex min-h-screen bg-cream-base text-navy-800 dark:bg-black dark:text-navy-100">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        <div className="absolute inset-0 bg-app-aurora-light dark:bg-app-aurora-dark" />
        <MeshGradient variant="app" />
        <GrainOverlay />
      </div>
      <Sidebar
        open={sidebarOpen}
        page={page}
        onNavigate={handleNavigate}
        onClose={handleCloseSidebar}
        orgName={currentOrg?.nombre}
        userName={profile?.full_name}
        rol={currentOrg?.rol}
      />

      <div className="relative z-10 flex min-w-0 flex-1 flex-col lg:pl-[calc(var(--sidebar-w)+1.5rem)] lg:pr-3">
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

        <footer className="hidden justify-center px-3 pb-3 lg:flex">
          <div className="glass-subtle glass-glare flex items-center gap-2.5 rounded-full py-2 pl-4 pr-5 text-xs text-neutral-500 dark:text-navy-300">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="truncate">
              Sesión activa:{' '}
              <strong className="font-semibold text-navy-700 dark:text-navy-100">
                {profile?.full_name || '—'}
              </strong>
            </span>
            <span
              aria-hidden="true"
              className="h-3 w-px shrink-0 bg-navy-900/10 dark:bg-white/15"
            />
            <span className="shrink-0 font-display font-semibold uppercase tracking-wider text-gold-600 dark:text-gold-300">
              {currentOrg?.rol || 'miembro'}
            </span>
            <span
              aria-hidden="true"
              className="h-3 w-px shrink-0 bg-navy-900/10 dark:bg-white/15"
            />
            <span className="shrink-0 tabular-nums">v1.0.0</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
