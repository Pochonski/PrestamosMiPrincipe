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
import {
  PrestamoNoEncontradoError,
  CuotaInvalidaError,
  MontoInvalidoError,
  InteresesAtrasadosError,
  CuotasAgotadasError,
  SoloUltimoCobroError,
} from '../cobros';
import { supabase } from '../../lib/supabase';

beforeEach(() => vi.clearAllMocks());

describe('clases de error', () => {
  it('exponen nombre y datos', () => {
    expect(new PrestamoNoEncontradoError('p1')).toMatchObject({ name: 'PrestamoNoEncontradoError', prestamoId: 'p1' });
    expect(new CuotaInvalidaError(2, 'x')).toMatchObject({ name: 'CuotaInvalidaError', cuotaNumero: 2 });
    expect(new MontoInvalidoError('m')).toMatchObject({ name: 'MontoInvalidoError' });
    expect(new InteresesAtrasadosError(3)).toMatchObject({ name: 'InteresesAtrasadosError', cantidadAtrasados: 3 });
    expect(new CuotasAgotadasError(7)).toMatchObject({ name: 'CuotasAgotadasError', saldoPendiente: 7 });
    expect(new SoloUltimoCobroError()).toMatchObject({ name: 'SoloUltimoCobroError' });
    expect(new SoloUltimoCobroError('eliminar').message).toContain('eliminar');
  });
});

describe('updateLast mapea errores del RPC', () => {
  const base = { cuotaNumero: 1, monto: 500, tipo: 'interes' };
  async function err(message) {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message } });
    return cobrosService.updateLast('c1', base).catch((e) => e);
  }
  it('último cobro -> SoloUltimoCobroError', async () => {
    expect(await err('Solo se puede editar el último cobro del préstamo')).toBeInstanceOf(SoloUltimoCobroError);
    expect(await err('ultimo cobro')).toBeInstanceOf(SoloUltimoCobroError);
  });
  it('cobro no encontrado -> Error', async () => {
    expect((await err('Cobro no encontrado')).message).toContain('ya no existe');
  });
  it('monto menor -> MontoInvalidoError', async () => {
    expect(await err('monto menor que interés')).toBeInstanceOf(MontoInvalidoError);
  });
  it('cuota not pending / no existe -> CuotaInvalidaError', async () => {
    expect(await err('Cuota 1 not pending')).toBeInstanceOf(CuotaInvalidaError);
    expect(await err('Cuota 9 no existe')).toBeInstanceOf(CuotaInvalidaError);
  });
  it('atrasados con cantidad', async () => {
    const e = await err('intereses atrasados: 4');
    expect(e).toBeInstanceOf(InteresesAtrasadosError);
    expect(e.cantidadAtrasados).toBe(4);
  });
  it('agotadas -> CuotasAgotadasError', async () => {
    expect(await err('Cuotas agotadas pero queda saldo')).toBeInstanceOf(CuotasAgotadasError);
  });
});

describe('removeLast', () => {
  it('éxito devuelve prestamo_id', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: 'p1', error: null });
    await expect(cobrosService.removeLast('c1')).resolves.toBe('p1');
    expect(vi.mocked(supabase.rpc)).toHaveBeenCalledWith('delete_last_cobro', { p_cobro_id: 'c1' });
  });
  it('último cobro -> SoloUltimoCobroError eliminar', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: 'último cobro' } });
    const e = await cobrosService.removeLast('c1').catch((x) => x);
    expect(e).toBeInstanceOf(SoloUltimoCobroError);
    expect(e.message).toContain('eliminar');
  });
});
