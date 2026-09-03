import { supabase, getOrgId } from '../lib/supabase';

export async function createInvite({ email, rol }) {
  const orgId = await getOrgId();
  const { data, error } = await supabase.rpc('create_invite', {
    p_org_id: orgId,
    p_email: String(email).trim().toLowerCase(),
    p_rol: rol,
  });
  if (error) throw error;
  return data;
}

export async function acceptInvite(token) {
  const { data, error } = await supabase.rpc('accept_invite', { p_token: token });
  if (error) throw error;
  return data; // org_id
}

export async function revokeInvite(inviteId) {
  const { error } = await supabase.rpc('revoke_invite', { p_invite_id: inviteId });
  if (error) throw error;
  return true;
}

export async function updateMemberRole(targetUserId, newRol) {
  const { error } = await supabase.rpc('update_member_role', {
    p_target_user_id: targetUserId,
    p_new_rol: newRol,
  });
  if (error) throw error;
  return true;
}

export async function removeMember(targetUserId) {
  const { error } = await supabase.rpc('remove_member', { p_target_user_id: targetUserId });
  if (error) throw error;
  return true;
}

export function buildInviteLink(token) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/invite/${token}`;
}
