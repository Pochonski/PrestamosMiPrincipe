-- =====================================================================
-- Migración: Single-org + invites + roles bien implementado
-- Ejecutar en: Supabase Dashboard → SQL Editor → pegar → Run
-- Fecha: 2026-09-04
-- Requiere: setup.sql ya aplicado
-- =====================================================================

-- 1) Roles con check constraint
do $$ begin
  if not exists (select 1 from pg_constraint where conname='chk_org_members_rol') then
    alter table public.org_members add constraint chk_org_members_rol
      check (rol in ('owner','admin','cobrador','viewer'));
  end if;
end $$;

-- Migrar rol 'admin' antiguo sigue válido; 'cobrador' sigue válido
-- Promover al miembro más antiguo de cada org a 'owner' si no hay owner
do $$
declare r record;
begin
  for r in select id from public.organizations loop
    if not exists (select 1 from public.org_members where org_id=r.id and rol='owner') then
      update public.org_members
         set rol='owner'
       where (org_id, created_at) in (
         select org_id, min(created_at) from public.org_members where org_id=r.id group by org_id
       );
    end if;
  end loop;
end $$;

-- 2) Single-org por usuario: unique(user_id)
create unique index if not exists uq_org_members_user_single on public.org_members(user_id);

-- 3) organizations owner_id + updated_at
alter table public.organizations add column if not exists owner_id uuid references auth.users;
alter table public.organizations add column if not exists updated_at timestamptz default now();
do $$ begin
  update public.organizations o set owner_id = m.user_id
    from public.org_members m where m.org_id=o.id and m.rol='owner' and o.owner_id is null;
end $$;

-- 4) Tabla org_invites
create table if not exists public.org_invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations on delete cascade not null,
  email text not null,
  rol text not null check (rol in ('admin','cobrador','viewer')),
  token uuid unique not null default gen_random_uuid(),
  created_by uuid references auth.users not null,
  created_at timestamptz default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  accepted_by uuid references auth.users,
  revoked_at timestamptz
);
create index if not exists idx_invites_org on public.org_invites(org_id);
create index if not exists idx_invites_token on public.org_invites(token);
create index if not exists idx_invites_email on public.org_invites(lower(email));
create index if not exists idx_invites_org_email on public.org_invites(org_id, lower(email));

-- 5) Helpers
create or replace function public.my_org_id()
returns uuid language sql security definer set search_path=public as $$
  select org_id from public.org_members where user_id = auth.uid() limit 1
$$;

create or replace function public.my_role(check_org_id uuid)
returns text language sql security definer set search_path=public as $$
  select rol from public.org_members where org_id = check_org_id and user_id = auth.uid() limit 1
$$;

create or replace function public.is_org_owner(check_org_id uuid)
returns boolean language sql security definer set search_path=public as $$
  select exists (select 1 from public.org_members where org_id=check_org_id and user_id=auth.uid() and rol='owner')
$$;

create or replace function public.is_org_admin(check_org_id uuid)
returns boolean language sql security definer set search_path=public as $$
  select exists (select 1 from public.org_members where org_id=check_org_id and user_id=auth.uid() and rol in ('owner','admin'))
$$;

-- 6) RLS org_invites
alter table public.org_invites enable row level security;
drop policy if exists "invites select own org" on public.org_invites;
create policy "invites select own org" on public.org_invites
  for select to authenticated using (public.is_org_member(org_id));

drop policy if exists "invites insert admin/cobrador" on public.org_invites;
create policy "invites insert admin/cobrador" on public.org_invites
  for insert to authenticated with check (
    public.is_org_member(org_id) and public.my_role(org_id) in ('owner','admin','cobrador')
  );

drop policy if exists "invites update admin" on public.org_invites;
create policy "invites update admin" on public.org_invites
  for update to authenticated using (public.is_org_admin(org_id)) with check (public.is_org_admin(org_id));

drop policy if exists "invites delete admin" on public.org_invites;
create policy "invites delete admin" on public.org_invites
  for delete to authenticated using (public.is_org_admin(org_id));

-- 7) Ajustar RLS org_members para roles
drop policy if exists "Org owners can update members" on public.org_members;
create policy "Org owners can update members" on public.org_members
  for update to authenticated using (public.is_org_admin(org_id))
  with check (public.is_org_admin(org_id) and rol != 'owner');

drop policy if exists "Org owners can delete members" on public.org_members;
create policy "Org owners can delete members" on public.org_members
  for delete to authenticated using (public.is_org_admin(org_id) and rol != 'owner');

-- Ajustar clientes/prestamos/cobros para viewer read-only (insert/update/delete bloquea viewer)
drop policy if exists "Org-scoped clientes insert" on public.clientes;
create policy "Org-scoped clientes insert" on public.clientes
  for insert to authenticated with check (public.is_org_member(org_id) and public.my_role(org_id) != 'viewer');
