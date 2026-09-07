-- =====================================================================
-- Migración: extender_prestamo_cuotas sincroniza prestamos.n_cuotas en DB
-- Fecha: 2026-09-08
-- Problema: el RPC antiguo solo insertaba cuotas sin actualizar
-- prestamos.n_cuotas. La DB quedaba inconsistente: la próxima extensión
-- reutilizaba números (choque unique(prestamo_id, numero)) y la UI mostraba
-- un total distinto al real. Además no bloqueaba a viewers.
-- Fix: incrementa n_cuotas + updated_at y bloquea rol viewer.
-- Aplicar en: Supabase Dashboard → SQL Editor → pegar → Run
-- =====================================================================

create or replace function public.extender_prestamo_cuotas(
  p_prestamo_id uuid,
  p_nuevas_cuotas jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_count int;
begin
  select p.org_id into v_org_id
    from public.prestamos p
   where p.id = p_prestamo_id;
  if v_org_id is null then
    raise exception 'Préstamo no encontrado';
  end if;
  if not public.is_org_member(v_org_id) then
    raise exception 'No autorizado';
  end if;
  if public.my_role(v_org_id) = 'viewer' then
    raise exception 'Viewers no pueden extender préstamos';
  end if;

  v_count := coalesce(jsonb_array_length(p_nuevas_cuotas), 0);

  insert into public.cuotas (prestamo_id, numero, fecha, monto)
  select p_prestamo_id,
         (c->>'numero')::int,
         (c->>'fecha')::date,
         (c->>'monto')::numeric
    from jsonb_array_elements(p_nuevas_cuotas) c;

  -- Sincronizar el préstamo en la DB (antes solo se reflejaba en memoria).
  update public.prestamos
     set n_cuotas = n_cuotas + v_count,
         estado = case when estado = 'cancelado' then 'vigente' else estado end,
         updated_at = now()
   where id = p_prestamo_id;
end;
$$;

grant execute on function public.extender_prestamo_cuotas(uuid, jsonb)
  to authenticated;
