import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { toggleTheme } from '../../services/theme';
import clsx from 'clsx';

export function ThemeToggle({ theme, onToggle, className }) {
  const isDark = theme === 'dark';
  const Icon = isDark ? Sun : Moon;
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
        'glass-subtle relative inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors',
        'text-navy-700 hover:bg-white/80',
        'dark:text-glow-gold dark:hover:bg-white/10',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black',
        className,
      )}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      aria-live="polite"
      title={isDark ? 'Modo claro' : 'Modo oscuro'}
    >
      <Icon
        key={theme}
        className="h-5 w-5 animate-spin-once"
        aria-hidden="true"
      />
    </button>
  );
}
