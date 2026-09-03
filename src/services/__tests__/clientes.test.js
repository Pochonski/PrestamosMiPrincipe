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
import { supabase, getOrgId } from '../../lib/supabase';
import { emitDataChanged } from '../../lib/events';

const chain = (data, error = null) => {
  const base = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
  };
  base.then = (resolve) => Promise.resolve({ data, error }).then(resolve);
  base.range.mockReturnValue(base);
  return base;
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getOrgId).mockResolvedValue('org-1');
});

describe('clientes.buscar sanitiza', () => {
  it('sin query retorna todos', async () => {
    const data = [{ id: '1', nombre: 'Ana' }];
    vi.mocked(supabase.from).mockReturnValue(chain(data));
    const r = await clientesService.buscar('');
    expect(r).toEqual(data);
    expect(supabase.from).toHaveBeenCalledWith('clientes');
  });
  it('query con %_,\\ sanitiza antes de or', async () => {
    const m = chain([]);
    vi.mocked(supabase.from).mockReturnValue(m);
    await clientesService.buscar('a%b_c\\d');
    expect(m.or).toHaveBeenCalledWith(expect.stringContaining('abcd'));
    // el % del ilike es wildcard, pero los caracteres del input deben estar sanitizados
    const arg = m.or.mock.calls[0][0];
    expect(arg).not.toContain('a%b');
  });
});

describe('clientes.list / getById', () => {
  it('list retorna data', async () => {
    const data = [{ id: '1' }];
    const c = chain(data);
    vi.mocked(supabase.from).mockReturnValue(c);
    expect(await clientesService.list()).toEqual(data);
  });
  it('getById retorna data', async () => {
    const data = { id: '1', nombre: 'Ana' };
    const c = chain(data);
    vi.mocked(supabase.from).mockReturnValue(c);
    expect(await clientesService.getById('1')).toEqual(data);
  });
  it('list throw si error', async () => {
    const c = chain(null, new Error('fail'));
    vi.mocked(supabase.from).mockReturnValue(c);
    await expect(clientesService.list()).rejects.toThrow('fail');
  });
});

describe('clientes.remove bloquea con préstamos activos', () => {
  it('lanza ClienteTienePrestamosError si tiene activos', async () => {
    const prestamos = [{ id: 'p1', estado: 'vigente' }];
    const emptyChain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() };
    emptyChain.then = (res) => Promise.resolve({ data: prestamos, error: null }).then(res);
    emptyChain.select.mockReturnValue(emptyChain); emptyChain.eq.mockReturnValue(emptyChain);
    vi.mocked(supabase.from).mockReturnValue(emptyChain);
    await expect(clientesService.remove('cli-1')).rejects.toHaveProperty('name', 'ClienteTienePrestamosError');
  });
  it('permite borrar si no tiene activos', async () => {
    const emptyPrestamos = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() };
    emptyPrestamos.then = (res) => Promise.resolve({ data: [], error: null }).then(res);
    emptyPrestamos.select.mockReturnValue(emptyPrestamos); emptyPrestamos.eq.mockReturnValue(emptyPrestamos);
    const deleteChain = { delete: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() };
    deleteChain.then = (res) => Promise.resolve({ error: null }).then(res);
    deleteChain.delete.mockReturnValue(deleteChain); deleteChain.eq.mockReturnValue(deleteChain);
    let call = 0;
    vi.mocked(supabase.from).mockImplementation(() => {
      call++;
      return call === 1 ? emptyPrestamos : deleteChain;
    });
    const r = await clientesService.remove('cli-1');
    expect(r).toBe(true);
    expect(emitDataChanged).toHaveBeenCalled();
  });
});

describe('clientes.create emite evento', () => {
  it('create inserta y emite', async () => {
    const inserted = { id: 'new', nombre: 'Juan' };
    const insertChain = {
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: inserted, error: null }),
      insert: vi.fn().mockReturnThis(),
    };
    insertChain.insert.mockReturnValue(insertChain);
    insertChain.select.mockReturnValue(insertChain);
    vi.mocked(supabase.from).mockReturnValue(insertChain);
    const r = await clientesService.create({ nombre: ' Juan ', cedula: '1-1', telefono: '8888', direccion: 'dir' });
    expect(r).toEqual(inserted);
    expect(vi.mocked(emitDataChanged)).toHaveBeenCalled();
  });
});
