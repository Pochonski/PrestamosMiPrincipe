import { useEffect, useState } from 'react';
import { Bell, Menu } from 'lucide-react';
import clsx from 'clsx';
import { Logo } from '../ui/Logo';
import { UserMenu } from './UserMenu';
import { ThemeToggle } from '../ui/ThemeToggle';
import { NAV_ITEMS } from './navItems';

export function TopBar({ page, onNavigate, onOpenSidebar, theme, onToggleTheme, notificationCount }) {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const current = NAV_ITEMS.find((n) => n.id === page) || NAV_ITEMS[0];

  return (
    <header
      className={clsx(
        'sticky top-0 z-30 flex items-center gap-2 border-b px-3 py-2.5 sm:gap-3 sm:px-5',
        'bg-white/80 backdrop-blur-md border-slate-200/80',
        'dark:bg-navy-900/80 dark:border-navy-700/80',
      )}
    >
      <button
        type="button"
        onClick={onOpenSidebar}
        className={clsx(
          'flex h-10 w-10 items-center justify-center rounded-xl lg:hidden',
          'border border-slate-200 text-navy-700 hover:bg-slate-50',
          'dark:border-navy-700 dark:text-navy-100 dark:hover:bg-navy-800',
        )}
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" />
      </button>

      <Logo className="lg:hidden" />

      <div className="hidden min-w-0 flex-1 lg:block">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-navy-300">
          {isDesktop ? 'Navegación' : ''}
        </p>
        <h1 className="truncate text-base font-bold text-navy-900 dark:text-white">
          {current.label}
        </h1>
      </div>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={() => onNavigate('notificaciones')}
          className={clsx(
            'relative flex h-10 w-10 items-center justify-center rounded-xl',
            'border border-slate-200 text-navy-700 hover:bg-slate-50 hover:border-gold-300',
            'dark:border-navy-700 dark:text-navy-100 dark:hover:bg-navy-800 dark:hover:border-gold-400',
          )}
          aria-label="Notificaciones"
          title="Notificaciones"
        >
          <Bell className="h-5 w-5" />
          {notificationCount > 0 && (
            <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white ring-2 ring-white dark:ring-navy-900">
              {notificationCount}
            </span>
          )}
        </button>

        <ThemeToggle theme={theme} onToggle={onToggleTheme} />

        <UserMenu />
      </div>
    </header>
  );
}