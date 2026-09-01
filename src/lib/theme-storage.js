const KEY = 'pmp:theme';

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw || 'light';
  } catch {
    return 'light';
  }
}

function write(value) {
  try {
    localStorage.setItem(KEY, value);
  } catch {
    // ignore
  }
}

export function getTheme() {
  return read();
}

export function setTheme(theme) {
  write(theme);
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