import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/supabase', () => ({
  supabase: { rpc: vi.fn() },
}));

import * as carteraHistory from '../carteraHistory';
import { supabase } from '../../lib/supabase';

beforeEach(() => vi.clearAllMocks());

describe('carteraHistory', () => {
  it('snapshot devuelve data', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: { cartera_total: 100 }, error: null });
    const r = await carteraHistory.snapshot();
    expect(r).toEqual({ cartera_total: 100 });
    expect(supabase.rpc).toHaveBeenCalledWith('snapshot_cartera');
  });

  it('snapshot relanza error', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: 'boom' } });
    await expect(carteraHistory.snapshot()).rejects.toThrow('boom');
  });

  it('history devuelve array', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: [{ fecha: '2026-09-07' }], error: null });
    const r = await carteraHistory.history(35);
    expect(r).toHaveLength(1);
    expect(supabase.rpc).toHaveBeenCalledWith('list_cartera_history', { p_days: 35 });
  });

  it('history con data null -> []', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null });
    expect(await carteraHistory.history()).toEqual([]);
  });

  it('history relanza error', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: 'x' } });
    await expect(carteraHistory.history()).rejects.toThrow('x');
  });
});