import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/supabase', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getOrgId: vi.fn().mockResolvedValue('org-1'),
    supabase: { from: vi.fn(), rpc: vi.fn(), auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }), getSession: vi.fn() } },
  };
});

import * as organizations from '../organizations';
import { supabase } from '../../lib/supabase';
import { getOrgId } from '../../lib/supabase';

beforeEach(() => vi.clearAllMocks());

describe('organizations', () => {
  it('getMyOrganization', async () => {
    const chain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'org-1', nombre: 'X' }, error: null }) };
    chain.select.mockReturnValue(chain); chain.eq.mockReturnValue(chain);
    vi.mocked(supabase.from).mockReturnValue(chain);
    const r = await organizations.getMyOrganization();
    expect(r.nombre).toBe('X');
    expect(getOrgId).toHaveBeenCalled();
  });

  it('getMyOrganization error', async () => {
    const chain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: 'boom', code: 'x' } }) };
    chain.select.mockReturnValue(chain); chain.eq.mockReturnValue(chain);
    vi.mocked(supabase.from).mockReturnValue(chain);
    await expect(organizations.getMyOrganization()).rejects.toThrow('boom');
  });

  it('updateOrganization normaliza y llama update', async () => {
    const chain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'org-1', nombre: 'Nuevo', slug: 'nuevo' }, error: null }),
    };
    chain.update.mockReturnValue(chain); chain.eq.mockReturnValue(chain); chain.select.mockReturnValue(chain);
    vi.mocked(supabase.from).mockReturnValue(chain);
    const r = await organizations.updateOrganization({ nombre: '  Nuevo  ', slug: '  NUEVO-SLUG ' });
    expect(r.slug).toBe('nuevo');
    expect(r.nombre).toBe('Nuevo');
    expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ nombre: 'Nuevo', slug: 'nuevo-slug' }));
  });

  it('updateOrganization solo actualiza lo enviado', async () => {
    const chain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'org-1' }, error: null }),
    };
    chain.update.mockReturnValue(chain); chain.eq.mockReturnValue(chain); chain.select.mockReturnValue(chain);
    vi.mocked(supabase.from).mockReturnValue(chain);
    await organizations.updateOrganization({ nombre: 'SoloNombre' });
    const payload = chain.update.mock.calls[0][0];
    expect(payload.nombre).toBe('SoloNombre');
    expect(payload.slug).toBeUndefined();
    expect(payload.updated_at).toBeTruthy();
  });

  it('listMembers', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: [{ id: 'u1' }], error: null });
    const r = await organizations.listMembers();
    expect(r).toHaveLength(1);
    expect(supabase.rpc).toHaveBeenCalledWith('list_members', { p_org_id: 'org-1' });
  });

  it('listMembers error', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: 'boom' } });
    await expect(organizations.listMembers()).rejects.toThrow('boom');
  });

  it('listMembers null -> []', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null });
    const r = await organizations.listMembers();
    expect(r).toEqual([]);
  });

  it('listInvites', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: [{ id: 'i1' }], error: null });
    const r = await organizations.listInvites();
    expect(r).toHaveLength(1);
    expect(supabase.rpc).toHaveBeenCalledWith('list_invites', { p_org_id: 'org-1' });
  });

  it('listInvites error', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: 'boom' } });
    await expect(organizations.listInvites()).rejects.toThrow('boom');
  });

  it('listInvites null -> []', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null });
    const r = await organizations.listInvites();
    expect(r).toEqual([]);
  });
});