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

import * as clientesService from '../clientes';
import { supabase } from '../../lib/supabase';

beforeEach(() => vi.clearAllMocks());

describe('clientes count', () => {
  it('retorna count', async () => {
    const chain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() };
    chain.select.mockReturnValue(chain); chain.eq.mockReturnValue(chain);
    chain.then = (res) => Promise.resolve({ data: null, error: null, count: 5 }).then(res);
    // Para count, supabase.from().select({count,head}).eq -> then con count
    vi.mocked(supabase.from).mockReturnValue(chain);
    // Mock count implementation: need to handle head true
    const originalCount = clientesService.count;
    // Como mock chain.then retorna object con count, count() debería usar ese
    // Simulamos chain con then que resuelve count
    const countChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    };
    countChain.select.mockReturnValue(countChain);
    countChain.eq.mockReturnValue({ error: null, count: 7, then: (r) => Promise.resolve({ count: 7, error: null }).then(r) });
    vi.mocked(supabase.from).mockReturnValue(countChain);
    const r = await clientesService.count();
    expect(r).toBe(7);
  });
});

describe('clientes update', () => {
  it('update emite', async () => {
    const data = { id: 'c1', nombre: 'Ana' };
    const chain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), update: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data, error: null }) };
    chain.select.mockReturnValue(chain); chain.eq.mockReturnValue(chain); chain.update.mockReturnValue(chain);
    vi.mocked(supabase.from).mockReturnValue(chain);
    const r = await clientesService.update('c1', { nombre: '  Ana  ' });
    expect(r.nombre).toBe('Ana');
  });
});

describe('prestamosDelCliente y tiene', () => {
  it('prestamosActivos filtra', async () => {
    const data = [{ estado: 'vigente' }, { estado: 'cancelado' }, { estado: 'atrasado' }];
    const chain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() };
    chain.select.mockReturnValue(chain); chain.eq.mockReturnValue(chain);
    chain.then = (res) => Promise.resolve({ data, error: null }).then(res);
    vi.mocked(supabase.from).mockReturnValue(chain);
    const r = await clientesService.prestamosActivosDelCliente('c1');
    expect(r).toHaveLength(2);
    // segunda llamada para tienePrestamosActivos
    vi.mocked(supabase.from).mockReturnValue(chain);
    expect(await clientesService.tienePrestamosActivos('c1')).toBe(true);
  });
});
