import { get, set, STORAGE_KEYS } from './storage';

export function getTheme() {
  return get(STORAGE_KEYS.theme, 'light');
}

export function setTheme(theme) {
  set(STORAGE_KEYS.theme, theme);
  applyTheme(theme);
  return theme;
}

export function toggleTheme() {
  const next = getTheme() === 'dark' ? 'light' : 'dark';
  return setTheme(next);
}

export function applyTheme(theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
}