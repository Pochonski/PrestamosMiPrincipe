import { memo } from 'react';
import clsx from 'clsx';
import { X } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { NAV_ITEMS, findItemById } from './nav-config';

export const Sidebar = memo(function Sidebar({ open, page, onNavigate, onClose }) {
  const current = findItemById(page);
  const activeId = current?.parent ?? current?.id ?? 'dashboard';
  const principal = NAV_ITEMS.filter((n) => n.section === 'principal');
  const acciones = NAV_ITEMS.filter((n) => n.section === 'acciones');

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-navy-900/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r bg-white shadow-card',
          'border-slate-200 dark:bg-navy-900 dark:border-navy-700',
          'transition-transform duration-200 ease-out lg:translate-x-0 lg:shadow-none',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-5 py-4 dark:border-navy-700">
          <Logo />
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-navy-300 dark:hover:bg-navy-800 lg:hidden"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-navy-300">
            Principal
          </p>
          <ul className="space-y-1">
            {principal.map((item) => (
              <NavLink
                key={item.id}
                item={item}
                active={activeId === item.id}
                onClick={() => { onNavigate(item.id); onClose(); }}
              />
            ))}
          </ul>

          <p className="mt-6 px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-navy-300">
            Acciones
          </p>
          <ul className="space-y-1">
            {acciones.map((item) => (
              <NavLink
                key={item.id}
                item={item}
                active={activeId === item.id}
                onClick={() => { onNavigate(item.id); onClose(); }}
              />
            ))}
          </ul>
        </nav>

        <div className="border-t border-slate-200 px-5 py-4 dark:border-navy-700">
          <div className="rounded-2xl bg-gold-gradient p-4 text-navy-900 shadow-glow">
            <p className="text-xs font-bold uppercase tracking-wider">Mi Príncipe</p>
            <p className="mt-1 text-sm font-semibold leading-snug">
              Tu información está respaldada y segura.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
});

const PREFETCH_MAP = {
  reportes: () => import('../../features/reportes'),
  resumen: () => import('../../features/resumen'),
  'cobrar-hoy': () => import('../../features/cobrar-hoy'),
  atrasados: () => import('../../features/atrasados'),
  clientes: () => import('../../features/clientes'),
  notificaciones: () => import('../../features/notificaciones'),
  exportar: () => import('../../features/exportar'),
  respaldar: () => import('../../features/respaldo'),
};

function NavLink({ item, active, onClick }) {
  const Icon = item.icon;
  const prefetch = PREFETCH_MAP[item.id];
  const handleEnter = () => {
    if (prefetch) prefetch();
  };
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        onMouseEnter={handleEnter}
        onFocus={handleEnter}
        aria-current={active ? 'page' : undefined}
        className={clsx(
          'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
          active
            ? 'bg-gold-50 text-gold-700 dark:bg-gold-500/10 dark:text-gold-300'
            : 'text-navy-700 hover:bg-slate-100 dark:text-navy-200 dark:hover:bg-navy-800',
        )}
      >
        <Icon
          className={clsx(
            'h-5 w-5 shrink-0',
            active ? 'text-gold-500' : 'text-slate-400 dark:text-navy-300',
          )}
        />
        <span className="truncate">{item.label}</span>
      </button>
    </li>
  );
}