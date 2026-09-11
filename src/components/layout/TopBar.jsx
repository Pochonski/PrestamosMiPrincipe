import React from 'react';
import { memo } from 'react';
import clsx from 'clsx';
import { Bell, Menu } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { IconBox } from '../ui/IconBox';
import { UserMenu } from './UserMenu';
import { ThemeToggle } from '../ui/ThemeToggle';
import { findItemById, NAV_ITEMS } from './nav-config';

export const TopBar = memo(function TopBar({ page, onNavigate, onOpenSidebar, theme, onToggleTheme, notificationCount }) {
  const current = findItemById(page) || NAV_ITEMS[0];
  const SectionIcon = current.icon;

  return (
    <header
      className={clsx(
        'sticky top-3 z-30 mx-3 flex items-center gap-3 rounded-card backdrop-blur-xl backdrop-saturate-150 safe-top',
        'border px-3 py-3 sm:mx-5 sm:gap-4 sm:px-5 sm:py-3.5 lg:mx-0',
        'bg-cream-glass/65 border-cream-sand/70 shadow-glass supports-[backdrop-filter]:bg-cream-glass/65',
        'dark:bg-black/50 dark:border-white/10 dark:shadow-glass-dark dark:supports-[backdrop-filter]:bg-black/50',
      )}
    >
      <button
        type="button"
        onClick={onOpenSidebar}
        className={clsx(
          'glass-subtle glass-glare flex h-11 w-11 shrink-0 items-center justify-center rounded-full lg:hidden',
          'text-navy-700 hover:bg-white/80',
          'dark:text-navy-100 dark:hover:bg-white/10',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black',
        )}
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      <Logo className="shrink-0 lg:hidden" size="sm" />

      <div className="flex min-w-0 flex-1 items-center gap-3">
        {SectionIcon && (
          <span className="hidden sm:flex">
            <IconBox icon={SectionIcon} tone="gold" size="sm" ring />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="section-label hidden lg:block">Navegación</p>
          <h1 className="truncate font-display text-sm font-bold tracking-tight text-navy-900 sm:text-base lg:text-lg dark:text-white">
            {current.label}
          </h1>
        </div>
      </div>

      <div aria-hidden="true" className="h-8 w-px shrink-0 bg-navy-900/10 dark:bg-white/10" />

      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-2.5">
        <button
          type="button"
          onClick={() => onNavigate('notificaciones')}
          className={clsx(
            'glass-subtle glass-glare relative flex h-11 w-11 items-center justify-center rounded-full transition-colors',
            'text-navy-700 hover:bg-white/80',
            'dark:text-navy-100 dark:hover:bg-white/10',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black',
          )}
          aria-label={`Notificaciones${notificationCount > 0 ? `, ${notificationCount} sin leer` : ''}`}
          title="Notificaciones"
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          {notificationCount > 0 && (
            <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-danger-500 px-1.5 text-[10px] font-bold text-white shadow-glow ring-2 ring-cream-glass dark:ring-black">
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
