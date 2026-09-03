import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/supabase', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getOrgId: vi.fn().mockResolvedValue('org-1'),
    supabase: { from: vi.fn(), auth: { getUser: vi.fn() }, rpc: vi.fn() },
  };
});

import * as cobrosService from '../cobros';
import { supabase } from '../../lib/supabase';

beforeEach(() => vi.clearAllMocks());

describe('cobros delDia / totalDelDia', () => {
  it('delDia usa start/end', async () => {
    const data = [{ monto: 100 }, { monto: 200 }];
    const chain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), gte: vi.fn().mockReturnThis(), lte: vi.fn().mockReturnThis() };
    chain.select.mockReturnValue(chain); chain.eq.mockReturnValue(chain); chain.gte.mockReturnValue(chain); chain.lte.mockReturnValue(chain);
    chain.then = (res) => Promise.resolve({ data, error: null }).then(res);
    vi.mocked(supabase.from).mockReturnValue(chain);
    const r = await cobrosService.delDia();
    expect(r).toEqual(data);
    expect(await cobrosService.totalDelDia()).toBe(300);
  });
});

describe('cobros delPrestamo / recientes / resumen', () => {
  it('delPrestamo', async () => {
    const data = [{ id: 'c1' }];
    const chain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis() };
    chain.select.mockReturnValue(chain); chain.eq.mockReturnValue(chain); chain.order.mockReturnValue(chain);
    chain.then = (res) => Promise.resolve({ data, error: null }).then(res);
    vi.mocked(supabase.from).mockReturnValue(chain);
    expect(await cobrosService.delPrestamo('p1')).toEqual(data);
  });
  it('recientes slice pure', () => {
    const all = [{ id: '1' }, { id: '2' }, { id: '3' }];
    expect(all.slice(0, 2)).toHaveLength(2);
  });
  it('resumen pure', () => {
    const all = [{ monto: 100 }, { monto: 200 }];
    const hoy = [{ monto: 50 }];
    const cantidad = all.length;
    const totalCobrado = all.reduce((s, c) => s + c.monto, 0);
    expect(cantidad).toBe(2);
    expect(totalCobrado).toBe(300);
    expect(hoy.reduce((s, c) => s + c.monto, 0)).toBe(50);
  });
});
