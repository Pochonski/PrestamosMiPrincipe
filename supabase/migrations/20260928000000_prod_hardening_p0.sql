-- =====================================================================
-- Préstamos Mi Príncipe — Hardening P0 pre-producción
-- Fecha: 2026-09-28
-- APLICAR EN: Supabase Dashboard → SQL Editor → New query → Pegar → Run
-- (o vía Supabase CLI: supabase db push)
--
-- Incluye:
--   1) cuotas read-only para viewer (insert/update/delete bloquean viewer)
--   2) search_path fijo en is_org_member + handle_new_user (anti hijack)
--   3) owner_id inmutable en organizations (trigger, anti escalamiento admin)
--   4) list_invites: token solo visible para owner/admin (least privilege)
--   5) CHECKs de dominio (montos/tasas/cuotas/nota) + validación en RPCs
--   6) delete_prestamo_seguro: borrado atómico con validación de cobros
--
-- Todo es idempotente (if exists / or replace) y seguro de re-ejecutar.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) cuotas: viewer read-only (paridad con clientes/prestamos/cobros)
-- ---------------------------------------------------------------------
drop policy if exists "Org-scoped cuotas insert" on public.cuotas;
create policy "Org-scoped cuotas insert" on public.cuotas
  for insert to authenticated with check (
    exists (select 1 from public.prestamos p where p.id = cuotas.prestamo_id and public.is_org_member(p.org_id))
    and exists (select 1 from public.prestamos p where p.id = cuotas.prestamo_id and public.my_role(p.org_id) != 'viewer')
  );

drop policy if exists "Org-scoped cuotas update" on public.cuotas;
create policy "Org-scoped cuotas update" on public.cuotas
  for update to authenticated using (
    exists (select 1 from public.prestamos p where p.id = cuotas.prestamo_id and public.is_org_member(p.org_id))
    and exists (select 1 from public.prestamos p where p.id = cuotas.prestamo_id and public.my_role(p.org_id) != 'viewer')
  );

drop policy if exists "Org-scoped cuotas delete" on public.cuotas;
create policy "Org-scoped cuotas delete" on public.cuotas
  for delete to authenticated using (
    exists (select 1 from public.prestamos p where p.id = cuotas.prestamo_id and public.is_org_member(p.org_id))
    and exists (select 1 from public.prestamos p where p.id = cuotas.prestamo_id and public.my_role(p.org_id) != 'viewer')
  );

-- ---------------------------------------------------------------------
-- 2) search_path fijo (anti search_path hijack)
-- ---------------------------------------------------------------------
create or replace function public.is_org_member(check_org_id uuid)
returns boolean language sql security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.org_members
    where org_id = check_org_id and user_id = auth.uid()
  );
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare
  full_name_value text;
begin
  full_name_value := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    new.email
  );
  insert into public.profiles (user_id, full_name, color)
  values (new.id, full_name_value, '#D4AF37')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 3) organizations.owner_id inmutable (solo el trigger lo protege: un admin
--    no puede auto-promoverse cambiando owner_id)
-- ---------------------------------------------------------------------
create or replace function public.block_owner_id_change()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.owner_id is distinct from old.owner_id then
    raise exception 'owner_id es inmutable';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_block_owner_id_change on public.organizations;
create trigger trg_block_owner_id_change
  before update of owner_id on public.organizations
  for each row execute function public.block_owner_id_change();

-- ---------------------------------------------------------------------
-- 4) list_invites: el token solo lo ven owner/admin.
--    La app usa este RPC (src/services/organizations.js), no la tabla directa.
--    NOTA: DROP previo porque CREATE OR REPLACE no permite cambiar el tipo
--    de retorno (setof org_invites -> table explícita).
-- ---------------------------------------------------------------------
drop function if exists public.list_invites(uuid);
create or replace function public.list_invites(p_org_id uuid)
returns table(
  id uuid, org_id uuid, email text, rol text, token uuid,
  created_by uuid, created_at timestamptz, expires_at timestamptz,
  accepted_at timestamptz, accepted_by uuid, revoked_at timestamptz
)
language sql security definer set search_path = public as $$
  select i.id, i.org_id, i.email, i.rol,
    case when public.is_org_admin(p_org_id) then i.token else null end as token,
    i.created_by, i.created_at, i.expires_at,
    i.accepted_at, i.accepted_by, i.revoked_at
    from public.org_invites i
   where i.org_id = p_org_id
     and public.is_org_member(p_org_id)
   order by i.created_at desc
