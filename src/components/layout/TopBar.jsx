import React from 'react';
import { memo } from 'react';
import clsx from 'clsx';
import { Bell, Menu } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { UserMenu } from './UserMenu';
import { ThemeToggle } from '../ui/ThemeToggle';
import { findItemById, NAV_ITEMS } from './nav-config';

export const TopBar = memo(function TopBar({ page, onNavigate, onOpenSidebar, theme, onToggleTheme, notificationCount }) {
  const current = findItemById(page) || NAV_ITEMS[0];

  return (
    <header
      className={clsx(
        'sticky top-0 z-30 flex items-center gap-2 border-b backdrop-blur-md safe-top',
        'px-3 py-2.5 sm:gap-3 sm:px-5',
        'bg-white/80 border-slate-200/70 supports-[backdrop-filter]:bg-white/70',
        'dark:bg-navy-900/80 dark:border-navy-700/70 dark:supports-[backdrop-filter]:bg-navy-900/70',
      )}
    >
      <button
        type="button"
        onClick={onOpenSidebar}
        className={clsx(
          'flex h-10 w-10 items-center justify-center rounded-input border lg:hidden',
          'border-slate-200 bg-white text-navy-700 hover:bg-slate-50 hover:border-gold-300',
          'dark:border-navy-700 dark:bg-navy-800 dark:text-navy-100 dark:hover:bg-navy-700 dark:hover:border-gold-400',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-navy-900',
        )}
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      <Logo className="lg:hidden" size="sm" />

      <div className="hidden min-w-0 flex-1 lg:block">
        <p className="section-label">Navegación</p>
        <h1 className="truncate text-lg font-extrabold tracking-tight text-navy-900 dark:text-white">
          {current.label}
        </h1>
      </div>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={() => onNavigate('notificaciones')}
          className={clsx(
            'relative flex h-10 w-10 items-center justify-center rounded-input border transition-colors',
            'border-slate-200 bg-white text-navy-700 hover:bg-slate-50 hover:border-gold-300',
            'dark:border-navy-700 dark:bg-navy-800 dark:text-navy-100 dark:hover:bg-navy-700 dark:hover:border-gold-400',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-navy-900',
          )}
          aria-label={`Notificaciones${notificationCount > 0 ? `, ${notificationCount} sin leer` : ''}`}
          title="Notificaciones"
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          {notificationCount > 0 && (
            <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-danger-500 px-1.5 text-[10px] font-bold text-white ring-2 ring-white dark:ring-navy-900">
              {notificationCount > 99 ? '99+' : notificationCount}
            </span>
          )}
        </button>

        <ThemeToggle theme={theme} onToggle={onToggleTheme} />

        <UserMenu />
      </div>
    </header>
  );
});