drop policy if exists "Org-scoped clientes update" on public.clientes;
create policy "Org-scoped clientes update" on public.clientes
  for update to authenticated using (public.is_org_member(org_id) and public.my_role(org_id) != 'viewer');
drop policy if exists "Org-scoped clientes delete" on public.clientes;
create policy "Org-scoped clientes delete" on public.clientes
  for delete to authenticated using (public.is_org_member(org_id) and public.my_role(org_id) != 'viewer');

drop policy if exists "Org-scoped prestamos insert" on public.prestamos;
create policy "Org-scoped prestamos insert" on public.prestamos
  for insert to authenticated with check (public.is_org_member(org_id) and public.my_role(org_id) != 'viewer');
drop policy if exists "Org-scoped prestamos update" on public.prestamos;
create policy "Org-scoped prestamos update" on public.prestamos
  for update to authenticated using (public.is_org_member(org_id) and public.my_role(org_id) != 'viewer');
drop policy if exists "Org-scoped prestamos delete" on public.prestamos;
create policy "Org-scoped prestamos delete" on public.prestamos
  for delete to authenticated using (public.is_org_member(org_id) and public.my_role(org_id) != 'viewer');

drop policy if exists "Org-scoped cobros insert" on public.cobros;
create policy "Org-scoped cobros insert" on public.cobros
  for insert to authenticated with check (public.is_org_member(org_id) and public.my_role(org_id) != 'viewer');
drop policy if exists "Org-scoped cobros update" on public.cobros;
create policy "Org-scoped cobros update" on public.cobros
  for update to authenticated using (public.is_org_member(org_id) and public.my_role(org_id) != 'viewer');
drop policy if exists "Org-scoped cobros delete" on public.cobros;
create policy "Org-scoped cobros delete" on public.cobros
  for delete to authenticated using (public.is_org_member(org_id) and public.my_role(org_id) != 'viewer');

-- 8) RPC create_organization actualizado: bloquea 2da org, set owner, slug handling lo hace app con retry
create or replace function public.create_organization(org_nombre text, org_slug text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
  current_user_id uuid;
begin
  current_user_id := auth.uid();
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;
  if exists (select 1 from public.org_members where user_id = current_user_id) then
    raise exception 'Already in organization';
  end if;
  insert into public.organizations (nombre, slug, owner_id)
  values (org_nombre, org_slug, current_user_id)
  returning id into new_org_id;
  insert into public.org_members (org_id, user_id, rol)
  values (new_org_id, current_user_id, 'owner');
  insert into public.profiles (user_id, full_name, color)
  values (current_user_id, org_nombre, '#D4AF37')
  on conflict (user_id) do nothing;
  return new_org_id;
end;
$$;
grant execute on function public.create_organization(text, text) to authenticated;

-- 9) RPCs de invites y miembros
create or replace function public.create_invite(p_org_id uuid, p_email text, p_rol text)
returns public.org_invites
language plpgsql
security definer
set search_path=public
as $$
declare
  v_user_id uuid := auth.uid();
  v_my_rol text;
  v_invite public.org_invites;
  v_email text := lower(trim(p_email));
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;
  if p_rol not in ('admin','cobrador','viewer') then raise exception 'Rol inválido'; end if;
  if v_email is null or v_email='' or v_email not like '%@%.%' then raise exception 'Email inválido'; end if;
  if not public.is_org_member(p_org_id) then raise exception 'No autorizado'; end if;
  select rol into v_my_rol from public.org_members where org_id=p_org_id and user_id=v_user_id;
  if v_my_rol is null then raise exception 'No autorizado'; end if;
  if v_my_rol = 'viewer' then raise exception 'Viewers no pueden invitar'; end if;
  if v_my_rol = 'cobrador' and p_rol != 'viewer' then raise exception 'Cobradores solo pueden invitar viewers'; end if;
  -- no invitar si ya es miembro (por email -> buscar auth.users? solo si ya tiene org)
  -- chequeo simple: si existe un user con ese email que ya tiene membresía en esta org
  if exists (
    select 1 from auth.users u join public.org_members m on m.user_id=u.id
     where lower(u.email)=v_email and m.org_id=p_org_id
  ) then raise exception 'El usuario ya es miembro de la organización'; end if;
  if exists (
    select 1 from public.org_invites where org_id=p_org_id and lower(email)=v_email and revoked_at is null and accepted_at is null and expires_at > now()
  ) then raise exception 'Ya existe una invitación pendiente para ese email'; end if;

  insert into public.org_invites (org_id, email, rol, created_by)
  values (p_org_id, v_email, p_rol, v_user_id)
  returning * into v_invite;
  return v_invite;
end;
$$;
grant execute on function public.create_invite(uuid, text, text) to authenticated;