$$;
grant execute on function public.list_invites(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 5) CHECKs de dominio (defensa en profundidad: la UI valida, la DB impone)
-- NOTA: si algún ALTER falla con check_violation es por datos legacy que no
-- cumplen la regla (ej. cédulas viejas sin formato). Limpiar esas filas y
-- re-ejecutar: todo es idempotente. Los RPCs de la sección 6 validan de todos
-- modos cada escritura nueva.
-- ---------------------------------------------------------------------
-- clientes: longitudes mínimas (misma regla que validators/cr.js)
do $$ begin
  alter table public.clientes add constraint chk_clientes_nombre check (char_length(nombre) >= 3);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.clientes add constraint chk_clientes_direccion check (char_length(direccion) >= 5);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.clientes add constraint chk_clientes_cedula check (cedula ~ '^\d-\d{4}-\d{4}$');
exception when duplicate_object then null; end $$;

-- prestamos: monto/tasa/cuotas en rango (misma regla que prestamos/selectors.js)
do $$ begin
  alter table public.prestamos add constraint chk_prestamos_monto check (monto >= 1000);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.prestamos add constraint chk_prestamos_saldo check (saldo_capital >= 0);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.prestamos add constraint chk_prestamos_tasa check (tasa >= 0 and tasa <= 100);
exception when duplicate_object then null; end $$;
do $$ begin
  -- 500 (no 120): extender_cuotas puede llevar n_cuotas más allá de 120.
  alter table public.prestamos add constraint chk_prestamos_n_cuotas check (n_cuotas between 1 and 500);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.prestamos add constraint chk_prestamos_ruta check (char_length(ruta) >= 2);
exception when duplicate_object then null; end $$;

-- cuotas: montos y estados válidos
do $$ begin
  alter table public.cuotas add constraint chk_cuotas_monto check (monto >= 0);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.cuotas add constraint chk_cuotas_numero check (numero >= 1 and numero <= 500);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.cuotas add constraint chk_cuotas_estado check (estado in ('pendiente','pagada','cancelada'));
exception when duplicate_object then null; end $$;

