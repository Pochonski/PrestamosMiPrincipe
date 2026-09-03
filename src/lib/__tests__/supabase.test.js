import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: vi.fn() },
    from: vi.fn(),
  })),
}));

import { supabase, getOrgId, invalidateOrgCache } from '../supabase';

beforeEach(() => {
  invalidateOrgCache();
  vi.clearAllMocks();
});

describe('getOrgId', () => {
  it('lanza si no user', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: null } });
    await expect(getOrgId()).rejects.toThrow('No authenticated user');
  });
  it('lanza si no membership', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: { id: 'u1' } } });
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const chain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle };
    chain.select.mockReturnValue(chain); chain.eq.mockReturnValue(chain);
    vi.mocked(supabase.from).mockReturnValue(chain);
    await expect(getOrgId()).rejects.toThrow('User has no organization');
  });
  it('retorna org_id y cachea', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: { id: 'u1' } } });
    const maybeSingle = vi.fn().mockResolvedValue({ data: { org_id: 'org-1' }, error: null });
    const chain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle };
    chain.select.mockReturnValue(chain); chain.eq.mockReturnValue(chain);
    vi.mocked(supabase.from).mockReturnValue(chain);
    const r1 = await getOrgId();
    expect(r1).toBe('org-1');
    const r2 = await getOrgId();
    expect(r2).toBe('org-1');
    expect(maybeSingle).toHaveBeenCalledTimes(1);
  });
  it('invalidateOrgCache fuerza refetch', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: { id: 'u1' } } });
    const maybeSingle = vi.fn().mockResolvedValue({ data: { org_id: 'org-2' }, error: null });
    const chain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle };
    chain.select.mockReturnValue(chain); chain.eq.mockReturnValue(chain);
    vi.mocked(supabase.from).mockReturnValue(chain);
    await getOrgId();
    invalidateOrgCache();
    await getOrgId();
    expect(maybeSingle).toHaveBeenCalledTimes(2);
  });
  it('propaga error supabase', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: { id: 'u1' } } });
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: new Error('db fail') });
    const chain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle };
    chain.select.mockReturnValue(chain); chain.eq.mockReturnValue(chain);
    vi.mocked(supabase.from).mockReturnValue(chain);
    await expect(getOrgId()).rejects.toThrow('db fail');
  });
});
