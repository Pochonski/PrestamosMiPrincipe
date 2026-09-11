-- ---------------------------------------------------------------------
-- Comisión solo en Mis comisiones (base-only en el resto).
--
-- 1) create_cobro_with_updates / update_last_cobro / delete_last_cobro:
--    interés del período y recálculo de pendientes usan SOLO la tasa base.
--    La columna prestamos.tasa_comision se conserva (Mis comisiones la usa
--    para split y proyección), pero ya no suma a ningún monto.
-- 2) Backfill: normaliza TODAS las cuotas pendientes (futuras y atrasadas)
--    de préstamos con comisión a round(saldo_capital * tasa / 100).
--    Pagadas/canceladas quedan intactas como historial.
--
-- Aplicar en Supabase SQL Editor. Antes, correr el conteo de verificación
-- del final (comentado) para confirmar filas afectadas.
-- ---------------------------------------------------------------------

-- ---------------------------------------------------------------------
-- create_cobro_with_updates: interés del período con tasa BASE.
-- Recalca pendientes futuras con la misma tasa base.
-- ---------------------------------------------------------------------
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
  v_tasa_base numeric;
  v_interes_periodo numeric;
  v_capital_pagado numeric := 0;
  v_interes_pagado numeric := 0;
  v_nuevo_saldo numeric;
  v_cobro_id uuid;
  v_user_id uuid;
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

  v_tasa_base := coalesce(v_prestamo.tasa, 0);

  if p_tipo = 'interes' then
    v_interes_periodo := round((v_prestamo.saldo_capital * v_tasa_base) / 100);
    if p_monto < v_interes_periodo then
      raise exception 'monto menor que interés del período (%)', v_interes_periodo;
    end if;
    v_interes_pagado := p_monto;
    v_capital_pagado := 0;
  elsif p_tipo = 'capital' then
    -- requiere cuota válida
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

    -- NOTA: ya no se bloquea por intereses atrasados (decisión de producto:
    -- el frontend muestra aviso + checkbox de confirmación y el backend
    -- permite el abono a capital igual).

    select bool_and(estado in ('pagada','cancelada')) into v_todas_cerradas
      from public.cuotas
     where prestamo_id = p_prestamo_id;
    if v_todas_cerradas and v_prestamo.saldo_capital > 0 then
      raise exception 'Cuotas agotadas pero queda saldo pendiente';
    end if;

    v_interes_periodo := round((v_prestamo.saldo_capital * v_tasa_base) / 100);
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

    -- Recalcular cuotas FUTURAS con el nuevo saldo (las atrasadas
    -- conservan su monto original).
    update public.cuotas
       set monto = round((v_nuevo_saldo * v_tasa_base) / 100)
     where prestamo_id = p_prestamo_id
       and estado = 'pendiente'
       and fecha >= current_date;
  end if;

  return v_cobro_id;
end;
$$;

grant execute on function public.create_cobro_with_updates(
  uuid, int, numeric, text, boolean, text
) to authenticated;

