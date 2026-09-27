import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/supabase', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getOrgId: vi.fn().mockResolvedValue('org-1'),
    supabase: {
      from: vi.fn(),
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
      rpc: vi.fn(),
    },
  };
});
vi.mock('../../lib/events', () => ({ emitDataChanged: vi.fn() }));

import * as cobrosService from '../cobros';
import { supabase } from '../../lib/supabase';

beforeEach(() => vi.clearAllMocks());

function mockGetById(data = { id: 'cob-id' }) {
  const maybeSingle = vi.fn().mockResolvedValue({ data, error: null });
  const chain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle };
  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  vi.mocked(supabase.from).mockReturnValue(chain);
}

describe('cobros.create fechaPago', () => {
  it('YYYY-MM-DD -> p_fecha ISO mediodía local', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: 'cob-id', error: null });
    mockGetById();
    await cobrosService.create({ prestamoId: 'p1', cuotaNumero: 1, monto: 500, tipo: 'interes', fechaPago: '2026-09-10' });
    const args = vi.mocked(supabase.rpc).mock.calls[0][1];
    expect(args.p_fecha).toBe(new Date(2026, 8, 10, 12, 0, 0, 0).toISOString());
  });
  it('sin fechaPago -> p_fecha null', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: 'cob-id', error: null });
    mockGetById();
    await cobrosService.create({ prestamoId: 'p1', cuotaNumero: 1, monto: 500, tipo: 'interes' });
    expect(vi.mocked(supabase.rpc).mock.calls[0][1].p_fecha).toBeNull();
  });
  it('Date -> p_fecha ISO', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: 'cob-id', error: null });
    mockGetById();
    const d = new Date(2026, 8, 5, 8, 30);
    await cobrosService.create({ prestamoId: 'p1', cuotaNumero: 1, monto: 500, tipo: 'interes', fechaPago: d });
    expect(vi.mocked(supabase.rpc).mock.calls[0][1].p_fecha).toBe(d.toISOString());
  });
  it('fecha futura del servidor -> mensaje claro', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: 'fecha futura no permitida' } });
    await expect(
      cobrosService.create({ prestamoId: 'p1', cuotaNumero: 1, monto: 500, tipo: 'interes', fechaPago: '2026-09-10' }),
    ).rejects.toThrow('no puede ser futura');
  });
});

describe('cobros.updateLast fechaPago', () => {
  it('pasa p_fecha al RPC', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: 'cob-id', error: null });
    mockGetById();
    await cobrosService.updateLast('cob-id', { cuotaNumero: 1, monto: 500, tipo: 'interes', fechaPago: '2026-09-08' });
    const args = vi.mocked(supabase.rpc).mock.calls[0][1];
    expect(args.p_fecha).toBe(new Date(2026, 8, 8, 12, 0, 0, 0).toISOString());
  });
  it('fecha futura -> mensaje claro', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: 'fecha futura no permitida' } });
    await expect(
      cobrosService.updateLast('cob-id', { cuotaNumero: 1, monto: 500, tipo: 'interes', fechaPago: '2026-09-08' }),
    ).rejects.toThrow('no puede ser futura');
  });
});

describe('cobros.delDia con fecha', () => {
  it('filtra el día pasado indicado', async () => {
    const chain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), gte: vi.fn().mockReturnThis(), lte: vi.fn().mockReturnThis() };
    chain.select.mockReturnValue(chain);
    chain.eq.mockReturnValue(chain);
    chain.gte.mockReturnValue(chain);
    chain.lte.mockResolvedValue({ data: [], error: null });
    vi.mocked(supabase.from).mockReturnValue(chain);
    await cobrosService.delDia('2026-09-10');
    expect(chain.gte).toHaveBeenCalledWith('fecha', new Date(2026, 8, 10, 0, 0, 0, 0).toISOString());
    expect(chain.lte).toHaveBeenCalledWith('fecha', new Date(2026, 8, 10, 23, 59, 59, 999).toISOString());
  });
});
