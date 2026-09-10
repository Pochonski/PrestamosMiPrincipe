import React from 'react';
import { memo } from 'react';
import clsx from 'clsx';
import {
  LayoutDashboard,
  Users,
  Wallet,
  AlertTriangle,
  PlusCircle,
} from 'lucide-react';
import { findItemById } from './nav-config';

const ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, page: 'dashboard' },
  { id: 'clientes', label: 'Clientes', icon: Users, page: 'clientes' },
  { id: 'prestamos', label: 'Préstamos', icon: Wallet, page: 'prestamos' },
  { id: 'atrasados', label: 'Atrasados', icon: AlertTriangle, page: 'atrasados' },
  {
    id: 'registrar-prestamo',
    label: 'Registrar préstamo',
    icon: PlusCircle,
    page: 'registrar-prestamo',
  },
];

function getActiveId(page) {
  if (page === 'registrar-prestamo') return 'registrar-prestamo';
  if (page === 'cliente-detalle') return 'clientes';
  if (page === 'prestamo-detalle') return 'prestamos';
  const current = findItemById(page);
  const parentId = current?.parent ?? current?.id;
  return parentId;
}

export const MobileBottomNav = memo(function MobileBottomNav({ page, onNavigate }) {
  const activeId = getActiveId(page);
  return (
    <nav
      className={clsx(
        'glass fixed inset-x-0 bottom-0 z-30 safe-bottom lg:hidden',
      )}
      aria-label="Navegación principal"
    >
      <ul className="mx-auto flex max-w-2xl items-stretch justify-around px-1 py-1.5">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeId === item.id;
          return (
            <li key={item.id} className="flex-1 min-w-0">
              <button
                type="button"
                onClick={() => onNavigate(item.page, item.params || {})}
                aria-current={active ? 'page' : undefined}
                className={clsx(
                  'flex w-full flex-col items-center justify-center gap-0.5 rounded-input px-1 py-1.5 transition-all duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black',
                  active
                    ? 'text-gold-600 dark:text-gold-300'
                    : 'text-neutral-500 hover:text-navy-700 dark:text-navy-300 dark:hover:text-white',
                )}
              >
                <Icon
                  className={clsx('h-5 w-5 shrink-0', active && 'scale-110')}
                  aria-hidden="true"
                />
                <span
                  className="w-full truncate px-0.5 text-[10px] font-bold leading-none"
                  title={item.label}
                >
                  {item.label}
                </span>
                {active && <span className="h-0.5 w-5 rounded-full bg-gold-500" aria-hidden="true" />}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
});
