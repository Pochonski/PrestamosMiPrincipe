import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/supabase', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    supabase: {
      from: vi.fn(),
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
      rpc: vi.fn(),
    },
  };
});

import { resumenTotales, cobrosSerieDiaria, cobrosSerieMensual } from '../totales';
import { supabase } from '../../lib/supabase';

beforeEach(() => vi.clearAllMocks());

describe('resumenTotales', () => {
  it('devuelve data del RPC', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: { cantidadActivos: 3 }, error: null });
    await expect(resumenTotales()).resolves.toEqual({ cantidadActivos: 3 });
    expect(vi.mocked(supabase.rpc)).toHaveBeenCalledWith('resumen_totales');
  });
  it('null -> {}', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null });
    await expect(resumenTotales()).resolves.toEqual({});
  });
  it('error -> throw', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: 'boom' } });
    await expect(resumenTotales()).rejects.toEqual({ message: 'boom' });
  });
});

describe('cobrosSerieDiaria', () => {
  it('pasa p_dias y devuelve serie', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: [{ dia: '2026-09-01' }], error: null });
    await expect(cobrosSerieDiaria(14)).resolves.toEqual([{ dia: '2026-09-01' }]);
    expect(vi.mocked(supabase.rpc)).toHaveBeenCalledWith('cobros_serie_diaria', { p_dias: 14 });
  });
  it('default 7 días y null -> []', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null });
    await expect(cobrosSerieDiaria()).resolves.toEqual([]);
    expect(vi.mocked(supabase.rpc)).toHaveBeenCalledWith('cobros_serie_diaria', { p_dias: 7 });
  });
  it('error -> throw', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: 'x' } });
    await expect(cobrosSerieDiaria()).rejects.toEqual({ message: 'x' });
  });
});

describe('cobrosSerieMensual', () => {
  it('pasa p_meses y devuelve serie', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: [{ mes: '2026-09' }], error: null });
    await expect(cobrosSerieMensual(3)).resolves.toEqual([{ mes: '2026-09' }]);
    expect(vi.mocked(supabase.rpc)).toHaveBeenCalledWith('cobros_serie_mensual', { p_meses: 3 });
  });
  it('default 6 meses y null -> []', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null });
    await expect(cobrosSerieMensual()).resolves.toEqual([]);
    expect(vi.mocked(supabase.rpc)).toHaveBeenCalledWith('cobros_serie_mensual', { p_meses: 6 });
  });
  it('error -> throw', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: 'y' } });
    await expect(cobrosSerieMensual()).rejects.toEqual({ message: 'y' });
  });
});
