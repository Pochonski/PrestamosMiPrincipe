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

import * as prestamosService from '../prestamos';
import { supabase } from '../../lib/supabase';

function pageChain(rows) {
  const c = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(),
    single: vi.fn(),
  };
  c.select.mockReturnValue(c);
  c.eq.mockReturnValue(c);
  c.in.mockReturnValue(c);
  c.order.mockReturnValue(c);
  c.range.mockReturnValue(c);
  c.delete.mockReturnValue(c);
  c.update.mockReturnValue(c);
  c.then = (res) => Promise.resolve({ data: rows, error: null }).then(res);
  return c;
}

const hoy = new Date();
const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
const ayer = new Date(hoy);
ayer.setDate(ayer.getDate() - 1);
const ayerStr = `${ayer.getFullYear()}-${String(ayer.getMonth() + 1).padStart(2, '0')}-${String(ayer.getDate()).padStart(2, '0')}`;

beforeEach(() => vi.clearAllMocks());

describe('prestamos.resumen single-pass', () => {
  it('listAll pagina en varias páginas', async () => {
    const a = { id: 'a', cliente_id: 'c', estado: 'vigente', monto: 100, saldo_capital: 100, n_cuotas: 0, cuotas: [] };
    const b = { id: 'b', cliente_id: 'c', estado: 'vigente', monto: 100, saldo_capital: 100, n_cuotas: 0, cuotas: [] };
    vi.mocked(supabase.from).mockImplementation((t) => {
      if (t === 'cuotas') return pageChain([]);
      const c = pageChain([]);
      c.range.mockImplementation((from) => pageChain(from === 0 ? [a] : from === 1 ? [b] : []));
      return c;
    });
    const r = await prestamosService.listAll({ pageSize: 1 });
    expect(r.map((p) => p.id)).toEqual(['a', 'b']);
  });
  it('agrega cartera, atrasado, hoy y activos en un listAll', async () => {
    const prestamo = {
      id: 'p1',
      cliente_id: 'c1',
      estado: 'vigente',
      monto: 10000,
      saldo_capital: 8000,
      n_cuotas: 2,
    };
    const cuotas = [
      { prestamo_id: 'p1', numero: 1, fecha: ayerStr, monto: 800, estado: 'pendiente' },
      { prestamo_id: 'p1', numero: 2, fecha: hoyStr, monto: 800, estado: 'pendiente' },
    ];
    vi.mocked(supabase.from).mockImplementation((t) => {
      if (t === 'cuotas') return pageChain(cuotas);
      const c = pageChain([prestamo]);
      // list() pagina: primera página trae 1, segunda vacía para cortar
      let calls = 0;
      c.range.mockImplementation(() => pageChain(calls++ === 0 ? [prestamo] : []));
      return c;
    });
    const r = await prestamosService.resumen();
    expect(r.carteraTotal).toBe(8000);
    expect(r.totalAtrasado).toBe(800);
    expect(r.cantidadAtrasados).toBe(1);
    expect(r.totalCobrarHoy).toBe(800);
    expect(r.cantidadCobrarHoy).toBe(1);
    expect(r.cantidadActivos).toBe(1);
  });
  it('préstamo cancelado no suma cartera', async () => {
    const prestamo = { id: 'p9', cliente_id: 'c9', estado: 'cancelado', monto: 5000, saldo_capital: 0, n_cuotas: 1, cuotas: [] };
    vi.mocked(supabase.from).mockImplementation((t) => {
      if (t === 'cuotas') return pageChain([]);
      return pageChain([prestamo]);
    });
    const r = await prestamosService.resumen();
    expect(r.carteraTotal).toBe(0);
    expect(r.cantidadActivos).toBe(0);
  });
  it('vigente sin atraso + cuotas cerradas se saltean', async () => {
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);
    const mananaStr = `${manana.getFullYear()}-${String(manana.getMonth() + 1).padStart(2, '0')}-${String(manana.getDate()).padStart(2, '0')}`;
    const prestamo = { id: 'p2', cliente_id: 'c2', estado: 'vigente', monto: 20000, saldo_capital: 20000, n_cuotas: 3 };
    const cuotas = [
      { prestamo_id: 'p2', numero: 1, fecha: ayerStr, monto: 100, estado: 'pagada' },
      { prestamo_id: 'p2', numero: 2, fecha: ayerStr, monto: 100, estado: 'cancelada' },
      { prestamo_id: 'p2', numero: 3, fecha: mananaStr, monto: 200, estado: 'pendiente' },
    ];
    vi.mocked(supabase.from).mockImplementation((t) => {
      if (t === 'cuotas') return pageChain(cuotas);
      return pageChain([prestamo]);
    });
    const r = await prestamosService.resumen();
    expect(r.carteraTotal).toBe(20000);
    expect(r.totalAtrasado).toBe(0);
    expect(r.cantidadAtrasados).toBe(0);
    expect(r.totalCobrarHoy).toBe(0);
    expect(r.cantidadCobrarHoy).toBe(0);
    expect(r.cantidadActivos).toBe(1);
  });
});

describe('prestamos.remove via RPC', () => {
  it('usa delete_prestamo_seguro si existe', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null });
    const r = await prestamosService.remove('p1');
    expect(r).toBe(true);
    expect(vi.mocked(supabase.rpc)).toHaveBeenCalledWith('delete_prestamo_seguro', { p_prestamo_id: 'p1' });
    expect(vi.mocked(supabase.from)).not.toHaveBeenCalled();
  });
  it('traduce error de cobros del RPC', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: 'tiene cobros (2)' } });
    await expect(prestamosService.remove('p1')).rejects.toThrow('No se puede eliminar');
  });
  it('fallback cliente si el RPC no existe', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: 'function does not exist', code: '42883' } });
    const loadChain = pageChain(null);
    loadChain.maybeSingle.mockResolvedValue({ data: { id: 'p1', n_cuotas: 2 }, error: null });
    const cobrosChain = pageChain([]);
    const delChain = pageChain(null);
    let call = 0;
    vi.mocked(supabase.from).mockImplementation(() => [loadChain, cobrosChain, delChain, delChain][call++ % 4]);
    const r = await prestamosService.remove('p1');
    expect(r).toBe(true);
  });
  it('extender tolera error de sync n_cuotas (warn, no bloquea)', async () => {
    const prestamo = { id: 'p1', n_cuotas: 5, tasa: 10, saldo_capital: 10000, periodo: { tipo: 'diario' }, fecha_inicio: '2024-01-01', cuotas: [], org_id: 'org-1' };
    const maybeSingle = vi.fn().mockResolvedValue({ data: prestamo, error: null });
    const getChain = pageChain(null);
    getChain.maybeSingle = maybeSingle;
    const cuotasChain = pageChain([]);
    const syncChain = pageChain(null);
    syncChain.then = (res) => Promise.resolve({ error: { message: 'sync fail' } }).then(res);
    let prestamosCalls = 0;
    vi.mocked(supabase.from).mockImplementation((t) => {
      if (t === 'cuotas') return cuotasChain;
      // getById inicial (1) -> sync update (2) -> getById final (3+)
      prestamosCalls++;
      if (prestamosCalls === 2) return syncChain;
      return getChain;
    });
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const r = await prestamosService.extenderCuotas('p1', 1);
    expect(r.id).toBe('p1');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('sync'), expect.anything());
    warn.mockRestore();
  });
});
