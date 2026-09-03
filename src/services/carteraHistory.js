import { supabase } from '../lib/supabase';

export async function snapshot() {
  const { data, error } = await supabase.rpc('snapshot_cartera');
  if (error) throw error;
  return data;
}

export async function history(days = 30) {
  const { data, error } = await supabase.rpc('list_cartera_history', { p_days: days });
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}