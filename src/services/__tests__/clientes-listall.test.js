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

const chain = (data, error = null) => {
  const base = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
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

describe('clientes.listAll pagina', () => {
  it('junta páginas hasta agotar', async () => {
    const p1 = [{ id: '1' }, { id: '2' }];
    const p2 = [{ id: '3' }];
    vi.mocked(supabase.from).mockImplementation(() => {
      const c = chain([]);
      c.range.mockImplementation((from) => {
        const rows = from === 0 ? p1 : p2;
        const next = chain(rows);
        return next;
      });
      return c;
    });
    const r = await clientesService.listAll({ pageSize: 2 });
    expect(r).toHaveLength(3);
  });
  it('una sola página corta', async () => {
    vi.mocked(supabase.from).mockReturnValue(chain([{ id: '1' }]));
    const r = await clientesService.listAll({ pageSize: 200 });
    expect(r).toHaveLength(1);
  });
});

describe('clientes.buscar escapa sintaxis or()', () => {
  it('coma y paréntesis no inyectan filtros', async () => {
    const m = chain([]);
    vi.mocked(supabase.from).mockReturnValue(m);
    await clientesService.buscar('a,cedula.eq.x');
    const arg = vi.mocked(m.or).mock.calls[0][0];
    // El input sanitizado no conserva el operador inyectado `cedula.eq`
    expect(arg).not.toContain('cedula.eq');
    expect(arg).toContain('acedulaeqx');
  });
  it('comillas y punto se eliminan', async () => {
    const m = chain([]);
    vi.mocked(supabase.from).mockReturnValue(m);
    await clientesService.buscar(`a"b'c.d`);
    expect(vi.mocked(m.or).mock.calls[0][0]).toContain('abcd');
  });
  it('query solo con separadores no llama or()', async () => {
    const m = chain([{ id: '1' }]);
    vi.mocked(supabase.from).mockReturnValue(m);
    const r = await clientesService.buscar(',,,');
    expect(m.or).not.toHaveBeenCalled();
    expect(r).toHaveLength(1);
  });
});
