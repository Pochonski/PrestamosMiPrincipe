-- =====================================================================
-- Préstamos Mi Príncipe — RPCs de negocio
-- =====================================================================
-- IMPORTANTE: estos RPCs NO están incluidos en setup.sql porque contienen
-- lógica transaccional crítica que debe mantenerse sincronizada con el
-- código JS que los invoca. Aplicar manualmente en Supabase Dashboard
-- → SQL Editor al deploy inicial y tras cualquier cambio de contrato.
--
-- JS callers:
--   - src/services/prestamos.js
--       rpc('create_prestamo_with_cuotas', { ... })
--       rpc('extender_prestamo_cuotas', { ... })
--   - src/services/cobros.js
--       rpc('create_cobro_with_updates', { ... })
--
-- Si modificás alguno de los 3, sincronizá:
--   - El contrato (parámetros / tipos de retorno) aquí
--   - El cliente que lo invoca en src/services/*
--   - El mapeo de errores en src/services/cobros.js (msg.includes)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) create_prestamo_with_cuotas
-- ---------------------------------------------------------------------
-- Crea un préstamo + sus N cuotas en una transacción.
-- Devuelve: uuid del préstamo creado.
-- ---------------------------------------------------------------------
create or replace function public.create_prestamo_with_cuotas(
  p_cliente_id uuid,
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
  v_org_id uuid;
  v_user_id uuid;
  v_prestamo_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select org_id into v_org_id
    from public.clientes
   where id = p_cliente_id;
  if v_org_id is null then
    raise exception 'Cliente no encontrado';
  end if;
  if not public.is_org_member(v_org_id) then
    raise exception 'No autorizado';
  end if;

  insert into public.prestamos (
    org_id, cliente_id, ruta, periodo, monto, saldo_capital,
    tasa, n_cuotas, fecha_inicio, estado, created_by
  ) values (
    v_org_id, p_cliente_id, p_ruta, p_periodo, p_monto, p_monto,
    p_tasa, p_n_cuotas, p_fecha_inicio, 'vigente', v_user_id
  )
  returning id into v_prestamo_id;

  insert into public.cuotas (prestamo_id, numero, fecha, monto)
  select v_prestamo_id,
         (c->>'numero')::int,
         (c->>'fecha')::date,
         (c->>'monto')::numeric
    from jsonb_array_elements(p_cuotas) c;

  return v_prestamo_id;
end;
$$;

grant execute on function public.create_prestamo_with_cuotas(
  uuid, text, jsonb, numeric, numeric, int, date, jsonb
) to authenticated;

-- ---------------------------------------------------------------------
-- 2) extender_prestamo_cuotas
-- ---------------------------------------------------------------------
-- Agrega N cuotas al final del cronograma. No recalcula saldo ni marca
-- cuotas existentes como pagadas.
-- Devuelve: void.
-- ---------------------------------------------------------------------
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

  insert into public.cuotas (prestamo_id, numero, fecha, monto)
  select p_prestamo_id,
         (c->>'numero')::int,
         (c->>'fecha')::date,
         (c->>'monto')::numeric
    from jsonb_array_elements(p_nuevas_cuotas) c;
end;
$$;

grant execute on function public.extender_prestamo_cuotas(uuid, jsonb)
  to authenticated;

-- ---------------------------------------------------------------------
-- 3) create_cobro_with_updates
-- ---------------------------------------------------------------------
-- Registra un cobro y aplica efectos colaterales:
--   - Actualiza cuota.estado='pagada', cuota.pagada_en
--   - Decrementa prestamo.saldo_capital si tipo='capital'
--   - Marca prestamo.estado='cancelado' si saldo_capital llega a 0
-- Reglas de validación (lanzan exception con texto que el cliente mapea):
--   - "monto menor..." si tipo='interes' y p_monto < interes del periodo
--   - "cuota ... not pending" si la cuota ya estaba pagada/cancelada
--   - "intereses atrasados ... N" si tipo='capital' y hay cuotas atrasadas
--   - "cuotas agotadas" si tipo='capital' y todas las cuotas cerradas con saldo>0
-- Devuelve: uuid del cobro creado.
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
