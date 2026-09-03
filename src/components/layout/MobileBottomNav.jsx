import React from 'react';
import { memo } from 'react';
import clsx from 'clsx';
import { NAV_ITEMS, MOBILE_EXTRA_ITEMS, findItemById } from './nav-config';

const TOP_ITEMS = NAV_ITEMS.filter((n) => n.mobile).filter((n) => n.id === 'dashboard' || n.id === 'clientes');

const ITEMS = [...TOP_ITEMS, ...MOBILE_EXTRA_ITEMS];

function getActiveId(page) {
  const current = findItemById(page);
  const parentId = current?.parent ?? current?.id;
  if (page === 'cobro') return 'registrar-pago';
  if (page === 'cliente-detalle' || page === 'registrar-prestamo') return 'clientes';
  return parentId;
}

export const MobileBottomNav = memo(function MobileBottomNav({ page, onNavigate }) {
  const activeId = getActiveId(page);
  return (
    <nav
      className={clsx(
        'fixed inset-x-0 bottom-0 z-30 border-t backdrop-blur-md safe-bottom lg:hidden',
        'bg-white/90 border-slate-200 supports-[backdrop-filter]:bg-white/80',
        'dark:bg-navy-900/90 dark:border-navy-700 dark:supports-[backdrop-filter]:bg-navy-900/80',
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
                onClick={() => onNavigate(item.page || item.id, item.params || {})}
                aria-current={active ? 'page' : undefined}
                className={clsx(
                  'flex w-full flex-col items-center justify-center gap-0.5 rounded-input px-1 py-1.5 transition-all duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-navy-900',
                  active
                    ? 'text-gold-600 dark:text-gold-300'
                    : 'text-neutral-500 hover:text-navy-700 dark:text-navy-300 dark:hover:text-white',
                )}
              >
                <Icon className={clsx('h-5 w-5 shrink-0', active && 'scale-110')} aria-hidden="true" />
                <span className="w-full truncate text-[10px] font-bold leading-none" title={item.label}>
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
