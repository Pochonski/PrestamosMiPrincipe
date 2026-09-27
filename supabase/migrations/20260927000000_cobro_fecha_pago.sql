-- =====================================================================
-- Préstamos Mi Príncipe — Cobro con fecha de pago personalizada
-- =====================================================================
-- 1) cobros.created_at para orden de registro (reportes siguen por fecha,
--    que pasa a ser la fecha de negocio = fecha de pago real).
-- 2) create/update_last aceptan p_fecha (solo pasado + hoy).
-- 3) Recálculo de cuotas por numero > cuota (no por current_date) para
--    que los retroactivos recalculen bien.
-- 4) Al liquidar (saldo 0) se cancelan las pendientes restantes.
-- 5) "Último cobro" se define por created_at (orden de registro), no por
--    fecha de pago, para que un retroactivo no bloquee ediciones.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0) created_at
-- ---------------------------------------------------------------------
alter table public.cobros
  add column if not exists created_at timestamptz not null default now();

update public.cobros set created_at = fecha where created_at is null;

create index if not exists idx_cobros_created
  on public.cobros (prestamo_id, created_at desc);

-- ---------------------------------------------------------------------
-- 1) create_cobro_with_updates (+ p_fecha)
-- ---------------------------------------------------------------------
create or replace function public.create_cobro_with_updates(
  p_prestamo_id uuid,
  p_cuota_numero int,
  p_monto numeric,
  p_tipo text,
  p_incluir_interes boolean,
  p_nota text,
  p_fecha timestamptz default null
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
  v_todas_cerradas boolean;
  v_fecha timestamptz;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Solo pasado + hoy (tolerancia de 1 día por zona horaria del cliente).
  v_fecha := coalesce(p_fecha, now());
  if v_fecha > now() + interval '1 day' then
    raise exception 'fecha futura no permitida';
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
    incluir_interes, capital_pagado, interes_pagado, cobrador_id, nota,
    fecha
  ) values (
    v_org_id, p_prestamo_id, v_prestamo.cliente_id, p_cuota_numero, p_monto, p_tipo,
    coalesce(p_incluir_interes, false), v_capital_pagado, v_interes_pagado,
    v_user_id, p_nota, v_fecha
  )
  returning id into v_cobro_id;

  if p_tipo = 'interes' and p_cuota_numero is not null then
    update public.cuotas
       set estado = 'pagada', pagada_en = v_fecha
     where prestamo_id = p_prestamo_id and numero = p_cuota_numero;
  elsif p_tipo = 'capital' then
    update public.cuotas
       set estado = 'pagada', pagada_en = v_fecha
     where prestamo_id = p_prestamo_id and numero = p_cuota_numero;
    update public.prestamos
       set saldo_capital = v_nuevo_saldo,
           estado = case when v_nuevo_saldo = 0 then 'cancelado' else estado end,
           updated_at = now()
     where id = p_prestamo_id;

    if v_nuevo_saldo = 0 then
      -- Liquidado: las cuotas de adelante se eliminan (cancelada) porque
      -- ya no hay nada que cobrar. Debe 4, paga 1, liquida -> debe 0.
      update public.cuotas
         set estado = 'cancelada'
       where prestamo_id = p_prestamo_id
         and estado = 'pendiente'
         and numero <> p_cuota_numero;
    else
      -- Abono parcial: recalcular las de adelante con el nuevo saldo.
      -- Por numero (no por current_date) para que los retroactivos
      -- recalculen bien y las atrasadas conserven su monto.
      update public.cuotas
         set monto = round((v_nuevo_saldo * v_prestamo.tasa) / 100)
       where prestamo_id = p_prestamo_id
         and estado = 'pendiente'
         and numero > p_cuota_numero;
    end if;
  end if;

  return v_cobro_id;
end;
$$;

grant execute on function public.create_cobro_with_updates(
  uuid, int, numeric, text, boolean, text, timestamptz
) to authenticated;

