import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/supabase', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getOrgId: vi.fn().mockResolvedValue('org-1'),
    supabase: { from: vi.fn(), rpc: vi.fn(), auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }), getSession: vi.fn() } },
  };
});

import * as invites from '../invites';
import { supabase } from '../../lib/supabase';

beforeEach(() => vi.clearAllMocks());

describe('invites', () => {
  it('createInvite normaliza email y llama rpc', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: 'ok', error: null });
    const r = await invites.createInvite({ email: '  User@X.com ', rol: 'admin' });
    expect(r).toBe('ok');
    expect(supabase.rpc).toHaveBeenCalledWith('create_invite', {
      p_org_id: 'org-1',
      p_email: 'user@x.com',
      p_rol: 'admin',
    });
  });

  it('createInvite relanza error', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: 'xpr' } });
    await expect(invites.createInvite({ email: 'a@b.c', rol: 'miembro' })).rejects.toThrow('xpr');
  });

  it('acceptInvite', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: 'org-9', error: null });
    const r = await invites.acceptInvite('tok');
    expect(r).toBe('org-9');
    expect(supabase.rpc).toHaveBeenCalledWith('accept_invite', { p_token: 'tok' });
  });

  it('acceptInvite error', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: 'bad token' } });
    await expect(invites.acceptInvite('tok')).rejects.toThrow('bad token');
  });

  it('revokeInvite', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null });
    const r = await invites.revokeInvite('inv-1');
    expect(r).toBe(true);
    expect(supabase.rpc).toHaveBeenCalledWith('revoke_invite', { p_invite_id: 'inv-1' });
  });

  it('revokeInvite error', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: 'nope' } });
    await expect(invites.revokeInvite('inv-1')).rejects.toThrow('nope');
  });

  it('updateMemberRole', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null });
    const r = await invites.updateMemberRole('u-2', 'admin');
    expect(r).toBe(true);
    expect(supabase.rpc).toHaveBeenCalledWith('update_member_role', { p_target_user_id: 'u-2', p_new_rol: 'admin' });
  });

  it('updateMemberRole error', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: 'permiso' } });
    await expect(invites.updateMemberRole('u-2', 'admin')).rejects.toThrow('permiso');
  });

  it('removeMember', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null });
    const r = await invites.removeMember('u-2');
    expect(r).toBe(true);
    expect(supabase.rpc).toHaveBeenCalledWith('remove_member', { p_target_user_id: 'u-2' });
  });

  it('removeMember error', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: 'no existe' } });
    await expect(invites.removeMember('u-2')).rejects.toThrow('no existe');
  });

  it('buildInviteLink con slug', () => {
    expect(invites.buildInviteLink('tok', 'mi-org')).toContain('/mi-org/invite/tok');
  });

  it('buildInviteLink sin slug', () => {
    expect(invites.buildInviteLink('tok')).toContain('/invite/tok');
  });

  it('buildInviteLink con window origin', () => {
    const prev = window.location;
    Object.defineProperty(window, 'location', {
      value: { origin: 'https://app.example.com' },
      configurable: true,
    });
    try {
      expect(invites.buildInviteLink('tok', 'slug-x')).toBe('https://app.example.com/slug-x/invite/tok');
    } finally {
      Object.defineProperty(window, 'location', { value: prev, configurable: true });
    }
  });
});