-- ---------------------------------------------------------------------
-- delete_last_cobro: revierte con tasa base
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
  v_tasa_base numeric;
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

  -- Solo el último cobro del préstamo (por fecha) puede eliminarse.
  if exists (
    select 1 from public.cobros
     where prestamo_id = v_cobro.prestamo_id
       and fecha > v_cobro.fecha
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

  v_tasa_base := coalesce(v_prestamo.tasa, 0);

  -- Revertir cuota a pendiente.
  update public.cuotas
     set estado = 'pendiente', pagada_en = null
   where prestamo_id = v_cobro.prestamo_id
     and numero = v_cobro.cuota_numero;

  -- Revertir saldo solo si el cobro tocó capital.
  if v_cobro.tipo = 'capital' then
    v_nuevo_saldo := v_prestamo.saldo_capital + coalesce(v_cobro.capital_pagado, 0);
    update public.prestamos
       set saldo_capital = v_nuevo_saldo,
           estado = case when estado = 'cancelado' and v_nuevo_saldo > 0
                         then 'vigente' else estado end,
           updated_at = now()
     where id = v_cobro.prestamo_id;
  else
    v_nuevo_saldo := v_prestamo.saldo_capital;
  end if;

  -- Reaplicar la fórmula de cuotas futuras con el saldo restaurado
  -- (revierte el recálculo que hizo el cobro al crearse).
  update public.cuotas
     set monto = round((v_nuevo_saldo * v_tasa_base) / 100)
   where prestamo_id = v_cobro.prestamo_id
     and estado = 'pendiente'
     and fecha >= current_date;

  delete from public.cobros where id = p_cobro_id;

  return v_cobro.prestamo_id;
end;
$$;

grant execute on function public.delete_last_cobro(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- update_last_cobro: revierte y reaplica con tasa base
-- ---------------------------------------------------------------------
create or replace function public.update_last_cobro(
  p_cobro_id uuid,
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
  v_cobro record;
  v_prestamo record;
  v_nueva_cuota record;
  v_tasa_base numeric;
  v_base_saldo numeric;
  v_interes_periodo numeric;
  v_capital_pagado numeric := 0;
  v_interes_pagado numeric := 0;
  v_nuevo_saldo numeric;
  v_todas_cerradas boolean;
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

  -- Solo el último cobro del préstamo (por fecha) puede editarse.
  if exists (
    select 1 from public.cobros
     where prestamo_id = v_cobro.prestamo_id
       and fecha > v_cobro.fecha
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

  v_tasa_base := coalesce(v_prestamo.tasa, 0);

  -- Paso 1: revertir efectos del cobro viejo.
  update public.cuotas
     set estado = 'pendiente', pagada_en = null
   where prestamo_id = v_cobro.prestamo_id
     and numero = v_cobro.cuota_numero;

  if v_cobro.tipo = 'capital' then
    v_base_saldo := v_prestamo.saldo_capital + coalesce(v_cobro.capital_pagado, 0);
  else
    v_base_saldo := v_prestamo.saldo_capital;
  end if;

  -- Paso 2: validar y calcular el cobro nuevo sobre el saldo base.
  if p_tipo = 'interes' then
    v_interes_periodo := round((v_base_saldo * v_tasa_base) / 100);
    if p_monto < v_interes_periodo then
      raise exception 'monto menor que interés del período (%)', v_interes_periodo;
    end if;
    v_interes_pagado := p_monto;
    v_capital_pagado := 0;
  elsif p_tipo = 'capital' then
    -- La cuota destino debe estar pendiente EN EL ESTADO REVERTIDO.
    -- (Si es la misma cuota del cobro viejo, ya quedó pendiente arriba.)
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

    -- NOTA: ya no se bloquea por intereses atrasados (ver create).

    select bool_and(estado in ('pagada','cancelada')) into v_todas_cerradas
      from public.cuotas
     where prestamo_id = v_cobro.prestamo_id;
    if v_todas_cerradas and v_base_saldo > 0 then
      raise exception 'Cuotas agotadas pero queda saldo pendiente';
    end if;

    v_interes_periodo := round((v_base_saldo * v_tasa_base) / 100);
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
     set estado = 'pagada', pagada_en = now()
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
    -- Si el cobro viejo era de capital y el nuevo es solo interés, el saldo
    -- vuelve a la base y se reabre el préstamo si estaba cancelado.
    if v_cobro.tipo = 'capital' and v_nuevo_saldo <> v_prestamo.saldo_capital then
      update public.prestamos
         set saldo_capital = v_nuevo_saldo,
             estado = case when estado = 'cancelado' and v_nuevo_saldo > 0
                           then 'vigente' else estado end,
             updated_at = now()
       where id = v_cobro.prestamo_id;
    end if;
  end if;

  -- Recalcular cuotas FUTURAS con el saldo resultante (las atrasadas
  -- conservan su monto). La fórmula determinística deja el estado final
  -- igual que si el cobro viejo nunca hubiera existido.
  update public.cuotas
     set monto = round((v_nuevo_saldo * v_tasa_base) / 100)
   where prestamo_id = v_cobro.prestamo_id
     and estado = 'pendiente'
     and fecha >= current_date;

  update public.cobros
     set cuota_numero = p_cuota_numero,
         monto = p_monto,
         tipo = p_tipo,
         incluir_interes = coalesce(p_incluir_interes, false),
         capital_pagado = v_capital_pagado,
         interes_pagado = v_interes_pagado,
         nota = p_nota
   where id = p_cobro_id;

  return p_cobro_id;
end;
$$;

grant execute on function public.update_last_cobro(
  uuid, int, numeric, text, boolean, text
) to authenticated;

-- ---------------------------------------------------------------------
-- Backfill: normaliza TODAS las cuotas pendientes (futuras y atrasadas)
-- de préstamos con comisión a tasa base. Pagadas/canceladas intactas.
-- ---------------------------------------------------------------------
update public.cuotas q
   set monto = round((p.saldo_capital * coalesce(p.tasa, 0)) / 100)
  from public.prestamos p
 where q.prestamo_id = p.id
   and q.estado = 'pendiente'
   and coalesce(p.tasa_comision, 0) > 0;

-- ---------------------------------------------------------------------
-- Verificación (correr ANTES en SQL Editor para confirmar alcance;
-- estas consultas son de solo lectura):
--
-- select p.id, p.tasa, p.tasa_comision, p.saldo_capital, count(*) as pendientes,
--        count(*) filter (where q.fecha < current_date) as atrasadas
--   from public.prestamos p
--   join public.cuotas q on q.prestamo_id = p.id and q.estado = 'pendiente'
--  where coalesce(p.tasa_comision, 0) > 0
--  group by p.id, p.tasa, p.tasa_comision, p.saldo_capital;
-- ---------------------------------------------------------------------
