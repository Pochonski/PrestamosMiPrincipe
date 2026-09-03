import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/supabase', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getOrgId: vi.fn().mockResolvedValue('org-1'),
    supabase: {
      from: vi.fn(),
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }), getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'u1' } } } }) },
      rpc: vi.fn(),
    },
  };
});
vi.mock('../../lib/events', () => ({ emitDataChanged: vi.fn() }));

import * as prestamosService from '../prestamos';
import { supabase } from '../../lib/supabase';

beforeEach(() => vi.clearAllMocks());

describe('prestamos.remove bloquea con cobros', () => {
  it('lanza si tiene cobros', async () => {
    const prestamo = { id: 'p1', n_cuotas: 10 };
    const loadSingle = vi.fn().mockResolvedValue({ data: prestamo, error: null });
    const loadChain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: loadSingle };
    loadChain.eq.mockReturnValue(loadChain); loadChain.select.mockReturnValue(loadChain);
    const cobrosChain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() };
    cobrosChain.then = (res) => Promise.resolve({ data: [{ id: 'c1' }], error: null }).then(res);
    cobrosChain.select.mockReturnValue(cobrosChain); cobrosChain.eq.mockReturnValue(cobrosChain);
    vi.mocked(supabase.from).mockImplementation((table) => {
      if (table === 'prestamos') return loadChain;
      if (table === 'cobros') return cobrosChain;
      return loadChain;
    });
    await expect(prestamosService.remove('p1')).rejects.toThrow('No se puede eliminar');
  });
});

describe('prestamos.create', () => {
  it('usa RPC y luego getById', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: 'new-id', error: null });
    const prestamoData = { id: 'new-id', cliente_id: 'cli-1', org_id: 'org-1', monto: 10000, saldo_capital: 10000, tasa: 10, n_cuotas: 5, periodo: { tipo: 'quincenal' } };
    const maybeSingle = vi.fn().mockResolvedValue({ data: prestamoData, error: null });
    const cuotasChain = { select: vi.fn().mockReturnThis(), in: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), range: vi.fn().mockReturnThis() };
    cuotasChain.then = (res) => Promise.resolve({ data: [], error: null }).then(res);
    cuotasChain.select.mockReturnValue(cuotasChain); cuotasChain.in.mockReturnValue(cuotasChain); cuotasChain.order.mockReturnValue(cuotasChain);
    cuotasChain.range = cuotasChain.range || require("vitest").vi.fn().mockReturnThis();
    cuotasChain.range.mockReturnValue(cuotasChain);
    const prestamoChain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle };
    prestamoChain.select.mockReturnValue(prestamoChain); prestamoChain.eq.mockReturnValue(prestamoChain);
    vi.mocked(supabase.from).mockImplementation((t) => t === 'cuotas' ? cuotasChain : prestamoChain);
    const r = await prestamosService.create({ clienteId: 'cli-1', ruta: 'Ruta', periodo: { tipo: 'quincenal' }, monto: 10000, tasa: 10, nCuotas: 5, fechaInicio: '2024-01-15' });
    expect(vi.mocked(supabase.rpc)).toHaveBeenCalledWith('create_prestamo_with_cuotas', expect.objectContaining({ p_cliente_id: 'cli-1' }));
    expect(r.id).toBe('new-id');
  });
  it('lanza si error RPC', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: 'fail' } });
    await expect(prestamosService.create({ clienteId: 'cli-1', ruta: 'R', periodo: { tipo: 'diario' }, monto: 1000, tasa: 10, nCuotas: 1, fechaInicio: '2024-01-01' })).rejects.toThrow();
  });
});

