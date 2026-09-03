import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/supabase', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getOrgId: vi.fn().mockResolvedValue('org-1'),
    supabase: { from: vi.fn(), auth: { getUser: vi.fn() }, rpc: vi.fn() },
  };
});
vi.mock('../../lib/events', () => ({ emitDataChanged: vi.fn() }));

import * as cobrosService from '../cobros';
import { supabase } from '../../lib/supabase';

beforeEach(() => vi.clearAllMocks());

const listChain = (data) => {
  const c = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), range: vi.fn().mockReturnThis() };
  c.select.mockReturnValue(c); c.eq.mockReturnValue(c); c.order.mockReturnValue(c); c.range.mockReturnValue(c);
  c.then = (res) => Promise.resolve({ data, error: null }).then(res);
  return c;
};

describe('cobros normalizeCobro branches', () => {
  it('normaliza snake_case a camelCase y viceversa', async () => {
    const rows = [
      { id: '1', cliente_id: 'c1', cuota_numero: 2, cobrador_id: 'u1', prestamo_id: 'p1', incluir_interes: true, monto: 100 },
    ];
    vi.mocked(supabase.from).mockReturnValue(listChain(rows));
    const r = await cobrosService.list();
    expect(r[0].clienteId).toBe('c1');
    expect(r[0].cliente_id).toBe('c1');
    expect(r[0].cuotaNumero).toBe(2);
    expect(r[0].cuota_numero).toBe(2);
    expect(r[0].cobradorId).toBe('u1');
    expect(r[0].cobrador_id).toBe('u1');
    expect(r[0].prestamoId).toBe('p1');
    expect(r[0].prestamo_id).toBe('p1');
    expect(r[0].incluirInteres).toBe(true);
    expect(r[0].incluir_interes).toBe(true);
  });

  it('normaliza camelCase ya presente', async () => {
    const rows = [
      { id: '1', clienteId: 'c2', cuotaNumero: 3, cobradorId: 'u2', prestamoId: 'p2', incluirInteres: false, monto: 200 },
    ];
    vi.mocked(supabase.from).mockReturnValue(listChain(rows));
    const r = await cobrosService.list();
    expect(r[0].cliente_id).toBe('c2');
    expect(r[0].prestamo_id).toBe('p2');
    expect(r[0].cobrador_id).toBe('u2');
  });

  it('normalize recibe campos ausentes', async () => {
    const rows = [{ id: '1', monto: 50 }];
    vi.mocked(supabase.from).mockReturnValue(listChain(rows));
    const r = await cobrosService.list();
    expect(r[0].id).toBe('1');
    expect(r[0].monto).toBe(50);
  });

  it('getById normaliza', async () => {
    const c = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockReturnThis() };
    c.select.mockReturnValue(c); c.eq.mockReturnValue(c);
    c.maybeSingle.mockReturnValue({ then: (res) => Promise.resolve({ data: { id: 'x', cliente_id: 'c1' }, error: null }).then(res) });
    vi.mocked(supabase.from).mockReturnValue(c);
    const r = await cobrosService.getById('x');
    expect(r.clienteId).toBe('c1');
  });
});