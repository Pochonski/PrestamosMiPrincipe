-- =====================================================================
-- Préstamos Mi Príncipe — Schema multi-tenant con RLS
-- =====================================================================
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → Pegar → Run
-- =====================================================================

-- Limpiar si existe (solo si querés resetear)
-- drop table if exists public.notificaciones cascade;
-- drop table if exists public.cobros cascade;
-- drop table if exists public.cuotas cascade;
-- drop table if exists public.prestamos cascade;
-- drop table if exists public.clientes cascade;
-- drop table if exists public.profiles cascade;
-- drop table if exists public.org_members cascade;
-- drop table if exists public.organizations cascade;
-- drop function if exists public.is_org_member(uuid);
-- drop function if exists public.handle_new_user();

-- 1. Organizaciones (multi-tenant)
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  slug text unique not null,
  created_at timestamptz default now()
);

-- 2. Membresías: muchos-a-muchos entre users y orgs
create table if not exists public.org_members (
  org_id uuid references public.organizations on delete cascade,
  user_id uuid references auth.users on delete cascade,
  rol text not null default 'cobrador',
  created_at timestamptz default now(),
  primary key (org_id, user_id)
);

-- 3. Profiles (vinculado a auth.users)
create table if not exists public.profiles (
  user_id uuid references auth.users on delete cascade primary key,
  full_name text,
  color text default '#D4AF37',
  created_at timestamptz default now()
);

-- 4. Clientes
create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations on delete cascade not null,
  nombre text not null,
  cedula text not null,
  telefono text not null,
  direccion text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. Préstamos
create table if not exists public.prestamos (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations on delete cascade not null,
  cliente_id uuid references public.clientes on delete cascade not null,
  ruta text not null,
  periodo jsonb not null,
  monto numeric not null,
  saldo_capital numeric not null,
  tasa numeric not null,
  n_cuotas int not null,
  fecha_inicio date not null,
  estado text not null default 'vigente',
  created_by uuid references auth.users,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 6. Cuotas
create table if not exists public.cuotas (
  id uuid primary key default gen_random_uuid(),
  prestamo_id uuid references public.prestamos on delete cascade not null,
  numero int not null,
  fecha date not null,
  monto numeric not null,
  estado text not null default 'pendiente',
  pagada_en timestamptz,
  unique (prestamo_id, numero)
);

-- 7. Cobros
create table if not exists public.cobros (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations on delete cascade not null,
  prestamo_id uuid references public.prestamos on delete cascade not null,
  cliente_id uuid references public.clientes on delete cascade not null,
  cuota_numero int not null,
  monto numeric not null,
  tipo text not null,
  incluir_interes boolean default false,
  capital_pagado numeric default 0,
  interes_pagado numeric default 0,
  fecha timestamptz default now(),
  cobrador_id uuid references auth.users,
  nota text
);

-- 8. Notificaciones
create table if not exists public.notificaciones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  org_id uuid references public.organizations on delete cascade not null,
  tipo text not null,
  titulo text not null,
  mensaje text not null,
  fecha timestamptz default now(),
  leida boolean default false
);

-- Índices
create index if not exists idx_clientes_org on public.clientes(org_id);
create index if not exists idx_prestamos_org on public.prestamos(org_id);
create index if not exists idx_prestamos_cliente on public.prestamos(cliente_id);
create index if not exists idx_cuotas_prestamo on public.cuotas(prestamo_id);
create index if not exists idx_cobros_org on public.cobros(org_id);
create index if not exists idx_cobros_cliente on public.cobros(cliente_id);
create index if not exists idx_cobros_fecha on public.cobros(fecha desc);
create index if not exists idx_notif_user on public.notificaciones(user_id, fecha desc);
create index if not exists idx_org_members_user on public.org_members(user_id);

-- =====================================================================
-- RLS: cada user solo ve datos de su org
-- =====================================================================

-- Helper: is_member_of_org
create or replace function public.is_org_member(check_org_id uuid)
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.org_members
    where org_id = check_org_id and user_id = auth.uid()
  );