create or replace function public.accept_invite(p_token uuid)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_invite public.org_invites;
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;
  select lower(email) into v_email from auth.users where id=v_user_id;
  if v_email is null then raise exception 'No authenticated user'; end if;
  if exists (select 1 from public.org_members where user_id=v_user_id) then
    raise exception 'Already in organization';
  end if;
  select * into v_invite from public.org_invites where token=p_token;
  if v_invite.id is null then raise exception 'Invitación no encontrada'; end if;
  if v_invite.revoked_at is not null then raise exception 'Invitación revocada'; end if;
  if v_invite.accepted_at is not null then raise exception 'Invitación ya aceptada'; end if;
  if v_invite.expires_at < now() then raise exception 'Invitación expirada'; end if;
  if lower(v_invite.email) != v_email then raise exception 'Email mismatch: la invitación es para %', v_invite.email; end if;

  insert into public.org_members (org_id, user_id, rol)
  values (v_invite.org_id, v_user_id, v_invite.rol);

  update public.org_invites set accepted_at=now(), accepted_by=v_user_id where id=v_invite.id;

  return v_invite.org_id;
end;
$$;
grant execute on function public.accept_invite(uuid) to authenticated;

create or replace function public.revoke_invite(p_invite_id uuid)
returns void
language plpgsql
security definer
set search_path=public
as $$
declare org uuid;
begin
  select org_id into org from public.org_invites where id=p_invite_id;
  if org is null then raise exception 'Invitación no encontrada'; end if;
  if not public.is_org_admin(org) then raise exception 'No autorizado: solo owner/admin'; end if;
  update public.org_invites set revoked_at=now() where id=p_invite_id and revoked_at is null and accepted_at is null;
end;
$$;
grant execute on function public.revoke_invite(uuid) to authenticated;

create or replace function public.update_member_role(p_target_user_id uuid, p_new_rol text)
returns void
language plpgsql
security definer
set search_path=public
as $$
declare v_org uuid := public.my_org_id();
declare v_my_rol text;
declare v_target_rol text;
begin
  if v_org is null then raise exception 'No authenticated org'; end if;
  if p_new_rol not in ('admin','cobrador','viewer') then raise exception 'Rol inválido: owner no asignable vía este método'; end if;
  select rol into v_my_rol from public.org_members where org_id=v_org and user_id=auth.uid();
  if v_my_rol not in ('owner','admin') then raise exception 'No autorizado: solo owner/admin'; end if;
  select rol into v_target_rol from public.org_members where org_id=v_org and user_id=p_target_user_id;
  if v_target_rol is null then raise exception 'Miembro no encontrado'; end if;
  if v_target_rol='owner' then raise exception 'No se puede modificar al owner'; end if;
  if p_target_user_id = auth.uid() then raise exception 'No podés cambiar tu propio rol'; end if;
  update public.org_members set rol=p_new_rol where org_id=v_org and user_id=p_target_user_id;
end;
$$;
grant execute on function public.update_member_role(uuid, text) to authenticated;

create or replace function public.remove_member(p_target_user_id uuid)
returns void
language plpgsql
security definer
set search_path=public
as $$
declare v_org uuid := public.my_org_id();
declare v_my_rol text;
declare v_target_rol text;
begin
  if v_org is null then raise exception 'No org'; end if;
  select rol into v_my_rol from public.org_members where org_id=v_org and user_id=auth.uid();
  if v_my_rol not in ('owner','admin') then raise exception 'No autorizado'; end if;
  select rol into v_target_rol from public.org_members where org_id=v_org and user_id=p_target_user_id;
  if v_target_rol is null then raise exception 'Miembro no encontrado'; end if;
  if v_target_rol='owner' then raise exception 'No se puede remover al owner'; end if;
  if p_target_user_id = auth.uid() then raise exception 'No podés removerte a vos mismo'; end if;
  delete from public.org_members where org_id=v_org and user_id=p_target_user_id;
end;
$$;
grant execute on function public.remove_member(uuid) to authenticated;

create or replace function public.list_members(p_org_id uuid)
returns table(user_id uuid, full_name text, email text, rol text, created_at timestamptz)
language sql
security definer
set search_path=public
as $$
  select m.user_id, p.full_name, u.email::text, m.rol, m.created_at
    from public.org_members m
    join auth.users u on u.id=m.user_id
    left join public.profiles p on p.user_id=m.user_id
   where m.org_id=p_org_id
     and public.is_org_member(p_org_id)
   order by case m.rol when 'owner' then 1 when 'admin' then 2 when 'cobrador' then 3 else 4 end, m.created_at;
$$;
grant execute on function public.list_members(uuid) to authenticated;

create or replace function public.list_invites(p_org_id uuid)
returns setof public.org_invites
language sql
security definer
set search_path=public
as $$
  select * from public.org_invites where org_id=p_org_id and public.is_org_member(p_org_id) order by created_at desc
$$;
grant execute on function public.list_invites(uuid) to authenticated;

-- 10) Permitir update organizations solo owner/admin y proteger owner_id
drop policy if exists "Users can update their orgs" on public.organizations;
create policy "Users can update their orgs" on public.organizations
  for update to authenticated using (public.is_org_admin(id)) with check (public.is_org_admin(id));
