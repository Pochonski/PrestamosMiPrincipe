-- =====================================================================
-- Fix: columnas ambiguas (error 42702) en series del dashboard
-- =====================================================================
-- APLICAR EN: Supabase Dashboard → SQL Editor → New query → Pegar → Run
--
-- CAUSA: cobros_serie_diaria y cobros_serie_mensual declaran
-- RETURNS TABLE (fecha/mes ...) y dentro del cuerpo referencian las
-- columnas sin calificar. PL/pgSQL no distingue el parámetro OUT de la
-- columna y PostgREST devuelve 400 con error=42702.
-- FIX: calificar todas las columnas con alias (c.) y ordenar por posición.
-- =====================================================================

create or replace function public.cobros_serie_diaria(p_dias int default 7)
returns table (fecha date, total numeric)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select org_id into v_org_id
    from public.org_members
   where user_id = auth.uid()
   limit 1;
  if v_org_id is null then
    raise exception 'User has no organization';
  end if;

  return query
    select (c.fecha at time zone 'UTC')::date as fecha, coalesce(sum(c.monto), 0) as total
      from public.cobros c
     where c.org_id = v_org_id
       and c.fecha >= current_date - (greatest(1, p_dias) - 1)
     group by (c.fecha at time zone 'UTC')::date
     order by 1;
end;
$$;

grant execute on function public.cobros_serie_diaria(int) to authenticated;

create or replace function public.cobros_serie_mensual(p_meses int default 6)
returns table (mes date, total numeric)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select org_id into v_org_id
    from public.org_members
   where user_id = auth.uid()
   limit 1;
  if v_org_id is null then
    raise exception 'User has no organization';
  end if;

  return query
    select date_trunc('month', c.fecha at time zone 'UTC')::date as mes,
           coalesce(sum(c.monto), 0) as total
      from public.cobros c
     where c.org_id = v_org_id
       and c.fecha >= date_trunc('month', current_date) - (greatest(1, p_meses) - 1) * interval '1 month'
     group by date_trunc('month', c.fecha at time zone 'UTC')::date
     order by 1;
end;
$$;

grant execute on function public.cobros_serie_mensual(int) to authenticated;
