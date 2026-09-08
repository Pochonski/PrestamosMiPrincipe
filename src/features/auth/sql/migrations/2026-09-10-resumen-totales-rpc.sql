-- =====================================================================
-- Migración: RPC de totales para reducir egress
-- Fecha: 2026-09-10
--
-- APLICAR EN: Supabase Dashboard → SQL Editor → New query → Pegar → Run
-- =====================================================================
-- PROBLEMA: el dashboard/resumen descargaban tablas completas (prestamos,
-- cuotas, cobros, clientes) con SELECT * y listAll para calcular totales
-- en el cliente, causando egress desbordado (235%).
--
-- SOLUCIÓN: este RPC calcula en el servidor los totales que el dashboard
-- y el resumen muestran, y devuelve una única fila JSON (bytes, no MB).
--
-- Los cobros "ahora/ayer" se calculan en UTC porque las fechas de cobros
-- se guardan como timestamptz; el cliente sigue siendo dueño de la
-- presentación local del delta, si aplica.
-- =====================================================================

-- ---------------------------------------------------------------------
-- resumen_totales()
-- Devuelve un jsonb con los totales de la organización del usuario:
--   totalClientes, prestamosActivos, carteraTotal, totalAtrasado,
--   cantidadAtrasados, totalCobrarHoy, cantidadCobrarHoy,
--   totalCobradoHoy, cantidadCobradoHoy, cobrosMes, cobrosPrevMes
-- ---------------------------------------------------------------------
create or replace function public.resumen_totales()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_hoy date := current_date;
  v_result jsonb;
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

  select jsonb_build_object(
    'totalClientes',      (select count(*) from public.clientes where org_id = v_org_id),
    'prestamosActivos',   (select count(*) from public.prestamos
                            where org_id = v_org_id and estado <> 'cancelado'),
    'carteraTotal',       (select coalesce(sum(saldo_capital), 0) from public.prestamos
                            where org_id = v_org_id and estado <> 'cancelado'),
    'totalAtrasado',      (select coalesce(sum(c.monto), 0)
                            from public.cuotas c
                            join public.prestamos p on p.id = c.prestamo_id
                            where p.org_id = v_org_id
                              and c.estado = 'pendiente'
                              and c.fecha < v_hoy),
    'cantidadAtrasados',  (select count(distinct p.id)
                            from public.cuotas c
                            join public.prestamos p on p.id = c.prestamo_id
                            where p.org_id = v_org_id
                              and c.estado = 'pendiente'
                              and c.fecha < v_hoy),
    'totalCobrarHoy',     (select coalesce(sum(c.monto), 0)
                            from public.cuotas c
                            join public.prestamos p on p.id = c.prestamo_id
                            where p.org_id = v_org_id
                              and c.estado = 'pendiente'
                              and c.fecha = v_hoy),
    'cantidadCobrarHoy',  (select count(*)
                            from public.cuotas c
                            join public.prestamos p on p.id = c.prestamo_id
                            where p.org_id = v_org_id
                              and c.estado = 'pendiente'
                              and c.fecha = v_hoy),
    'totalCobradoHoy',    (select coalesce(sum(monto), 0)
                            from public.cobros
                            where org_id = v_org_id
                              and fecha >= v_hoy
                              and fecha < v_hoy + interval '1 day'),
    'cantidadCobradoHoy', (select count(*)
                            from public.cobros
                            where org_id = v_org_id
                              and fecha >= v_hoy
                              and fecha < v_hoy + interval '1 day'),
    'cobrosMes',          (select coalesce(sum(monto), 0)
                            from public.cobros
                            where org_id = v_org_id
                              and fecha >= date_trunc('month', v_hoy)),
    'cobrosPrevMes',      (select coalesce(sum(monto), 0)
                            from public.cobros
                            where org_id = v_org_id
                              and fecha >= date_trunc('month', v_hoy) - interval '1 month'
                              and fecha < date_trunc('month', v_hoy))
  ) into v_result;

  return v_result;
end;
$$;

grant execute on function public.resumen_totales() to authenticated;

-- ---------------------------------------------------------------------
-- cobros_serie_diaria(p_dias int default 7)
-- Devuelve la suma de cobros por día de los últimos N días de la org
-- del usuario. Se usa para los sparklines (7 días) del dashboard sin
-- descargar la tabla de cobros completa.
-- ---------------------------------------------------------------------
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
    select (fecha at time zone 'UTC')::date as fecha, coalesce(sum(monto), 0) as total
      from public.cobros
     where org_id = v_org_id
       and fecha >= current_date - (greatest(1, p_dias) - 1)
     group by (fecha at time zone 'UTC')::date
     order by fecha asc;
end;
$$;

grant execute on function public.cobros_serie_diaria(int) to authenticated;

-- ---------------------------------------------------------------------
-- cobros_serie_mensual(p_meses int default 6)
-- Devuelve la suma de cobros por mes de los últimos N meses de la org
-- del usuario. Se usa para el chart "cobros 6 meses" del dashboard.
-- ---------------------------------------------------------------------
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
    select date_trunc('month', fecha at time zone 'UTC')::date as mes,
           coalesce(sum(monto), 0) as total
      from public.cobros
     where org_id = v_org_id
       and fecha >= date_trunc('month', current_date) - (greatest(1, p_meses) - 1) * interval '1 month'
     group by date_trunc('month', fecha at time zone 'UTC')::date
     order by mes asc;
end;
$$;

grant execute on function public.cobros_serie_mensual(int) to authenticated;