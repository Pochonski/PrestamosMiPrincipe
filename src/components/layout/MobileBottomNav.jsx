import clsx from 'clsx';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  HandCoins,
} from 'lucide-react';

const ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'clientes', label: 'Clientes', icon: Users },
  { id: 'registrar-pago', label: 'Registrar pago', icon: HandCoins, page: 'cobro' },
  { id: 'registrar-cliente', label: 'Registrar cliente', icon: UserPlus, page: 'clientes', params: { autoCreate: true } },
];

function getActiveId(page) {
  if (page === 'cliente-detalle') return 'clientes';
  if (page === 'prestamo-detalle') return 'registrar-pago';
  return page;
}

export function MobileBottomNav({ page, onNavigate }) {
  const activeId = getActiveId(page);
  return (
    <nav
      className={clsx(
        'fixed inset-x-0 bottom-0 z-30 border-t lg:hidden',
        'bg-white/95 backdrop-blur-md border-slate-200',
        'dark:bg-navy-900/95 dark:border-navy-700',
      )}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
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
                className={clsx(
                  'flex w-full flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 transition-colors',
                  active
                    ? 'text-gold-600 dark:text-gold-300'
                    : 'text-slate-500 hover:text-navy-700 dark:text-navy-300 dark:hover:text-white',
                )}
                aria-current={active ? 'page' : undefined}
              >
                <Icon
                  className={clsx('h-4 w-4 shrink-0', active && 'scale-110 transition-transform')}
                />
                <span
                  className="w-full truncate text-[10px] font-semibold leading-none"
                  title={item.label}
                >
                  {item.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}