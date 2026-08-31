import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { PlaceholderPage } from '../ui/PlaceholderPage';
import { getTheme, setTheme } from '../../services/theme';
import * as usuariosService from '../../services/usuarios';
import * as notificacionesService from '../../services/notificaciones';
import { seed } from '../../services/storage';

const PAGE_META = {};

const SUB_PAGE_PARENT = {
  'cliente-detalle': 'clientes',
  'registrar-prestamo': 'clientes',
  'prestamo-detalle': 'clientes',
  cobro: 'clientes',
};

export function AppShell({ pages = {} }) {
  const [page, setPage] = useState('dashboard');
  const [params, setParams] = useState({});
  const [theme, setThemeState] = useState(() => getTheme());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userTick, setUserTick] = useState(0);
  const [notifTick, setNotifTick] = useState(0);

  useEffect(() => {
    seed();
  }, []);

  useEffect(() => {
    function onUserChange() {
      setUserTick((t) => t + 1);
    }
    function onDataChange() {
      setNotifTick((t) => t + 1);
    }
    window.addEventListener('pmp:user-changed', onUserChange);
    window.addEventListener('pmp:data-changed', onDataChange);
    return () => {
      window.removeEventListener('pmp:user-changed', onUserChange);
      window.removeEventListener('pmp:data-changed', onDataChange);
    };
  }, []);

  const actual = useMemo(() => {
    void userTick;
    return usuariosService.getActual();
  }, [userTick]);

  const notificationCount = useMemo(() => {
    void notifTick;
    return notificacionesService.countNoLeidas();
  }, [notifTick]);

  function handleToggleTheme(next) {
    setThemeState(next);
    setTheme(next);
  }

  function handleNavigate(id, newParams = {}) {
    setPage(id);
    setParams(newParams);
    setSidebarOpen(false);
  }

  const meta = PAGE_META[page];
  const PageComponent = pages[page];
  const sidebarPage = SUB_PAGE_PARENT[page] || page;

  return (
    <div className="flex min-h-screen bg-slate-50 text-navy-800 dark:bg-navy-900 dark:text-navy-100">
      <Sidebar
        open={sidebarOpen}
        page={sidebarPage}
        onNavigate={handleNavigate}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col lg:pl-72">
        <TopBar
          page={sidebarPage}
          onNavigate={handleNavigate}
          onOpenSidebar={() => setSidebarOpen(true)}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          notificationCount={notificationCount}
        />

        <main className={clsx('flex-1 px-3 pb-28 pt-4 sm:px-5 sm:pt-6 lg:pb-10')}>
          {PageComponent ? (
            <PageComponent onNavigate={handleNavigate} params={params} />
          ) : meta ? (
            <PlaceholderPage titulo={meta.titulo} descripcion={meta.descripcion} />
          ) : null}
        </main>

        <MobileBottomNav page={sidebarPage} onNavigate={handleNavigate} />

        <div
          aria-hidden="true"
          className="hidden border-t border-slate-200 bg-white px-5 py-3 text-xs text-slate-500 dark:border-navy-700 dark:bg-navy-900 dark:text-navy-300 lg:block"
        >
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <span>
              Sesión activa: <strong className="text-navy-700 dark:text-navy-100">{actual?.nombre}</strong> · {actual?.rol}
            </span>
            <span>Préstamos Mi Príncipe · v1.0.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}