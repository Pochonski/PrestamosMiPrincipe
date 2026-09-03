import { supabase, getOrgId } from '../lib/supabase';
import { throwIfError } from '../lib/supabase-errors';

export async function getMyOrganization() {
  const orgId = await getOrgId();
  const { data, error } = await supabase.from('organizations').select('*').eq('id', orgId).maybeSingle();
  throwIfError(error, 'organizations.getMy', { orgId });
  return data;
}

export async function updateOrganization(patch) {
  const orgId = await getOrgId();
  const payload = {
    ...(patch.nombre !== undefined ? { nombre: String(patch.nombre).trim() } : {}),
    ...(patch.slug !== undefined ? { slug: String(patch.slug).trim().toLowerCase() } : {}),
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from('organizations')
    .update(payload)
    .eq('id', orgId)
    .select()
    .single();
  throwIfError(error, 'organizations.update', { payload });
  return data;
}

export async function listMembers() {
  const orgId = await getOrgId();
  const { data, error } = await supabase.rpc('list_members', { p_org_id: orgId });
  if (error) throw error;
  return data ?? [];
}

export async function listInvites() {
  const orgId = await getOrgId();
  const { data, error } = await supabase.rpc('list_invites', { p_org_id: orgId });
  if (error) throw error;
  return data ?? [];
}
