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

describe('prestamos calc puros', () => {
  it('calcCarteraTotal suma no cancelados', () => {
    expect(prestamosService.calcCarteraTotal([
      { estado: 'vigente', saldo_capital: 1000 },
      { estado: 'cancelado', saldo_capital: 9999 },
      { estado: 'atrasado', saldo_capital: 500 },
    ])).toBe(1500);
    expect(prestamosService.calcCarteraTotal([])).toBe(0);
    expect(prestamosService.calcCarteraTotal(null)).toBe(0);
  });
  it('calcTotalAtrasado', () => {
    expect(prestamosService.calcTotalAtrasado([{ cuota: { monto: 100 } }, { cuota: { monto: 200 } }])).toBe(300);
    expect(prestamosService.calcTotalAtrasado([])).toBe(0);
  });
  it('calcTotalCobrarHoy', () => {
    expect(prestamosService.calcTotalCobrarHoy([{ cuota: { monto: 50 } }])).toBe(50);
  });
  it('resumen pure via calc', () => {
    expect(prestamosService.calcCarteraTotal([{ estado: 'vigente', saldo_capital: 100 }, { estado: 'cancelado', saldo_capital: 50 }])).toBe(100);
  });
  it('activos filtra via list mock', async () => {
    const cuotasChain = { select: vi.fn().mockReturnThis(), in: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), range: vi.fn().mockReturnThis() };
    cuotasChain.then = (res) => Promise.resolve({ data: [], error: null }).then(res);
    cuotasChain.select.mockReturnValue(cuotasChain); cuotasChain.in.mockReturnValue(cuotasChain); cuotasChain.order.mockReturnValue(cuotasChain);
    cuotasChain.range = cuotasChain.range || require("vitest").vi.fn().mockReturnThis();
    cuotasChain.range.mockReturnValue(cuotasChain);
    const listChain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), range: vi.fn().mockReturnThis() };
    listChain.select.mockReturnValue(listChain); listChain.eq.mockReturnValue(listChain); listChain.order.mockReturnValue(listChain);
    listChain.range = listChain.range || require("vitest").vi.fn().mockReturnThis();
    listChain.range.mockReturnValue(listChain);
    listChain.then = (res) => Promise.resolve({ data: [
      { id: '1', estado: 'vigente', saldo_capital: 100, cliente_id: 'c1', cuotas: [] },
      { id: '2', estado: 'cancelado', saldo_capital: 100, cliente_id: 'c1', cuotas: [] },
    ], error: null }).then(res);
    vi.mocked(supabase.from).mockImplementation((t) => t === 'cuotas' ? cuotasChain : listChain);
    const r = await prestamosService.activos();
    expect(r.length).toBe(1);
    expect(r[0].id).toBe('1');
  });
});

