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
    const loadChain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: loadSingle, maybeSingle: loadSingle };
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
  it('bloquea extender préstamo liquidado', async () => {
  const prestamo = { id: 'p1', n_cuotas: 5, tasa: 10, saldo_capital: 0, estado: 'cancelado', periodo: { tipo: 'quincenal' }, org_id: 'org-1' };
    const maybeSingle = vi.fn().mockResolvedValue({ data: prestamo, error: null });
    const getChain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle };
    getChain.select.mockReturnValue(getChain); getChain.eq.mockReturnValue(getChain);
    const cuotasChain = { select: vi.fn().mockReturnThis(), in: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), range: vi.fn().mockReturnThis() };
    cuotasChain.then = (res) => Promise.resolve({ data: [], error: null }).then(res);
    vi.mocked(supabase.from).mockImplementation((t) => t === 'cuotas' ? cuotasChain : getChain);
    await expect(prestamosService.extenderCuotas('p1', 2)).rejects.toThrow('liquidado');
    expect(vi.mocked(supabase.rpc)).not.toHaveBeenCalled();
  });
});

describe('prestamos.remove success', () => {
  it('elimina si no tiene cobros', async () => {
  const prestamo = { id: 'p1', n_cuotas: 5 };
    const loadSingle = vi.fn().mockResolvedValue({ data: prestamo, error: null });
    const loadChain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: loadSingle, maybeSingle: loadSingle };
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

describe('prestamos tasas puras', () => {
  it('tasaComision variantes', () => {
  expect(prestamosService.tasaComision(null)).toBe(0);
    expect(prestamosService.tasaComision({})).toBe(0);
    expect(prestamosService.tasaComision({ tasa_comision: '' })).toBe(0);
    expect(prestamosService.tasaComision({ tasa_comision: 0 })).toBe(0);
    expect(prestamosService.tasaComision({ tasa_comision: 3 })).toBe(3);
  });
  it('tasaTotal suma base + comisión', () => {
  expect(prestamosService.tasaTotal({ tasa: 10, tasa_comision: 2 })).toBe(12);
  });
});

describe('prestamos.extenderCuotas valida cantidad', () => {
  it.each([0, -2, 61, 'abc'])('rechaza %s sin tocar DB', async (n) => {
    await expect(prestamosService.extenderCuotas('p1', n)).rejects.toThrow('inválida');
    expect(vi.mocked(supabase.from)).not.toHaveBeenCalled();
  });
});

describe('prestamos.update valida tasas', () => {
  function mockGetById() {
  const prestamo = {
      id: 'p1', ruta: 'R', periodo: { tipo: 'mensual' }, monto: 10000, tasa: 10,
      tasa_comision: null, n_cuotas: 5, fecha_inicio: '2024-01-01', cuotas: [],
      saldo_capital: 10000, org_id: 'org-1',
    };
    const maybeSingle = vi.fn().mockResolvedValue({ data: prestamo, error: null });
    const getChain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle };
    getChain.select.mockReturnValue(getChain); getChain.eq.mockReturnValue(getChain);
    const cuotasChain = { select: vi.fn().mockReturnThis(), in: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis() };
    cuotasChain.then = (res) => Promise.resolve({ data: [], error: null }).then(res);
    vi.mocked(supabase.from).mockImplementation((t) => t === 'cuotas' ? cuotasChain : getChain);
  }
  it('tasa negativa -> error', async () => {
    mockGetById();
    await expect(prestamosService.update('p1', { tasa: -5 })).rejects.toThrow('negativas');
  });
  it('suma > 100 -> error', async () => {
    mockGetById();
    await expect(prestamosService.update('p1', { tasa: 60, tasa_comision: 50 })).rejects.toThrow('muy alta');
  });
});
