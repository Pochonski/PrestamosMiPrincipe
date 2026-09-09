import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { toggleTheme } from '../../services/theme';
import clsx from 'clsx';

export function ThemeToggle({ theme, onToggle, className }) {
  const isDark = theme === 'dark';
  function handle() {
    const next = isDark ? 'light' : 'dark';
    if (onToggle) onToggle(next);
    else toggleTheme();
  }
  return (
    <button
      type="button"
      onClick={handle}
      className={clsx(
        'relative inline-flex h-11 w-11 items-center justify-center rounded-input border transition-colors',
        'border-white/50 bg-white/60 backdrop-blur-md text-navy-700',
        'hover:bg-white/80 hover:border-white/60',
        'dark:border-white/10 dark:bg-white/[0.06] dark:text-navy-100 dark:hover:bg-white/10 dark:hover:border-white/20',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black',
        className,
      )}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={isDark ? 'Modo claro' : 'Modo oscuro'}
    >
      {isDark ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
    </button>
  );
}
