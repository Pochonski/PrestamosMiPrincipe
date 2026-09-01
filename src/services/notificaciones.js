import { supabase, getOrgId } from '../lib/supabase';

export async function list() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('notificaciones')
    .select('*')
    .eq('user_id', user.id)
    .order('fecha', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function noLeidas() {
  const all = await list();
  return all.filter((n) => !n.leida);
}

export async function countNoLeidas() {
  const items = await noLeidas();
  return items.length;
}

export async function existeNoLeidaPorTipo(tipo) {
  const items = await list();
  return items.some((n) => n.tipo === tipo && !n.leida);
}

export async function create({ tipo, titulo, mensaje, leida = false }) {
  const orgId = await getOrgId();
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('notificaciones')
    .insert({
      org_id: orgId,
      user_id: user.id,
      tipo,
      titulo,
      mensaje,
      leida: Boolean(leida),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function marcarLeida(id) {
  const { error } = await supabase
    .from('notificaciones')
    .update({ leida: true })
    .eq('id', id);
  if (error) throw error;
  return true;
}

export async function marcarTodasLeidas() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;
  const { data, error } = await supabase
    .from('notificaciones')
    .update({ leida: true })
    .eq('user_id', user.id)
    .eq('leida', false)
    .select();
  if (error) throw error;
  return (data ?? []).length;
}