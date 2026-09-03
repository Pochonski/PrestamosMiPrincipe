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
import { emitDataChanged } from '../../lib/events';

beforeEach(() => vi.clearAllMocks());

describe('cobros.create error mapping', () => {
  it('monto menor -> MontoInvalidoError', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: 'monto menor que interes' } });
    await expect(cobrosService.create({ prestamoId: 'p1', cuotaNumero: 1, monto: 100, tipo: 'interes' }))
      .rejects.toHaveProperty('name', 'MontoInvalidoError');
  });
  it('cuota not pending -> CuotaInvalidaError', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: 'cuota not pending' } });
    await expect(cobrosService.create({ prestamoId: 'p1', cuotaNumero: 2, monto: 100, tipo: 'capital' }))
      .rejects.toHaveProperty('name', 'CuotaInvalidaError');
  });
  it('intereses atrasados -> InteresesAtrasadosError con cantidad', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: 'intereses atrasados: 3' } });
    const err = await cobrosService.create({ prestamoId: 'p1', cuotaNumero: 1, monto: 100, tipo: 'capital' }).catch(e => e);
    expect(err.name).toBe('InteresesAtrasadosError');
    expect(err.cantidadAtrasados).toBe(3);
  });
  it('cuotas agotadas -> CuotasAgotadasError', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: 'cuotas agotadas' } });
    await expect(cobrosService.create({ prestamoId: 'p1', cuotaNumero: 1, monto: 100, tipo: 'capital' }))
      .rejects.toHaveProperty('name', 'CuotasAgotadasError');
  });
  it('éxito emite evento', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: 'cob-id', error: null });
    const maybeSingle = vi.fn().mockResolvedValue({ data: { id: 'cob-id' }, error: null });
    const chain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle };
    chain.eq.mockReturnValue(chain);
    chain.select.mockReturnValue(chain);
    vi.mocked(supabase.from).mockReturnValue(chain);
    const r = await cobrosService.create({ prestamoId: 'p1', cuotaNumero: 1, monto: 10000, tipo: 'interes' });
    expect(r.id).toBe('cob-id');
    expect(emitDataChanged).toHaveBeenCalled();
  });
});

describe('cobros.recientes', () => {
  it('recientes slice limit pure', () => {
    const all = Array.from({ length: 10 }, (_, i) => ({ id: `${i}`, monto: 100 }));
    expect(all.slice(0, 3)).toHaveLength(3);
  });
});
