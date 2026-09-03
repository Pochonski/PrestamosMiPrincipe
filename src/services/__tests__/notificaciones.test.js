import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/supabase', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getOrgId: vi.fn().mockResolvedValue('org-1'),
    supabase: {
      from: vi.fn(),
      auth: { getUser: vi.fn() },
      rpc: vi.fn(),
    },
  };
});

import * as notifService from '../notificaciones';
import { supabase } from '../../lib/supabase';

function chainSelect(data, error = null) {
  const c = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
  };
  c.then = (res) => Promise.resolve({ data, error }).then(res);
  // For list: from().select().eq().order() -> thenable with data
  c.select.mockReturnValue(c); c.eq.mockReturnValue(c); c.order.mockReturnValue(c);
  return c;
}

beforeEach(() => vi.clearAllMocks());

describe('notificaciones.list', () => {
  it('retorna [] si no user', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: null } });
    const r = await notifService.list();
    expect(r).toEqual([]);
  });
  it('retorna data si user', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: { id: 'u1' } } });
    const data = [{ id: '1', leida: false }];
    const chain = chainSelect(data);
    vi.mocked(supabase.from).mockReturnValue(chain);
    // Mock the chain for list: need thenable
    chain.then = (res) => Promise.resolve({ data, error: null }).then(res);
    const r = await notifService.list();
    expect(r).toEqual(data);
  });
});

describe('noLeidas / countNoLeidas', () => {
  it('filtra leida false', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: { id: 'u1' } } });
    const data = [{ id: '1', leida: false }, { id: '2', leida: true }];
    const chain = chainSelect(data);
    vi.mocked(supabase.from).mockReturnValue(chain);
    chain.then = (res) => Promise.resolve({ data, error: null }).then(res);
    const r = await notifService.noLeidas();
    expect(r).toHaveLength(1);
    expect(await notifService.countNoLeidas()).toBe(1);
  });
});

describe('existeNoLeidaPorTipo', () => {
  it('true si hay no leida del tipo', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: { id: 'u1' } } });
    const data = [{ tipo: 'mora', leida: false }];
    const chain = chainSelect(data);
    vi.mocked(supabase.from).mockReturnValue(chain);
    chain.then = (res) => Promise.resolve({ data, error: null }).then(res);
    expect(await notifService.existeNoLeidaPorTipo('mora')).toBe(true);
    expect(await notifService.existeNoLeidaPorTipo('cobro')).toBe(false);
  });
});

describe('marcarLeida', () => {
  it('lanza si no user', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: null } });
    await expect(notifService.marcarLeida('id1')).rejects.toThrow('No authenticated user');
  });
  it('marca leida ok', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: { id: 'u1' } } });
    const updateChain = { update: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() };
    updateChain.update.mockReturnValue(updateChain);
    updateChain.eq.mockReturnValue(updateChain);
    updateChain.then = (res) => Promise.resolve({ error: null }).then(res);
    vi.mocked(supabase.from).mockReturnValue(updateChain);
    expect(await notifService.marcarLeida('id1')).toBe(true);
  });
});

describe('create / marcarTodasLeidas', () => {
  it('create inserta', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: { id: 'u1' } } });
    const data = { id: 'n1', tipo: 'mora' };
    const chain = { select: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data, error: null }), insert: vi.fn().mockReturnThis() };
    chain.insert.mockReturnValue(chain); chain.select.mockReturnValue(chain);
    vi.mocked(supabase.from).mockReturnValue(chain);
    const r = await notifService.create({ tipo: 'mora', titulo: 'T', mensaje: 'M' });
    expect(r.id).toBe('n1');
  });
  it('marcarTodasLeidas retorna count', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: { id: 'u1' } } });
    const data = [{ id: '1' }, { id: '2' }];
    const updChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
    };
    updChain.update.mockReturnValue(updChain);
    updChain.eq.mockReturnValue(updChain);
    updChain.select.mockReturnValue(updChain);
    updChain.then = (res) => Promise.resolve({ data, error: null }).then(res);
    vi.mocked(supabase.from).mockReturnValue(updChain);
    const r = await notifService.marcarTodasLeidas();
    expect(r).toBe(2);
  });
  it('marcarTodasLeidas 0 si no user', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: null } });
    expect(await notifService.marcarTodasLeidas()).toBe(0);
  });
});
