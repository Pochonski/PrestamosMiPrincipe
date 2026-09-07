-- =====================================================================
-- Préstamos Mi Príncipe — Editar / eliminar ÚLTIMO cobro
-- =====================================================================
-- APLICAR EN: Supabase Dashboard → SQL Editor → New query → Pegar → Run
-- (o vía Supabase CLI: supabase db push)
--
-- Agrega 2 RPCs transaccionales (security definer):
--   1) public.delete_last_cobro(p_cobro_id uuid) returns uuid
--      - Solo permite eliminar el ÚLTIMO cobro del préstamo (por fecha).
--      - Revierte efectos: cuota → 'pendiente', saldo_capital += capital_pagado,
--        estado 'cancelado' → 'vigente' si vuelve a haber saldo.
--      - Devuelve el prestamo_id afectado.
--   2) public.update_last_cobro(...) returns uuid
--      - Solo permite editar el ÚLTIMO cobro (tipo, cuota, monto, nota).
--      - Revierte el cobro viejo y aplica el nuevo en la MISMA transacción,
--        reutilizando las validaciones de create_cobro_with_updates.
--      - Devuelve el id del cobro actualizado.
--
-- JS callers (a agregar en src/services/cobros.js):
--   - rpc('delete_last_cobro', { p_cobro_id })
--   - rpc('update_last_cobro', { p_cobro_id, p_cuota_numero, p_monto,
--                                p_tipo, p_incluir_interes, p_nota })
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) delete_last_cobro
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
  end if;

  delete from public.cobros where id = p_cobro_id;

  return v_cobro.prestamo_id;
end;
$$;

grant execute on function public.delete_last_cobro(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 2) update_last_cobro
-- ---------------------------------------------------------------------
-- Edita el último cobro: revierte el viejo y aplica el nuevo en una sola
-- transacción. Las validaciones espejan create_cobro_with_updates pero
-- calculadas sobre el saldo BASE (saldo actual + capital revertido).
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
  v_base_saldo numeric;
  v_interes_periodo numeric;
  v_capital_pagado numeric := 0;
  v_interes_pagado numeric := 0;
  v_nuevo_saldo numeric;
  v_atrasadas int;
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
    v_interes_periodo := round((v_base_saldo * v_prestamo.tasa) / 100);
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

    -- Otros intereses atrasados bloquean el abono a capital (se excluye la
    -- cuota destino cuando se incluye su interés, igual que el cliente JS).
    if coalesce(p_incluir_interes, false) then
      select count(*) into v_atrasadas
        from public.cuotas
       where prestamo_id = v_cobro.prestamo_id
         and estado = 'pendiente'
         and fecha < current_date
         and numero <> p_cuota_numero;
    else
      select count(*) into v_atrasadas
        from public.cuotas
       where prestamo_id = v_cobro.prestamo_id
         and estado = 'pendiente'
         and fecha < current_date;
    end if;
    if v_atrasadas > 0 then
      raise exception 'Hay % intereses atrasados. Pagalos antes de abonar a capital', v_atrasadas;
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
