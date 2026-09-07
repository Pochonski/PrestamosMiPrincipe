import { supabase } from '../lib/supabase';

export async function resumenTotales() {
  const { data, error } = await supabase.rpc('resumen_totales');
  if (error) throw error;
  return data ?? {};
}

export async function cobrosSerieDiaria(dias = 7) {
  const { data, error } = await supabase.rpc('cobros_serie_diaria', { p_dias: dias });
  if (error) throw error;
  return data ?? [];
}

export async function cobrosSerieMensual(meses = 6) {
  const { data, error } = await supabase.rpc('cobros_serie_mensual', { p_meses: meses });
  if (error) throw error;
  return data ?? [];
}