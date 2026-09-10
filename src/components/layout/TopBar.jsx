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
        'sticky top-0 z-30 flex items-center gap-2 border-b backdrop-blur-xl backdrop-saturate-150 safe-top',
        'px-3 py-2.5 sm:gap-3 sm:px-5',
        'bg-white/60 border-white/50 shadow-glass supports-[backdrop-filter]:bg-white/60',
        'dark:bg-black/50 dark:border-white/10 dark:shadow-glass-dark dark:supports-[backdrop-filter]:bg-black/50',
      )}
    >
      <button
        type="button"
        onClick={onOpenSidebar}
        className={clsx(
          'flex h-11 w-11 items-center justify-center rounded-input border backdrop-blur-md lg:hidden',
          'border-white/50 bg-white/60 text-navy-700 hover:bg-white/80 hover:border-white/60',
          'dark:border-white/10 dark:bg-white/[0.06] dark:text-navy-100 dark:hover:bg-white/10 dark:hover:border-white/20',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black',
        )}
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      <Logo className="shrink-0 lg:hidden" size="sm" />

      <div className="min-w-0 flex-1">
        <p className="section-label hidden lg:block">Navegación</p>
        <h1 className="truncate font-display text-sm font-bold tracking-tight text-navy-900 sm:text-base lg:text-lg dark:text-white">
          {current.label}
        </h1>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
        <button
          type="button"
          onClick={() => onNavigate('notificaciones')}
          className={clsx(
            'relative flex h-11 w-11 items-center justify-center rounded-input border backdrop-blur-md transition-colors',
            'border-white/50 bg-white/60 text-navy-700 hover:bg-white/80 hover:border-white/60',
            'dark:border-white/10 dark:bg-white/[0.06] dark:text-navy-100 dark:hover:bg-white/10 dark:hover:border-white/20',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black',
          )}
          aria-label={`Notificaciones${notificationCount > 0 ? `, ${notificationCount} sin leer` : ''}`}
          title="Notificaciones"
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          {notificationCount > 0 && (
            <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-danger-500 px-1.5 text-[10px] font-bold text-white ring-2 ring-white dark:ring-black">
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