$$;

-- Habilitar RLS en todas las tablas
alter table public.organizations enable row level security;
alter table public.org_members enable row level security;
alter table public.profiles enable row level security;
alter table public.clientes enable row level security;
alter table public.prestamos enable row level security;
alter table public.cuotas enable row level security;
alter table public.cobros enable row level security;
alter table public.notificaciones enable row level security;

-- Policies
drop policy if exists "Users see their orgs" on public.organizations;
drop policy if exists "Users can create orgs" on public.organizations;
drop policy if exists "Users can update their orgs" on public.organizations;
drop policy if exists "Users see their memberships" on public.org_members;
drop policy if exists "Org owners can manage members" on public.org_members;
drop policy if exists "Users see their profile" on public.profiles;
drop policy if exists "Users update their profile" on public.profiles;
drop policy if exists "Users insert their profile" on public.profiles;
drop policy if exists "Org-scoped clientes" on public.clientes;
drop policy if exists "Org-scoped prestamos" on public.prestamos;
drop policy if exists "Org-scoped cuotas" on public.cuotas;
drop policy if exists "Org-scoped cobros" on public.cobros;
drop policy if exists "User-scoped notif" on public.notificaciones;
drop policy if exists "Users see their orgs" on public.organizations;
drop policy if exists "Users can create orgs" on public.organizations;
drop policy if exists "Users can update their orgs" on public.organizations;
drop policy if exists "Users see their memberships" on public.org_members;
drop policy if exists "Org owners can manage members" on public.org_members;
drop policy if exists "Org owners can update members" on public.org_members;
drop policy if exists "Org owners can delete members" on public.org_members;
drop policy if exists "Org-scoped clientes select" on public.clientes;
drop policy if exists "Org-scoped clientes insert" on public.clientes;
drop policy if exists "Org-scoped clientes update" on public.clientes;
drop policy if exists "Org-scoped clientes delete" on public.clientes;
drop policy if exists "Org-scoped prestamos select" on public.prestamos;
drop policy if exists "Org-scoped prestamos insert" on public.prestamos;
drop policy if exists "Org-scoped prestamos update" on public.prestamos;
drop policy if exists "Org-scoped prestamos delete" on public.prestamos;
drop policy if exists "Org-scoped cuotas select" on public.cuotas;
drop policy if exists "Org-scoped cuotas insert" on public.cuotas;
drop policy if exists "Org-scoped cuotas update" on public.cuotas;
drop policy if exists "Org-scoped cuotas delete" on public.cuotas;
drop policy if exists "Org-scoped cobros select" on public.cobros;
drop policy if exists "Org-scoped cobros insert" on public.cobros;
drop policy if exists "Org-scoped cobros update" on public.cobros;
drop policy if exists "Org-scoped cobros delete" on public.cobros;
drop policy if exists "User-scoped notif select" on public.notificaciones;
drop policy if exists "User-scoped notif insert" on public.notificaciones;
drop policy if exists "User-scoped notif update" on public.notificaciones;
drop policy if exists "User-scoped notif delete" on public.notificaciones;

create policy "Users see their orgs" on public.organizations
  for select to authenticated using (public.is_org_member(id));

create policy "Users can create orgs" on public.organizations
  for insert to authenticated with check (auth.uid() is not null);

create policy "Users can update their orgs" on public.organizations
  for update to authenticated using (public.is_org_member(id));

create policy "Users see their memberships" on public.org_members
  for select to authenticated using (user_id = auth.uid());

create policy "Org owners can manage members" on public.org_members
  for insert to authenticated with check (
    user_id = auth.uid() AND (
      NOT EXISTS (select 1 from public.org_members where user_id = auth.uid())
      OR public.is_org_member(org_id)
    )
  );

create policy "Org owners can update members" on public.org_members
  for update to authenticated using (public.is_org_member(org_id));

create policy "Org owners can delete members" on public.org_members
  for delete to authenticated using (public.is_org_member(org_id));

