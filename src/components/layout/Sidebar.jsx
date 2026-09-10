import React from 'react';
import { memo } from 'react';
import clsx from 'clsx';
import { X } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { Avatar } from '../ui/Avatar';
import { NAV_ITEMS, findItemById } from './nav-config';

const PREFETCH_MAP = {
  resumen: () => import('../../features/resumen'),
  'cobrar-hoy': () => import('../../features/cobrar-hoy'),
  prestamos: () => import('../../features/prestamos-lista'),
  atrasados: () => import('../../features/atrasados'),
  clientes: () => import('../../features/clientes'),
  notificaciones: () => import('../../features/notificaciones'),
  exportar: () => import('../../features/exportar'),
  respaldar: () => import('../../features/respaldo'),
  'registrar-prestamo': () => import('../../features/prestamos'),
  cobro: () => import('../../features/cobros'),
  settings: () => import('../../features/organizations/pages/SettingsPage'),
};

export const Sidebar = memo(function Sidebar({ open, page, onNavigate, onClose, orgName, userName, rol }) {
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
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-md transition-opacity duration-200 lg:hidden animate-fade-in"
        />
      )}

      <aside
        className={clsx(
          'glass fixed inset-y-0 left-0 z-50 flex flex-col rounded-r-modal',
          'transition-transform duration-300 ease-out',
          'w-[var(--sidebar-w)] lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Highlight vertical en el borde derecho */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-white/70 via-white/10 to-transparent dark:from-white/25 dark:via-white/[0.06] dark:to-transparent"
        />
        <div className="border-b border-white/50 px-5 pb-4 pt-5 dark:border-white/10">
          <div className="flex items-center justify-between gap-2">
            <Logo />
            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-input text-neutral-500 hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-navy-300 dark:hover:bg-white/10 lg:hidden"
              aria-label="Cerrar menú"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          {(orgName || rol) && (
            <div className="glass-subtle mt-3 flex items-center gap-2.5 rounded-input px-3 py-2">
              <Avatar nombre={orgName || userName || 'O'} size="sm" />
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-xs font-bold text-navy-900 dark:text-white">
                  {orgName || 'Mi organización'}
                </p>
                {rol && <p className="label-micro mt-0.5">{rol}</p>}
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
          <p className="label-micro px-3 pb-2">Principal</p>
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

          <p className="label-micro mt-8 px-3 pb-2">Acciones</p>
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

        {(userName || rol) && (
          <div className="border-t border-white/50 px-5 py-3 dark:border-white/10">
            <div className="flex items-center gap-2.5">
              <Avatar nombre={userName || '?'} size="sm" />
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-xs font-bold text-navy-900 dark:text-white">
                  {userName || 'Usuario'}
                </p>
                <p className="truncate text-[10px] font-medium text-neutral-500 dark:text-navy-300">
                  Préstamos Mi Príncipe · v1.0.0
                </p>
              </div>
            </div>
          </div>
        )}
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
          'flex min-h-[48px] w-full items-center gap-3 rounded-input border border-transparent px-3 py-3 font-display text-sm font-semibold transition-all duration-150 relative glass-glare',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black',
          active
            ? 'border-gold-400/50 bg-gold-50/70 shadow-sm backdrop-blur-md dark:border-gold-500/30 dark:bg-gold-500/15 dark:text-gold-300'
            : 'text-navy-700 hover:bg-white/70 dark:text-navy-200 dark:hover:bg-white/10',
        )}
      >
        {active && (
          <span
            aria-hidden="true"
            className="absolute left-1 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-gold-gradient shadow-glow"
          />
        )}
        <span
          aria-hidden="true"
          className={clsx(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-input transition-colors',
            active
              ? 'bg-gold-gradient text-navy-900 shadow-glow'
              : 'bg-white/50 text-neutral-400 backdrop-blur-md dark:bg-white/10 dark:text-navy-300',
          )}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="truncate">{item.label}</span>
      </button>
    </li>
  );
}