-- ---------------------------------------------------------------------
-- 2) delete_last_cobro (último por created_at + reapertura al revertir)
-- ---------------------------------------------------------------------
create or replace function public.delete_last_cobro(
  p_cobro_id uuid
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cobro record;
  v_prestamo record;
  v_nuevo_saldo numeric;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_cobro
    from public.cobros
   where id = p_cobro_id
   for update;
  if v_cobro.id is null then
    raise exception 'Cobro no encontrado';
  end if;
  if not public.is_org_member(v_cobro.org_id) then
    raise exception 'No autorizado';
  end if;

  -- Solo el último cobro REGISTRADO puede eliminarse.
  if exists (
    select 1 from public.cobros
     where prestamo_id = v_cobro.prestamo_id
       and (
         created_at > v_cobro.created_at
         or (created_at = v_cobro.created_at and fecha > v_cobro.fecha)
         or (created_at = v_cobro.created_at and fecha = v_cobro.fecha and id > v_cobro.id)
       )
  ) then
    raise exception 'Solo se puede eliminar el último cobro del préstamo';
  end if;

  select * into v_prestamo
    from public.prestamos
   where id = v_cobro.prestamo_id
   for update;
  if v_prestamo.id is null then
    raise exception 'Préstamo no encontrado';
  end if;

  update public.cuotas
     set estado = 'pendiente', pagada_en = null
   where prestamo_id = v_cobro.prestamo_id
     and numero = v_cobro.cuota_numero;

  if v_cobro.tipo = 'capital' then
    v_nuevo_saldo := v_prestamo.saldo_capital + coalesce(v_cobro.capital_pagado, 0);
    update public.prestamos
       set saldo_capital = v_nuevo_saldo,
           estado = case when estado = 'cancelado' and v_nuevo_saldo > 0
                         then 'vigente' else estado end,
           updated_at = now()
     where id = v_cobro.prestamo_id;

    -- Si el cobro había liquidado (y por tanto cancelado las de adelante),
    -- reabrirlas como pendientes al revertir.
    update public.cuotas
       set estado = 'pendiente'
     where prestamo_id = v_cobro.prestamo_id
       and estado = 'cancelada'
       and numero > v_cobro.cuota_numero;

    update public.cuotas
       set monto = round((v_nuevo_saldo * v_prestamo.tasa) / 100)
     where prestamo_id = v_cobro.prestamo_id
       and estado = 'pendiente'
       and numero > v_cobro.cuota_numero;
  else
    v_nuevo_saldo := v_prestamo.saldo_capital;
  end if;

  delete from public.cobros where id = p_cobro_id;

  return v_cobro.prestamo_id;
end;
$$;

grant execute on function public.delete_last_cobro(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 3) update_last_cobro (+ p_fecha, recalc por numero, cancela al liquidar)
-- ---------------------------------------------------------------------
create or replace function public.update_last_cobro(
  p_cobro_id uuid,
  p_cuota_numero int,
  p_monto numeric,
  p_tipo text,
  p_incluir_interes boolean,
  p_nota text,
  p_fecha timestamptz default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cobro record;
  v_prestamo record;
  v_nueva_cuota record;
  v_base_saldo numeric;
  v_interes_periodo numeric;
  v_capital_pagado numeric := 0;
  v_interes_pagado numeric := 0;
  v_nuevo_saldo numeric;
  v_todas_cerradas boolean;
  v_fecha timestamptz;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  v_fecha := coalesce(p_fecha, now());
  if v_fecha > now() + interval '1 day' then
    raise exception 'fecha futura no permitida';
  end if;

  select * into v_cobro
    from public.cobros
   where id = p_cobro_id
   for update;
  if v_cobro.id is null then
    raise exception 'Cobro no encontrado';
  end if;
  if not public.is_org_member(v_cobro.org_id) then
    raise exception 'No autorizado';
  end if;

  if exists (
    select 1 from public.cobros
     where prestamo_id = v_cobro.prestamo_id
       and (
         created_at > v_cobro.created_at
         or (created_at = v_cobro.created_at and fecha > v_cobro.fecha)
         or (created_at = v_cobro.created_at and fecha = v_cobro.fecha and id > v_cobro.id)
       )
  ) then
    raise exception 'Solo se puede editar el último cobro del préstamo';
  end if;

  select * into v_prestamo
    from public.prestamos
   where id = v_cobro.prestamo_id
   for update;
  if v_prestamo.id is null then
    raise exception 'Préstamo no encontrado';
  end if;

  -- Paso 1: revertir efectos del cobro viejo.
  update public.cuotas
     set estado = 'pendiente', pagada_en = null
   where prestamo_id = v_cobro.prestamo_id
     and numero = v_cobro.cuota_numero;

  if v_cobro.tipo = 'capital' then
    v_base_saldo := v_prestamo.saldo_capital + coalesce(v_cobro.capital_pagado, 0);
    -- Si el cobro viejo había liquidado, reabrir las canceladas.
    update public.cuotas
       set estado = 'pendiente'
     where prestamo_id = v_cobro.prestamo_id
       and estado = 'cancelada'
       and numero > v_cobro.cuota_numero;
  else
    v_base_saldo := v_prestamo.saldo_capital;
  end if;

  -- Paso 2: validar y calcular el cobro nuevo sobre el saldo base.
  if p_tipo = 'interes' then
    v_interes_periodo := round((v_base_saldo * v_prestamo.tasa) / 100);
    if p_monto < v_interes_periodo then
      raise exception 'monto menor que interés del período (%)', v_interes_periodo;
    end if;
    v_interes_pagado := p_monto;
    v_capital_pagado := 0;
  elsif p_tipo = 'capital' then
    select * into v_nueva_cuota
      from public.cuotas
     where prestamo_id = v_cobro.prestamo_id and numero = p_cuota_numero
     for update;
    if v_nueva_cuota.id is null then
      raise exception 'Cuota % no existe', p_cuota_numero;
    end if;
    if v_nueva_cuota.estado <> 'pendiente' then
      raise exception 'Cuota % not pending', p_cuota_numero;
    end if;

    select bool_and(estado in ('pagada','cancelada')) into v_todas_cerradas
      from public.cuotas
     where prestamo_id = v_cobro.prestamo_id;
    if v_todas_cerradas and v_base_saldo > 0 then
      raise exception 'Cuotas agotadas pero queda saldo pendiente';
    end if;

    v_interes_periodo := round((v_base_saldo * v_prestamo.tasa) / 100);
    if coalesce(p_incluir_interes, false) then
      v_interes_pagado := least(p_monto, v_interes_periodo);
      v_capital_pagado := greatest(0, p_monto - v_interes_periodo);
    else
      v_capital_pagado := p_monto;
    end if;
  else
    raise exception 'Tipo de cobro inválido: %', p_tipo;
  end if;

  v_nuevo_saldo := greatest(0, v_base_saldo - v_capital_pagado);

  -- Paso 3: aplicar efectos del cobro nuevo.
  update public.cuotas
     set estado = 'pagada', pagada_en = v_fecha
   where prestamo_id = v_cobro.prestamo_id and numero = p_cuota_numero;

  if p_tipo = 'capital' then
    update public.prestamos
       set saldo_capital = v_nuevo_saldo,
           estado = case
                      when v_nuevo_saldo = 0 then 'cancelado'
                      when estado = 'cancelado' and v_nuevo_saldo > 0 then 'vigente'
                      else estado end,
           updated_at = now()
     where id = v_cobro.prestamo_id;
  else
    if v_cobro.tipo = 'capital' and v_nuevo_saldo <> v_prestamo.saldo_capital then
      update public.prestamos
         set saldo_capital = v_nuevo_saldo,
             estado = case when estado = 'cancelado' and v_nuevo_saldo > 0
                           then 'vigente' else estado end,
             updated_at = now()
       where id = v_cobro.prestamo_id;
    end if;
  end if;

  if p_tipo = 'capital' and v_nuevo_saldo = 0 then
    update public.cuotas
       set estado = 'cancelada'
     where prestamo_id = v_cobro.prestamo_id
       and estado = 'pendiente'
       and numero <> p_cuota_numero;
  else
    update public.cuotas
       set monto = round((v_nuevo_saldo * v_prestamo.tasa) / 100)
     where prestamo_id = v_cobro.prestamo_id
       and estado = 'pendiente'
       and numero > p_cuota_numero;
  end if;

  update public.cobros
     set cuota_numero = p_cuota_numero,
         monto = p_monto,
         tipo = p_tipo,
         incluir_interes = coalesce(p_incluir_interes, false),
         capital_pagado = v_capital_pagado,
         interes_pagado = v_interes_pagado,
         nota = p_nota,
         fecha = v_fecha
   where id = p_cobro_id;

  return p_cobro_id;
end;
$$;

grant execute on function public.update_last_cobro(
  uuid, int, numeric, text, boolean, text, timestamptz
) to authenticated;
