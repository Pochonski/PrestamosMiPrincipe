import React from 'react';
import { memo } from 'react';
import clsx from 'clsx';
import { X } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { NAV_ITEMS, findItemById } from './nav-config';

const PREFETCH_MAP = {
  reportes: () => import('../../features/reportes'),
  resumen: () => import('../../features/resumen'),
  'cobrar-hoy': () => import('../../features/cobrar-hoy'),
  atrasados: () => import('../../features/atrasados'),
  clientes: () => import('../../features/clientes'),
  notificaciones: () => import('../../features/notificaciones'),
  exportar: () => import('../../features/exportar'),
  respaldar: () => import('../../features/respaldo'),
  'registrar-prestamo': () => import('../../features/prestamos'),
  cobro: () => import('../../features/cobros'),
};

export const Sidebar = memo(function Sidebar({ open, page, onNavigate, onClose }) {
  const current = findItemById(page);
  const activeId = current?.parent ?? current?.id ?? 'dashboard';
  const principal = NAV_ITEMS.filter((n) => n.section === 'principal');
  const acciones = NAV_ITEMS.filter((n) => n.section === 'acciones');

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-navy-900/60 backdrop-blur-sm transition-opacity duration-200 lg:hidden animate-fade-in"
        />
      )}

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-white shadow-card',
          'border-slate-200 dark:bg-navy-900 dark:border-navy-700',
          'transition-transform duration-300 ease-out',
          'w-[var(--sidebar-w)] lg:translate-x-0 lg:shadow-none',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-5 py-4 dark:border-navy-700">
          <Logo />
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-input text-neutral-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-navy-300 dark:hover:bg-navy-800 lg:hidden"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
          <p className="section-label px-3 pb-2">Principal</p>
          <ul className="space-y-1">
            {principal.map((item) => (
              <NavLink
                key={item.id}
                item={item}
                active={activeId === item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
              />
            ))}
          </ul>

          <p className="section-label mt-6 px-3 pb-2">Acciones</p>
          <ul className="space-y-1">
            {acciones.map((item) => (
              <NavLink
                key={item.id}
                item={item}
                active={activeId === item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
              />
            ))}
          </ul>
        </nav>

        <div className="border-t border-slate-200 px-4 py-4 dark:border-navy-700">
          <div className="relative overflow-hidden rounded-card bg-gold-gradient p-4 text-navy-900 shadow-glow">
            <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/15 blur-xl" />
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Mi Príncipe</p>
            <p className="mt-1 text-sm font-semibold leading-snug">
              Tu información está respaldada y segura.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
});

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
          'flex w-full items-center gap-3 rounded-input px-3 py-2.5 text-sm font-semibold transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-navy-900',
          active
            ? 'bg-gold-50 text-gold-700 shadow-sm dark:bg-gold-500/15 dark:text-gold-300'
            : 'text-navy-700 hover:bg-slate-100 hover:translate-x-0.5 dark:text-navy-200 dark:hover:bg-navy-800',
        )}
      >
        <Icon
          className={clsx(
            'h-5 w-5 shrink-0 transition-colors',
            active ? 'text-gold-500' : 'text-neutral-400 group-hover:text-navy-600 dark:text-navy-300 dark:group-hover:text-navy-100',
          )}
          aria-hidden="true"
        />
        <span className="truncate">{item.label}</span>
        {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-gold-500" aria-hidden="true" />}
      </button>
    </li>
  );
}