describe('prestamos.update', () => {
  it('early return si solo updated_at', async () => {
    const prestamo = { id: 'p1', cliente_id: 'c1', monto: 1000, n_cuotas: 10, periodo: { tipo: 'diario' }, saldo_capital: 1000, tasa: 10, fecha_inicio: '2024-01-01', cuotas: [] };
    const maybeSingle = vi.fn().mockResolvedValue({ data: prestamo, error: null });
    const getChain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle };
    getChain.select.mockReturnValue(getChain); getChain.eq.mockReturnValue(getChain);
    const cuotasChain = { select: vi.fn().mockReturnThis(), in: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), range: vi.fn().mockReturnThis() };
    cuotasChain.then = (res) => Promise.resolve({ data: [], error: null }).then(res);
    cuotasChain.select.mockReturnValue(cuotasChain); cuotasChain.in.mockReturnValue(cuotasChain); cuotasChain.order.mockReturnValue(cuotasChain);
    cuotasChain.range = cuotasChain.range || require("vitest").vi.fn().mockReturnThis();
    cuotasChain.range.mockReturnValue(cuotasChain);
    vi.mocked(supabase.from).mockImplementation((t) => t === 'cuotas' ? cuotasChain : getChain);
    const r = await prestamosService.update('p1', {});
    expect(r.clienteId).toBe('c1');
    expect(supabase.rpc).not.toHaveBeenCalled();
  });
  it('update monto cambia saldo_capital', async () => {
    const prestamo = { id: 'p1', cliente_id: 'c1', monto: 1000, n_cuotas: 10, saldo_capital: 1000, cuotas: [], periodo: { tipo: 'mensual' }, fecha_inicio: '2024-01-01', tasa: 10, ruta: 'A' };
    const prestamoUpdated = { id: 'p1', cliente_id: 'c1', monto: 2000, n_cuotas: 10, saldo_capital: 2000, cuotas: [], periodo: { tipo: 'mensual' }, fecha_inicio: '2024-01-01', tasa: 10, ruta: 'A' };
    let getCall = 0;
    const maybeSingle = vi.fn().mockImplementation(() => {
      getCall++;
      const data = getCall === 1 ? prestamo : prestamoUpdated;
      return Promise.resolve({ data, error: null });
    });
    const getChain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle };
    getChain.select.mockReturnValue(getChain); getChain.eq.mockReturnValue(getChain);
    const cuotasChain = { select: vi.fn().mockReturnThis(), in: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), range: vi.fn().mockReturnThis() };
    cuotasChain.then = (res) => Promise.resolve({ data: [], error: null }).then(res);
    cuotasChain.select.mockReturnValue(cuotasChain); cuotasChain.in.mockReturnValue(cuotasChain); cuotasChain.order.mockReturnValue(cuotasChain);
    cuotasChain.range = cuotasChain.range || require("vitest").vi.fn().mockReturnThis();
    cuotasChain.range.mockReturnValue(cuotasChain);
    vi.mocked(supabase.rpc).mockResolvedValue({ data: 'p1', error: null });
    vi.mocked(supabase.from).mockImplementation((t) => {
      if (t === 'cuotas') return cuotasChain;
      const combined = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle };
      combined.select.mockReturnValue(combined); combined.eq.mockReturnValue(combined);
      return combined;
    });
    const r = await prestamosService.update('p1', { monto: 2000 });
    expect(r.saldo_capital).toBe(2000);
    expect(supabase.rpc).toHaveBeenCalledWith('update_prestamo_with_cuotas', expect.objectContaining({ p_monto: 2000 }));
  });
});

describe('prestamos agregaciones async', () => {
  const makeListChain = (data) => {
    const listChain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), range: vi.fn().mockReturnThis() };
    listChain.select.mockReturnValue(listChain); listChain.eq.mockReturnValue(listChain); listChain.order.mockReturnValue(listChain);
    listChain.range = listChain.range || require('vitest').vi.fn().mockReturnThis();
    listChain.range.mockReturnValue(listChain);
    listChain.then = (res) => Promise.resolve({ data, error: null }).then(res);
    return listChain;
  };
  const makeCuotasChain = (data) => {
    const c = { select: vi.fn().mockReturnThis(), in: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), range: vi.fn().mockReturnThis() };
    c.select.mockReturnValue(c); c.in.mockReturnValue(c); c.order.mockReturnValue(c); c.range = c.range || require('vitest').vi.fn().mockReturnThis(); c.range.mockReturnValue(c);
    c.then = (res) => Promise.resolve({ data, error: null }).then(res);
    return c;
  };

  it('totalAtrasado', async () => {
    const past = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const cuotasData = [{ prestamo_id: 'p1', estado: 'pendiente', fecha: past, monto: 100 }];
    let call = 0;
    vi.mocked(supabase.from).mockImplementation((t) => {
      if (t === 'cuotas') { call++; return call === 1 ? makeCuotasChain([]) : makeCuotasChain(cuotasData); }
      return makeListChain([{ id: 'p1', cliente_id: 'c1', saldo_capital: 1000, monto: 1000, n_cuotas: 1, periodo: 'semanal', fecha_inicio: '2024-01-01', estado: 'vigente' }]);
    });
    const r = await prestamosService.totalAtrasado();
    expect(r).toBe(100);
  });

  it('carteraTotal', async () => {
    const items = [
      { id: 'p1', cliente_id: 'c1', saldo_capital: 1000, estado: 'vigente', monto: 1000, n_cuotas: 1, periodo: 'semanal', fecha_inicio: '2024-01-01' },
      { id: 'p2', cliente_id: 'c1', saldo_capital: 500, estado: 'cancelado', monto: 500, n_cuotas: 1, periodo: 'semanal', fecha_inicio: '2024-01-01' },
    ];
    vi.mocked(supabase.from).mockImplementation((t) => t === 'cuotas' ? makeCuotasChain([]) : makeListChain(items));
    const r = await prestamosService.carteraTotal();
    expect(r).toBe(1000);
  });

  it('cantidadActivos', async () => {
    const items = [
      { id: 'p1', cliente_id: 'c1', saldo_capital: 1000, estado: 'vigente', monto: 1000, n_cuotas: 1, periodo: 'semanal', fecha_inicio: '2024-01-01', cuotas: [{ numero: 1, fecha: new Date(Date.now() + 86400000).toISOString().slice(0, 10), estado: 'pendiente', monto: 100 }] },
    ];
    vi.mocked(supabase.from).mockImplementation((t) => t === 'cuotas' ? makeCuotasChain([]) : makeListChain(items));
    const r = await prestamosService.cantidadActivos();
    expect(r).toBe(1);
  });

  it('totalCobrarHoy', async () => {
    const hoy = new Date().toISOString().slice(0, 10);
    const cuotasData = [{ prestamo_id: 'p1', estado: 'pendiente', fecha: hoy, monto: 300 }];
    let call = 0;
    const listData = [{ id: 'p1', cliente_id: 'c1', saldo_capital: 1000, monto: 1000, n_cuotas: 1, periodo: 'semanal', fecha_inicio: hoy, estado: 'vigente' }];
    const cobrarHoyCuotas = { select: vi.fn().mockReturnThis(), in: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), gte: vi.fn().mockReturnThis(), lt: vi.fn().mockReturnThis() };
    cobrarHoyCuotas.select.mockReturnValue(cobrarHoyCuotas); cobrarHoyCuotas.in.mockReturnValue(cobrarHoyCuotas); cobrarHoyCuotas.eq.mockReturnValue(cobrarHoyCuotas); cobrarHoyCuotas.gte.mockReturnValue(cobrarHoyCuotas); cobrarHoyCuotas.lt.mockReturnValue(cobrarHoyCuotas);
    cobrarHoyCuotas.then = (res) => Promise.resolve({ data: cuotasData, error: null }).then(res);
    vi.mocked(supabase.from).mockImplementation((t) => {
      if (t === 'cuotas') { call++; return call === 1 ? makeCuotasChain([]) : cobrarHoyCuotas; }
      return makeListChain(listData);
    });
    const r = await prestamosService.totalCobrarHoy();
    expect(r).toBe(300);
  });
});

