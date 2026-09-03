import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// jsdom no tiene matchMedia por defecto
if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

// Mock localStorage si no existe (jsdom ya lo tiene, pero por si acaso)
if (!window.localStorage) {
  const store = new Map();
  window.localStorage = {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
    length: 0,
    key: () => null,
  };
}

// Silenciar console.error de Supabase en tests salvo que se testee throwIfError
const origError = console.error;
vi.spyOn(console, 'error').mockImplementation((...args) => {
  const msg = String(args[0] ?? '');
  if (msg.includes('[supabase:')) return;
  origError(...args);
});

// TZ fija para tests deterministas (no podemos setear TZ real, pero documentamos)
process.env.TZ = 'America/Costa_Rica';