-- cobros: montos/tipos/nota acotada
do $$ begin
  alter table public.cobros add constraint chk_cobros_monto check (monto > 0);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.cobros add constraint chk_cobros_tipo check (tipo in ('interes','capital'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.cobros add constraint chk_cobros_nota check (nota is null or char_length(nota) <= 500);
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- 6) Validación en RPCs (el bypass de UI con anon key + token ya no cuela
--    montos negativos, tasas absurdas ni arrays gigantes → anti DoS)
-- ---------------------------------------------------------------------
-- NOTA: DROP de la firma vieja de 8 params (sin tasa_comision): si prod aún
-- la tiene, quedaría como overload sin validaciones. El DROP es seguro.
drop function if exists public.create_prestamo_with_cuotas(
  uuid, text, jsonb, numeric, numeric, int, date, jsonb
);
drop function if exists public.create_prestamo_with_cuotas(
  uuid, text, jsonb, numeric, numeric, int, date, jsonb, numeric
);
create or replace function public.create_prestamo_with_cuotas(
  p_cliente_id uuid,
  p_ruta text,
  p_periodo jsonb,
  p_monto numeric,
  p_tasa numeric,
  p_n_cuotas int,
  p_fecha_inicio date,
  p_cuotas jsonb,
  p_tasa_comision numeric default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_org_id uuid;
  v_user_id uuid;
  v_prestamo_id uuid;
  v_count int;
begin
  v_user_id := auth.uid();
  if v_user_id is null then raise exception 'Not authenticated'; end if;

  if p_monto is null or p_monto < 1000 then raise exception 'Monto mínimo 1000'; end if;
  if p_tasa is null or p_tasa < 0 or p_tasa > 100 then raise exception 'Tasa fuera de rango 0-100'; end if;
  if p_tasa_comision is not null and (p_tasa_comision < 0 or p_tasa + p_tasa_comision > 100) then
    raise exception 'Tasa comisión inválida';
  end if;
  if p_n_cuotas is null or p_n_cuotas < 1 or p_n_cuotas > 120 then raise exception 'Cuotas fuera de rango 1-120'; end if;
  if p_ruta is null or char_length(trim(p_ruta)) < 2 then raise exception 'Ruta inválida'; end if;
  v_count := coalesce(jsonb_array_length(p_cuotas), 0);
  if v_count < 1 or v_count > 120 then raise exception 'Payload de cuotas inválido'; end if;

  select org_id into v_org_id from public.clientes where id = p_cliente_id;
  if v_org_id is null then raise exception 'Cliente no encontrado'; end if;
  if not public.is_org_member(v_org_id) then raise exception 'No autorizado'; end if;
  if public.my_role(v_org_id) = 'viewer' then raise exception 'Viewers no pueden crear préstamos'; end if;

  insert into public.prestamos (
    org_id, cliente_id, ruta, periodo, monto, saldo_capital,
    tasa, tasa_comision, n_cuotas, fecha_inicio, estado, created_by
  ) values (
    v_org_id, p_cliente_id, trim(p_ruta), p_periodo, p_monto, p_monto,
    p_tasa, p_tasa_comision, p_n_cuotas, p_fecha_inicio, 'vigente', v_user_id
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
  uuid, text, jsonb, numeric, numeric, int, date, jsonb, numeric
) to authenticated;

create or replace function public.extender_prestamo_cuotas(
  p_prestamo_id uuid,
  p_nuevas_cuotas jsonb
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_org_id uuid;
  v_count int;
begin
  select p.org_id into v_org_id from public.prestamos p where p.id = p_prestamo_id;
  if v_org_id is null then raise exception 'Préstamo no encontrado'; end if;
  if not public.is_org_member(v_org_id) then raise exception 'No autorizado'; end if;
  if public.my_role(v_org_id) = 'viewer' then raise exception 'Viewers no pueden extender préstamos'; end if;

  v_count := coalesce(jsonb_array_length(p_nuevas_cuotas), 0);
  if v_count < 1 or v_count > 60 then raise exception 'Cantidad a extender inválida (1-60)'; end if;

  insert into public.cuotas (prestamo_id, numero, fecha, monto)
  select p_prestamo_id,
         (c->>'numero')::int,
         (c->>'fecha')::date,
         (c->>'monto')::numeric
    from jsonb_array_elements(p_nuevas_cuotas) c;

  update public.prestamos
     set n_cuotas = n_cuotas + v_count,
         estado = case when estado = 'cancelado' then 'vigente' else estado end,
         updated_at = now()
   where id = p_prestamo_id;
end;
$$;

-- ---------------------------------------------------------------------
-- 7) delete_prestamo_seguro: borrado atómico (anti carrera/huérfanos)
--    El cliente JS lo usa primero y cae a fallback si aún no está aplicado.
-- ---------------------------------------------------------------------
create or replace function public.delete_prestamo_seguro(p_prestamo_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_org_id uuid;
  v_cobros int;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;

  select org_id into v_org_id from public.prestamos where id = p_prestamo_id;
  if v_org_id is null then raise exception 'Préstamo no encontrado'; end if;
  if not public.is_org_member(v_org_id) then raise exception 'No autorizado'; end if;
  if public.my_role(v_org_id) = 'viewer' then raise exception 'Viewers no pueden eliminar préstamos'; end if;

  select count(*) into v_cobros from public.cobros where prestamo_id = p_prestamo_id;
  if v_cobros > 0 then
    raise exception 'No se puede eliminar un préstamo con cobros registrados (%)', v_cobros;
  end if;

  -- Misma transacción: cuotas + préstamo (las cuotas también caen por
  -- ON DELETE CASCADE, el delete explícito deja el intent claro).
  delete from public.cuotas where prestamo_id = p_prestamo_id;
  delete from public.prestamos where id = p_prestamo_id and org_id = v_org_id;
end;
$$;
grant execute on function public.delete_prestamo_seguro(uuid) to authenticated;
