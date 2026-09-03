-- =====================================================================
-- Fix: create_cobro_with_updates referenciaba cuotas.cobro_id (columna
-- inexistente). Esta versión reemplaza el RPC en el remote DB.
-- =====================================================================
-- APLICAR EN: Supabase Dashboard → SQL Editor → New query → Pegar → Run
-- =====================================================================

create or replace function public.create_cobro_with_updates(
  p_prestamo_id uuid,
  p_cuota_numero int,
  p_monto numeric,
  p_tipo text,
  p_incluir_interes boolean,
  p_nota text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_cuota record;
  v_prestamo record;
  v_interes_periodo numeric;
  v_capital_pagado numeric := 0;
  v_interes_pagado numeric := 0;
  v_nuevo_saldo numeric;
  v_cobro_id uuid;
  v_user_id uuid;
  v_atrasadas int;
  v_todas_cerradas boolean;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_prestamo
    from public.prestamos
   where id = p_prestamo_id
   for update;
  if v_prestamo.id is null then
    raise exception 'Préstamo no encontrado';
  end if;
  v_org_id := v_prestamo.org_id;
  if not public.is_org_member(v_org_id) then
    raise exception 'No autorizado';
  end if;

  if p_tipo = 'interes' then
    v_interes_periodo := round((v_prestamo.saldo_capital * v_prestamo.tasa) / 100);
    if p_monto < v_interes_periodo then
      raise exception 'monto menor que interés del período (%)', v_interes_periodo;
    end if;
    v_interes_pagado := p_monto;
    v_capital_pagado := 0;
  elsif p_tipo = 'capital' then
    select * into v_cuota
      from public.cuotas
     where prestamo_id = p_prestamo_id and numero = p_cuota_numero
     for update;
    if v_cuota.id is null then
      raise exception 'Cuota % no existe', p_cuota_numero;
    end if;
    if v_cuota.estado <> 'pendiente' then
      raise exception 'Cuota % not pending', p_cuota_numero;
    end if;

    select count(*) into v_atrasadas
      from public.cuotas
     where prestamo_id = p_prestamo_id
       and estado = 'pendiente'
       and fecha < current_date;
    if v_atrasadas > 0 then
      raise exception 'Hay % intereses atrasados. Pagalos antes de abonar a capital', v_atrasadas;
    end if;

    select bool_and(estado in ('pagada','cancelada')) into v_todas_cerradas
      from public.cuotas
     where prestamo_id = p_prestamo_id;
    if v_todas_cerradas and v_prestamo.saldo_capital > 0 then
      raise exception 'Cuotas agotadas pero queda saldo pendiente';
    end if;

    v_interes_periodo := round((v_prestamo.saldo_capital * v_prestamo.tasa) / 100);
    if p_incluir_interes then
      v_interes_pagado := least(p_monto, v_interes_periodo);
      v_capital_pagado := greatest(0, p_monto - v_interes_periodo);
    else
      v_capital_pagado := p_monto;
    end if;
  else
    raise exception 'Tipo de cobro inválido: %', p_tipo;
  end if;

  v_nuevo_saldo := greatest(0, v_prestamo.saldo_capital - v_capital_pagado);

  insert into public.cobros (
    org_id, prestamo_id, cliente_id, cuota_numero, monto, tipo,
    incluir_interes, capital_pagado, interes_pagado, cobrador_id, nota
  ) values (
    v_org_id, p_prestamo_id, v_prestamo.cliente_id, p_cuota_numero, p_monto, p_tipo,
    coalesce(p_incluir_interes, false), v_capital_pagado, v_interes_pagado,
    v_user_id, p_nota
  )
  returning id into v_cobro_id;

  if p_tipo = 'interes' and p_cuota_numero is not null then
    update public.cuotas
       set estado = 'pagada', pagada_en = now()
     where prestamo_id = p_prestamo_id and numero = p_cuota_numero;
  elsif p_tipo = 'capital' then
    update public.cuotas
       set estado = 'pagada', pagada_en = now()
     where prestamo_id = p_prestamo_id and numero = p_cuota_numero;
    update public.prestamos
       set saldo_capital = v_nuevo_saldo,
           estado = case when v_nuevo_saldo = 0 then 'cancelado' else estado end,
           updated_at = now()
     where id = p_prestamo_id;
  end if;

  return v_cobro_id;
end;
$$;

grant execute on function public.create_cobro_with_updates(
  uuid, int, numeric, text, boolean, text
) to authenticated;
