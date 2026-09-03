import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAsyncResource, useTickOnDataChange } from '../useAsyncResource';
import { emitDataChanged } from '../../events';

describe('useTickOnDataChange', () => {
  it('incrementa en emit', async () => {
    const { result } = renderHook(() => useTickOnDataChange());
    const before = result.current;
    act(() => emitDataChanged());
    await waitFor(() => expect(result.current).toBe(before + 1));
  });
});

describe('useAsyncResource', () => {
  it('carga data', async () => {
    const fetcher = vi.fn().mockResolvedValue('hello');
    const { result } = renderHook(() => useAsyncResource(fetcher));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBe('hello');
  });
  it('reload re-ejecuta fetcher', async () => {
    const fetcher = vi.fn().mockResolvedValue(1);
    const { result } = renderHook(() => useAsyncResource(fetcher));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetcher).toHaveBeenCalledTimes(1);
    act(() => result.current.reload());
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
  });
  it('emitDataChanged recarga', async () => {
    const fetcher = vi.fn().mockResolvedValue('x');
    renderHook(() => useAsyncResource(fetcher));
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
    act(() => emitDataChanged());
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
  });
  it('fetcher reject -> data null loading false', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useAsyncResource(fetcher));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBeNull();
  });
});