describe('prestamos.extenderCuotas', () => {
  it('PrestamoNoEncontradoError si no existe', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const chain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle };
    chain.select.mockReturnValue(chain); chain.eq.mockReturnValue(chain);
    const cuotasChain = { select: vi.fn().mockReturnThis(), in: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), range: vi.fn().mockReturnThis() };
    cuotasChain.then = (res) => Promise.resolve({ data: [], error: null }).then(res);
    vi.mocked(supabase.from).mockImplementation((t) => t === 'cuotas' ? cuotasChain : chain);
    await expect(prestamosService.extenderCuotas('nope', 2)).rejects.toHaveProperty('name', 'PrestamoNoEncontradoError');
  });
  it('extiende cuotas ok', async () => {
    const prestamo = { id: 'p1', n_cuotas: 5, tasa: 10, saldo_capital: 10000, periodo: { tipo: 'quincenal' }, cuotas: [{ fecha: '2024-01-15' }], org_id: 'org-1' };
    const maybeSingle = vi.fn().mockResolvedValue({ data: prestamo, error: null });
    const getChain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle };
    getChain.select.mockReturnValue(getChain); getChain.eq.mockReturnValue(getChain);
    const cuotasChain = { select: vi.fn().mockReturnThis(), in: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), range: vi.fn().mockReturnThis() };
    cuotasChain.then = (res) => Promise.resolve({ data: [], error: null }).then(res);
    cuotasChain.select.mockReturnValue(cuotasChain); cuotasChain.in.mockReturnValue(cuotasChain); cuotasChain.order.mockReturnValue(cuotasChain);
    cuotasChain.range = cuotasChain.range || require("vitest").vi.fn().mockReturnThis();
    cuotasChain.range.mockReturnValue(cuotasChain);
    let getCall = 0;
    vi.mocked(supabase.from).mockImplementation((t) => {
      if (t === 'cuotas') return cuotasChain;
      const c = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockImplementation(() => { getCall++; return Promise.resolve({ data: prestamo, error: null }); }), single: vi.fn().mockResolvedValue({ data: prestamo, error: null }) };
      c.select.mockReturnValue(c); c.eq.mockReturnValue(c);
      return c;
    });
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null });
    const r = await prestamosService.extenderCuotas('p1', 2);
    expect(vi.mocked(supabase.rpc)).toHaveBeenCalledWith('extender_prestamo_cuotas', expect.objectContaining({ p_prestamo_id: 'p1' }));
  });
});

describe('prestamos.remove success', () => {
  it('elimina si no tiene cobros', async () => {
    const prestamo = { id: 'p1', n_cuotas: 5 };
    const loadSingle = vi.fn().mockResolvedValue({ data: prestamo, error: null });
    const loadChain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: loadSingle };
    loadChain.select.mockReturnValue(loadChain); loadChain.eq.mockReturnValue(loadChain);
    const cobrosChain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() };
    cobrosChain.then = (res) => Promise.resolve({ data: [], error: null }).then(res);
    cobrosChain.select.mockReturnValue(cobrosChain); cobrosChain.eq.mockReturnValue(cobrosChain);
    const deleteCuotasChain = { delete: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() };
    deleteCuotasChain.delete.mockReturnValue(deleteCuotasChain); deleteCuotasChain.eq.mockReturnValue(deleteCuotasChain);
    deleteCuotasChain.then = (res) => Promise.resolve({ error: null }).then(res);
    deleteCuotasChain.delete.mockReturnValue(deleteCuotasChain);
    const deletePrestamoChain = { delete: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() };
    deletePrestamoChain.delete.mockReturnValue(deletePrestamoChain); deletePrestamoChain.eq.mockReturnValue(deletePrestamoChain);
    deletePrestamoChain.then = (res) => Promise.resolve({ error: null }).then(res);
    let call = 0;
    vi.mocked(supabase.from).mockImplementation((table) => {
      call++;
      if (call === 1) return loadChain;
      if (call === 2) return cobrosChain;
      if (call === 3) return deleteCuotasChain;
      return deletePrestamoChain;
    });
    const r = await prestamosService.remove('p1');
    expect(r).toBe(true);
  });
});