create policy "Users see their profile" on public.profiles
  for select using (user_id = auth.uid());

create policy "Users update their profile" on public.profiles
  for update using (user_id = auth.uid());

create policy "Users insert their profile" on public.profiles
  for insert with check (user_id = auth.uid());

create policy "Org-scoped clientes select" on public.clientes
  for select using (public.is_org_member(org_id));

create policy "Org-scoped clientes insert" on public.clientes
  for insert with check (public.is_org_member(org_id));

create policy "Org-scoped clientes update" on public.clientes
  for update using (public.is_org_member(org_id));

create policy "Org-scoped clientes delete" on public.clientes
  for delete using (public.is_org_member(org_id));

create policy "Org-scoped prestamos select" on public.prestamos
  for select using (public.is_org_member(org_id));

create policy "Org-scoped prestamos insert" on public.prestamos
  for insert with check (public.is_org_member(org_id));

create policy "Org-scoped prestamos update" on public.prestamos
  for update using (public.is_org_member(org_id));

create policy "Org-scoped prestamos delete" on public.prestamos
  for delete using (public.is_org_member(org_id));

create policy "Org-scoped cuotas select" on public.cuotas
  for select using (
    exists (select 1 from public.prestamos p where p.id = cuotas.prestamo_id and public.is_org_member(p.org_id))
  );

create policy "Org-scoped cuotas insert" on public.cuotas
  for insert with check (
    exists (select 1 from public.prestamos p where p.id = cuotas.prestamo_id and public.is_org_member(p.org_id))
  );

create policy "Org-scoped cuotas update" on public.cuotas
  for update using (
    exists (select 1 from public.prestamos p where p.id = cuotas.prestamo_id and public.is_org_member(p.org_id))
  );

create policy "Org-scoped cuotas delete" on public.cuotas
  for delete using (
    exists (select 1 from public.prestamos p where p.id = cuotas.prestamo_id and public.is_org_member(p.org_id))
  );

create policy "Org-scoped cobros select" on public.cobros
  for select using (public.is_org_member(org_id));

create policy "Org-scoped cobros insert" on public.cobros
  for insert with check (public.is_org_member(org_id));

create policy "Org-scoped cobros update" on public.cobros
  for update using (public.is_org_member(org_id));

create policy "Org-scoped cobros delete" on public.cobros
  for delete using (public.is_org_member(org_id));

create policy "User-scoped notif select" on public.notificaciones
  for select using (user_id = auth.uid());

create policy "User-scoped notif insert" on public.notificaciones
  for insert with check (user_id = auth.uid());

create policy "User-scoped notif update" on public.notificaciones
  for update using (user_id = auth.uid());

create policy "User-scoped notif delete" on public.notificaciones
  for delete using (user_id = auth.uid());

-- =====================================================================
-- Trigger: crear profile al signup
-- =====================================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (user_id, full_name, color)
  values (new.id, new.email, '#D4AF37')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- RPC: create_organization
-- Crea una organización + agrega al usuario actual como admin.
-- SECURITY DEFINER bypasea RLS para evitar el chicken-and-egg.
-- =====================================================================

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

  insert into public.organizations (nombre, slug)
  values (org_nombre, org_slug)
  returning id into new_org_id;

  insert into public.org_members (org_id, user_id, rol)
  values (new_org_id, current_user_id, 'admin');

  insert into public.profiles (user_id, full_name, color)
  values (current_user_id, org_nombre, '#D4AF37')
  on conflict (user_id) do nothing
  ;

  return new_org_id;
end;
$$;

grant execute on function public.create_organization(text, text) to authenticated;

-- =====================================================================
-- Settings de Auth (configurar en Dashboard → Authentication → Providers)
-- =====================================================================
-- 1. Email provider: HABILITADO (default)
-- 2. Confirm email: RECOMENDADO activar (Authentication → Sign In/Up → Confirm email)
-- 3. Password strength: Mínimo 6 caracteres
-- 4. Email templates: personalizar si querés branding
-- =====================================================================