describe('prestamos delCliente y getById normalize', () => {
  it('delCliente hydrate', async () => {
    const data = [{ id: 'p1', cliente_id: 'c1', monto: 1000 }];
    const orgChain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() };
    orgChain.select.mockReturnValue(orgChain); orgChain.eq.mockReturnValue(orgChain);
    orgChain.then = (res) => Promise.resolve({ data, error: null }).then(res);
    const cuotasChain = { select: vi.fn().mockReturnThis(), in: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), range: vi.fn().mockReturnThis() };
    cuotasChain.then = (res) => Promise.resolve({ data: [], error: null }).then(res);
    cuotasChain.select.mockReturnValue(cuotasChain); cuotasChain.in.mockReturnValue(cuotasChain); cuotasChain.order.mockReturnValue(cuotasChain);
    cuotasChain.range = cuotasChain.range || require("vitest").vi.fn().mockReturnThis();
    cuotasChain.range.mockReturnValue(cuotasChain);
    vi.mocked(supabase.from).mockImplementation((t) => t === 'cuotas' ? cuotasChain : orgChain);
    const r = await prestamosService.delCliente('c1');
    expect(r[0].clienteId).toBe('c1');
    expect(r[0].cuotas).toEqual([]);
  });
});

describe('prestamos list / getById', () => {
  it('list normaliza y hydrate', async () => {
    const data = [{ id: 'p1', cliente_id: 'c1', monto: 1000 }];
    const orgChain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), range: vi.fn().mockReturnThis() };
    orgChain.select.mockReturnValue(orgChain); orgChain.eq.mockReturnValue(orgChain); orgChain.order.mockReturnValue(orgChain);
    orgChain.range = orgChain.range || require("vitest").vi.fn().mockReturnThis();
    orgChain.range.mockReturnValue(orgChain);
    orgChain.then = (res) => Promise.resolve({ data, error: null }).then(res);
    const cuotasChain = { select: vi.fn().mockReturnThis(), in: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), range: vi.fn().mockReturnThis() };
    cuotasChain.then = (res) => Promise.resolve({ data: [], error: null }).then(res);
    cuotasChain.select.mockReturnValue(cuotasChain); cuotasChain.in.mockReturnValue(cuotasChain); cuotasChain.order.mockReturnValue(cuotasChain);
    cuotasChain.range = cuotasChain.range || require("vitest").vi.fn().mockReturnThis();
    cuotasChain.range.mockReturnValue(cuotasChain);
    vi.mocked(supabase.from).mockImplementation((t) => t === 'cuotas' ? cuotasChain : orgChain);
    const r = await prestamosService.list();
    expect(r[0].clienteId).toBe('c1');
  });
  it('getById null', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const chain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle };
    chain.select.mockReturnValue(chain); chain.eq.mockReturnValue(chain);
    const cuotasChain = { select: vi.fn().mockReturnThis(), in: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), range: vi.fn().mockReturnThis() };
    cuotasChain.then = (res) => Promise.resolve({ data: [], error: null }).then(res);
    cuotasChain.select.mockReturnValue(cuotasChain); cuotasChain.in.mockReturnValue(cuotasChain); cuotasChain.order.mockReturnValue(cuotasChain);
    cuotasChain.range = cuotasChain.range || require("vitest").vi.fn().mockReturnThis();
    cuotasChain.range.mockReturnValue(cuotasChain);
    vi.mocked(supabase.from).mockImplementation((t) => t === 'cuotas' ? cuotasChain : chain);
    expect(await prestamosService.getById('nope')).toBeNull();
  });
  it('list error throw', async () => {
    const chain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), range: vi.fn().mockReturnThis() };
    chain.select.mockReturnValue(chain); chain.eq.mockReturnValue(chain); chain.order.mockReturnValue(chain);
    chain.range = chain.range || require("vitest").vi.fn().mockReturnThis();
    chain.range.mockReturnValue(chain);
    chain.then = (res) => Promise.resolve({ data: null, error: new Error('fail') }).then(res);
    vi.mocked(supabase.from).mockReturnValue(chain);
    await expect(prestamosService.list()).rejects.toThrow('fail');
  });
});

