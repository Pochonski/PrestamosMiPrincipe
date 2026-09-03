import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDataChange } from '../useDataChange';
import { emitDataChanged } from '../../events';

describe('useDataChange', () => {
  it('llama handler en emit', async () => {
    const fn = vi.fn();
    renderHook(() => useDataChange(fn));
    emitDataChanged();
    // espera microtask
    await new Promise(r => setTimeout(r, 10));
    expect(fn).toHaveBeenCalledTimes(1);
  });
  it('usa ref actualizada', async () => {
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    const { rerender } = renderHook(({ h }) => useDataChange(h), { initialProps: { h: fn1 } });
    rerender({ h: fn2 });
    emitDataChanged();
    await new Promise(r => setTimeout(r, 10));
    expect(fn2).toHaveBeenCalled();
    expect(fn1).not.toHaveBeenCalled();
  });
});
