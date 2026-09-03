import { describe, it, expect, vi } from 'vitest';
import { emitDataChanged, onDataChanged } from '../events';

describe('events', () => {
  it('onDataChanged suscribe y emit dispara handler', () => {
    const fn = vi.fn();
    const unsub = onDataChanged(fn);
    emitDataChanged();
    expect(fn).toHaveBeenCalledTimes(1);
    unsub();
  });
  it('unsubscribe deja de llamar', () => {
    const fn = vi.fn();
    const unsub = onDataChanged(fn);
    unsub();
    emitDataChanged();
    expect(fn).not.toHaveBeenCalled();
  });
  it('múltiples listeners', () => {
    const a = vi.fn(), b = vi.fn();
    const ua = onDataChanged(a), ub = onDataChanged(b);
    emitDataChanged();
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
    ua(); ub();
  });
});
