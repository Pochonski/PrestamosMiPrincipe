-- =====================================================================
-- Migración: RPC update_prestamo_with_cuotas para recálculo de cuotas
-- Fecha: 2026-09-07
-- Recalcula cuotas pendientes al editar monto/tasa/nCuotas/periodo/fechaInicio.
-- Preserva cuotas pagadas/canceladas y el capital ya abonado.
-- =====================================================================

create or replace function public.update_prestamo_with_cuotas(
  p_prestamo_id uuid,
  p_ruta text,
  p_periodo jsonb,
  p_monto numeric,
  p_tasa numeric,
  p_n_cuotas int,
  p_fecha_inicio date,
  p_cuotas jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_org_id uuid;
  v_prestamo record;
  v_paid numeric;
  v_new_saldo numeric;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_prestamo from public.prestamos where id = p_prestamo_id for update;
  if v_prestamo.id is null then
    raise exception 'Préstamo no encontrado';
  end if;
  v_org_id := v_prestamo.org_id;
  if not public.is_org_member(v_org_id) then
    raise exception 'No autorizado';
  end if;
  if public.my_role(v_org_id) = 'viewer' then
    raise exception 'Viewers no pueden editar préstamos';
  end if;

  -- Preservar capital abonado
  v_paid := coalesce(v_prestamo.monto, 0) - coalesce(v_prestamo.saldo_capital, 0);
  if v_paid < 0 then v_paid := 0; end if;
  v_new_saldo := p_monto - v_paid;
  if v_new_saldo < 0 then v_new_saldo := 0; end if;

  update public.prestamos set
    ruta = p_ruta,
    periodo = p_periodo,
    monto = p_monto,
    saldo_capital = v_new_saldo,
    tasa = p_tasa,
    n_cuotas = p_n_cuotas,
    fecha_inicio = p_fecha_inicio,
    estado = case
      when v_new_saldo = 0 then 'cancelado'
      when v_prestamo.estado = 'cancelado' and v_new_saldo > 0 then 'vigente'
      else v_prestamo.estado
    end,
    updated_at = now()
  where id = p_prestamo_id;

  -- Borrar solo pendientes, preservar pagadas/canceladas
  delete from public.cuotas where prestamo_id = p_prestamo_id and estado = 'pendiente';

  -- Insertar nuevas pendientes
  if p_cuotas is not null and jsonb_array_length(p_cuotas) > 0 then
    insert into public.cuotas (prestamo_id, numero, fecha, monto)
    select p_prestamo_id,
           (c->>'numero')::int,
           (c->>'fecha')::date,
           (c->>'monto')::numeric
      from jsonb_array_elements(p_cuotas) c;
  end if;

  return p_prestamo_id;
end;
$$;

grant execute on function public.update_prestamo_with_cuotas(uuid, text, jsonb, numeric, numeric, int, date, jsonb) to authenticated;