describe('cuotasAtrasadas / cobrarHoy', () => {
  it('cuotasAtrasadas sin prestamos', async () => {
    const emptyList = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), range: vi.fn().mockReturnThis() };
    emptyList.select.mockReturnValue(emptyList); emptyList.eq.mockReturnValue(emptyList); emptyList.order.mockReturnValue(emptyList);
    emptyList.range = emptyList.range || require("vitest").vi.fn().mockReturnThis();
    emptyList.range.mockReturnValue(emptyList);
    emptyList.then = (res) => Promise.resolve({ data: [], error: null }).then(res);
    const cuotasChain = { select: vi.fn().mockReturnThis(), in: vi.fn().mockReturnThis() };
    cuotasChain.select.mockReturnValue(cuotasChain); cuotasChain.in.mockReturnValue(cuotasChain);
    cuotasChain.then = (res) => Promise.resolve({ data: [], error: null }).then(res);
    vi.mocked(supabase.from).mockImplementation((t) => t === 'cuotas' ? cuotasChain : emptyList);
    // Mock list to return empty via supabase chain above
    const r = await prestamosService.cuotasAtrasadas();
    expect(r).toEqual([]);
  });
  it('cuotasAtrasadas filtra pendientes < hoy', async () => {
    const prestamo = { id: 'p1', clienteId: 'c1', cliente_id: 'c1' };
    // For cuotasAtrasadas without prestamoId, it calls list() -> need to mock list via supabase
    const listData = [prestamo];
    const listChain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), range: vi.fn().mockReturnThis() };
    listChain.select.mockReturnValue(listChain); listChain.eq.mockReturnValue(listChain); listChain.order.mockReturnValue(listChain);
    listChain.range = listChain.range || require("vitest").vi.fn().mockReturnThis();
    listChain.range.mockReturnValue(listChain);
    listChain.then = (res) => Promise.resolve({ data: listData, error: null }).then(res);
    const past = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const future = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const cuotasData = [
      { prestamo_id: 'p1', estado: 'pendiente', fecha: past, monto: 100 },
      { prestamo_id: 'p1', estado: 'pendiente', fecha: future, monto: 200 },
      { prestamo_id: 'p1', estado: 'pagada', fecha: past, monto: 300 },
    ];
    const hydrateCuotas = { select: vi.fn().mockReturnThis(), in: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), range: vi.fn().mockReturnThis() };
    hydrateCuotas.select.mockReturnValue(hydrateCuotas); hydrateCuotas.in.mockReturnValue(hydrateCuotas); hydrateCuotas.order.mockReturnValue(hydrateCuotas);
    hydrateCuotas.range = hydrateCuotas.range || require("vitest").vi.fn().mockReturnThis();
    hydrateCuotas.range.mockReturnValue(hydrateCuotas);
    hydrateCuotas.then = (res) => Promise.resolve({ data: [], error: null }).then(res);
    const cuotasChain = { select: vi.fn().mockReturnThis(), in: vi.fn().mockReturnThis() };
    cuotasChain.select.mockReturnValue(cuotasChain); cuotasChain.in.mockReturnValue(cuotasChain);
    cuotasChain.then = (res) => Promise.resolve({ data: cuotasData, error: null }).then(res);
    let call = 0;
    vi.mocked(supabase.from).mockImplementation((t) => {
      if (t === 'cuotas' && call === 0) { call++; return hydrateCuotas; }
      if (t === 'cuotas') return cuotasChain;
      return listChain;
    });
    const r = await prestamosService.cuotasAtrasadas();
    expect(r).toHaveLength(1);
    expect(r[0].cuota.monto).toBe(100);
  });
  it('cobrarHoy vacío', async () => {
    const listChain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), range: vi.fn().mockReturnThis() };
    listChain.select.mockReturnValue(listChain); listChain.eq.mockReturnValue(listChain); listChain.order.mockReturnValue(listChain);
    listChain.range = listChain.range || require("vitest").vi.fn().mockReturnThis();
    listChain.range.mockReturnValue(listChain);
    listChain.then = (res) => Promise.resolve({ data: [], error: null }).then(res);
    const cuotasChain = { select: vi.fn().mockReturnThis(), in: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), range: vi.fn().mockReturnThis() };
    cuotasChain.then = (res) => Promise.resolve({ data: [], error: null }).then(res);
    vi.mocked(supabase.from).mockImplementation((t) => t === 'cuotas' ? cuotasChain : listChain);
    expect(await prestamosService.cobrarHoy()).toEqual([]);
  });
  it('cobrarHoy con datos', async () => {
    const hoy = new Date().toISOString().slice(0, 10);
    const prestamo = { id: 'p1', cliente_id: 'c1', clienteId: 'c1' };
    const listChain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), range: vi.fn().mockReturnThis() };
    listChain.select.mockReturnValue(listChain); listChain.eq.mockReturnValue(listChain); listChain.order.mockReturnValue(listChain);
    listChain.range = listChain.range || require("vitest").vi.fn().mockReturnThis();
    listChain.range.mockReturnValue(listChain);
    listChain.then = (res) => Promise.resolve({ data: [prestamo], error: null }).then(res);
    const hydrateChain = { select: vi.fn().mockReturnThis(), in: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), range: vi.fn().mockReturnThis() };
    hydrateChain.select.mockReturnValue(hydrateChain); hydrateChain.in.mockReturnValue(hydrateChain); hydrateChain.order.mockReturnValue(hydrateChain);
    hydrateChain.range = hydrateChain.range || require("vitest").vi.fn().mockReturnThis();
    hydrateChain.range.mockReturnValue(hydrateChain);
    hydrateChain.then = (res) => Promise.resolve({ data: [], error: null }).then(res);
    const cuotasChain = { select: vi.fn().mockReturnThis(), in: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), gte: vi.fn().mockReturnThis(), lt: vi.fn().mockReturnThis() };
    cuotasChain.select.mockReturnValue(cuotasChain); cuotasChain.in.mockReturnValue(cuotasChain); cuotasChain.eq.mockReturnValue(cuotasChain); cuotasChain.gte.mockReturnValue(cuotasChain); cuotasChain.lt.mockReturnValue(cuotasChain);
    cuotasChain.then = (res) => Promise.resolve({ data: [{ prestamo_id: 'p1', fecha: hoy, estado: 'pendiente', monto: 500 }], error: null }).then(res);
    let call = 0;
    vi.mocked(supabase.from).mockImplementation((t) => {
      if (t === 'cuotas' && call === 0) { call++; return hydrateChain; }
      if (t === 'cuotas') return cuotasChain;
      return listChain;
    });
    const r = await prestamosService.cobrarHoy();
    expect(r).toHaveLength(1);
    expect(r[0].cuota.monto).toBe(500);
  });
  it('cobrarHoy error', async () => {
    const prestamo = { id: 'p1', cliente_id: 'c1', clienteId: 'c1' };
    const listChain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), range: vi.fn().mockReturnThis() };
    listChain.select.mockReturnValue(listChain); listChain.eq.mockReturnValue(listChain); listChain.order.mockReturnValue(listChain);
    listChain.range = listChain.range || require("vitest").vi.fn().mockReturnThis();
    listChain.range.mockReturnValue(listChain);
    listChain.then = (res) => Promise.resolve({ data: [prestamo], error: null }).then(res);
    const hydrateChain = { select: vi.fn().mockReturnThis(), in: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), range: vi.fn().mockReturnThis() };
    hydrateChain.select.mockReturnValue(hydrateChain); hydrateChain.in.mockReturnValue(hydrateChain); hydrateChain.order.mockReturnValue(hydrateChain);
    hydrateChain.range = hydrateChain.range || require("vitest").vi.fn().mockReturnThis();
    hydrateChain.range.mockReturnValue(hydrateChain);
    hydrateChain.then = (res) => Promise.resolve({ data: [], error: null }).then(res);
    const errChain = { select: vi.fn().mockReturnThis(), in: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), gte: vi.fn().mockReturnThis(), lt: vi.fn().mockReturnThis() };
    errChain.select.mockReturnValue(errChain); errChain.in.mockReturnValue(errChain); errChain.eq.mockReturnValue(errChain); errChain.gte.mockReturnValue(errChain); errChain.lt.mockReturnValue(errChain);
    errChain.then = (res) => Promise.resolve({ data: null, error: { message: 'fail', code: 'x' } }).then(res);
    let call = 0;
    vi.mocked(supabase.from).mockImplementation((t) => {
      if (t === 'cuotas' && call === 0) { call++; return hydrateChain; }
      if (t === 'cuotas') return errChain;
      return listChain;
    });
    await expect(prestamosService.cobrarHoy()).rejects.toThrow();
  });
  it('cuotasAtrasadas con prestamoId', async () => {
    const prestamo = { id: 'p1', cliente_id: 'c1', clienteId: 'c1' };
    const maybeSingle = vi.fn().mockResolvedValue({ data: prestamo, error: null });
    const getChain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle };
    getChain.select.mockReturnValue(getChain); getChain.eq.mockReturnValue(getChain);
    const hydrateChain = { select: vi.fn().mockReturnThis(), in: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), range: vi.fn().mockReturnThis() };
    hydrateChain.select.mockReturnValue(hydrateChain); hydrateChain.in.mockReturnValue(hydrateChain); hydrateChain.order.mockReturnValue(hydrateChain);
    hydrateChain.range = hydrateChain.range || require("vitest").vi.fn().mockReturnThis();
    hydrateChain.range.mockReturnValue(hydrateChain);
    hydrateChain.then = (res) => Promise.resolve({ data: [], error: null }).then(res);
    const past = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const cuotasData = [{ prestamo_id: 'p1', estado: 'pendiente', fecha: past, monto: 777 }];
    const cuotasChain = { select: vi.fn().mockReturnThis(), in: vi.fn().mockReturnThis() };
    cuotasChain.select.mockReturnValue(cuotasChain); cuotasChain.in.mockReturnValue(cuotasChain);
    cuotasChain.then = (res) => Promise.resolve({ data: cuotasData, error: null }).then(res);
    let call = 0;
    vi.mocked(supabase.from).mockImplementation((t) => {
      if (t === 'prestamos' && call === 0) { call++; return getChain; }
      if (t === 'cuotas' && call === 1) { call++; return hydrateChain; }
      if (t === 'cuotas') return cuotasChain;
      return getChain;
    });
    const r = await prestamosService.cuotasAtrasadas('p1');
    expect(r).toHaveLength(1);
    expect(r[0].cuota.monto).toBe(777);
  });
  it('refreshPrestamo delega', async () => {
    const prestamo = { id: 'p1', cliente_id: 'c1' };
    const maybeSingle = vi.fn().mockResolvedValue({ data: prestamo, error: null });
    const chain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle };
    chain.select.mockReturnValue(chain); chain.eq.mockReturnValue(chain);
    const cuotasChain = { select: vi.fn().mockReturnThis(), in: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), range: vi.fn().mockReturnThis() };
    cuotasChain.then = (res) => Promise.resolve({ data: [], error: null }).then(res);
    cuotasChain.select.mockReturnValue(cuotasChain); cuotasChain.in.mockReturnValue(cuotasChain); cuotasChain.order.mockReturnValue(cuotasChain);
    cuotasChain.range = cuotasChain.range || require("vitest").vi.fn().mockReturnThis();
    cuotasChain.range.mockReturnValue(cuotasChain);
    vi.mocked(supabase.from).mockImplementation((t) => t === 'cuotas' ? cuotasChain : chain);
    const r = await prestamosService.refreshPrestamo('p1');
    expect(r.clienteId).toBe('c1');
  });
});
