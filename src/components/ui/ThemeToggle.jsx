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
        'relative inline-flex h-10 w-10 items-center justify-center rounded-input border transition-colors',
        'border-slate-200 bg-white text-navy-700',
        'hover:bg-slate-50 hover:border-gold-300',
        'dark:border-navy-700 dark:bg-navy-800 dark:text-navy-100 dark:hover:bg-navy-700 dark:hover:border-gold-400',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-navy-900',
        className,
      )}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={isDark ? 'Modo claro' : 'Modo oscuro'}
    >
      {isDark ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
    </button>
  );
}
