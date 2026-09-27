import { describe, it, expect, vi, afterEach } from 'vitest';
import { emitDataChanged, onDataChanged } from '../events';

afterEach(() => {
  vi.restoreAllMocks();
  try {
    delete globalThis.__pmpQueryClientRef;
  } catch {
    globalThis.__pmpQueryClientRef = undefined;
  }
});

describe('events queryClient registry', () => {
  it('emitDataChanged invalida via ref interna sin exponer window', () => {
    const invalidateQueries = vi.fn();
    globalThis.__pmpQueryClientRef = { current: { invalidateQueries } };
    const dispatch = vi.spyOn(window, 'dispatchEvent').mockImplementation(() => true);
    emitDataChanged('clientes');
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['clientes'] });
    expect(dispatch).toHaveBeenCalled();
    expect(window.__pmpQueryClient).toBeUndefined();
  });
  it('emitDataChanged sin cliente solo despacha evento', () => {
    const dispatch = vi.spyOn(window, 'dispatchEvent').mockImplementation(() => true);
    emitDataChanged('cobros');
    expect(dispatch).toHaveBeenCalled();
  });
  it('fallback legacy a window.__pmpQueryClient (dev)', () => {
    const invalidateQueries = vi.fn();
    window.__pmpQueryClient = { invalidateQueries };
    const dispatch = vi.spyOn(window, 'dispatchEvent').mockImplementation(() => true);
    emitDataChanged('notificaciones');
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['notificaciones'] });
    delete window.__pmpQueryClient;
  });
  it('onDataChanged recibe la tabla y se desuscribe', () => {
    const seen = [];
    const off = onDataChanged((t) => seen.push(t));
    emitDataChanged('prestamos');
    expect(seen).toEqual(['prestamos']);
    off();
    emitDataChanged('prestamos');
    expect(seen).toEqual(['prestamos']);
  });
});
