-- =====================================================================
-- Migración: Snapshot histórico de cartera para el dashboard
-- Fecha: 2026-09-07
-- Guarda un snapshot DIARIO de cartera_total, total_atrasado y
-- total_por_cobrar por organización, para calcular deltas históricos
-- reales (vs. mes anterior / vs. ayer) sin inventar datos.
--
-- Alimentación: Opción 1 — la app llama snapshot_cartera() al cargar
-- el dashboard. Es idempotente (on conflict org_id+fecha do update).
-- El primer día no habrá delta; se acumula desde hoy en adelante.
-- =====================================================================

-- 1) Tabla de snapshots
create table if not exists public.cartera_snapshot (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations on delete cascade not null,
  fecha date not null,
  cartera_total numeric not null default 0,
  total_atrasado numeric not null default 0,
  total_por_cobrar numeric not null default 0,
  created_at timestamptz default now(),
  unique (org_id, fecha)
);

create index if not exists idx_cartera_snapshot_org_fecha
  on public.cartera_snapshot(org_id, fecha desc);

-- 2) RLS: los miembros de la org pueden leer sus snapshots
alter table public.cartera_snapshot enable row level security;

drop policy if exists "snapshot select own org" on public.cartera_snapshot;
create policy "snapshot select own org" on public.cartera_snapshot
  for select to authenticated using (public.is_org_member(org_id));

-- (No se permite insert/update/delete directo: todo vía RPC security definer)

-- =====================================================================
-- RPC 1: snapshot_cartera()
-- Calcula y guarda (upsert) el snapshot de HOY para la org del usuario.
-- Idempotente: se puede llamar N veces al día, queda una fila por día.
-- Devuelve: el snapshot guardado (jsonb).
-- =====================================================================
create or replace function public.snapshot_cartera()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_fecha date := current_date;
  v_cartera numeric;
  v_atrasado numeric;
  v_por_cobrar numeric;
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

  -- Cartera total = suma de saldo_capital de préstamos no cancelados
  select coalesce(sum(saldo_capital), 0) into v_cartera
    from public.prestamos
   where org_id = v_org_id
     and estado <> 'cancelado';

  -- Atrasado = cuotas pendientes vencidas (fecha < hoy)
  select coalesce(sum(c.monto), 0) into v_atrasado
    from public.cuotas c
    join public.prestamos p on p.id = c.prestamo_id
   where p.org_id = v_org_id
     and c.estado = 'pendiente'
     and c.fecha < v_fecha;

  -- Por cobrar hoy = cuotas pendientes con fecha = hoy
  select coalesce(sum(c.monto), 0) into v_por_cobrar
    from public.cuotas c
    join public.prestamos p on p.id = c.prestamo_id
   where p.org_id = v_org_id
     and c.estado = 'pendiente'
     and c.fecha = v_fecha;

  insert into public.cartera_snapshot
    (org_id, fecha, cartera_total, total_atrasado, total_por_cobrar)
  values
    (v_org_id, v_fecha, v_cartera, v_atrasado, v_por_cobrar)
  on conflict (org_id, fecha) do update set
    cartera_total = excluded.cartera_total,
    total_atrasado = excluded.total_atrasado,
    total_por_cobrar = excluded.total_por_cobrar,
    created_at = now();

  v_result := jsonb_build_object(
    'org_id', v_org_id,
    'fecha', v_fecha,
    'cartera_total', v_cartera,
    'total_atrasado', v_atrasado,
    'total_por_cobrar', v_por_cobrar
  );

  return v_result;
end;
$$;

grant execute on function public.snapshot_cartera() to authenticated;

-- =====================================================================
-- RPC 2: list_cartera_history(p_days int default 30)
-- Devuelve los snapshots de los últimos N días de la org del usuario,
-- ordenados por fecha ascendente (para charts).
-- =====================================================================
create or replace function public.list_cartera_history(p_days int default 30)
returns table (
  fecha date,
  cartera_total numeric,
  total_atrasado numeric,
  total_por_cobrar numeric
)
language plpgsql
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
    select s.fecha, s.cartera_total, s.total_atrasado, s.total_por_cobrar
      from public.cartera_snapshot s
     where s.org_id = v_org_id
       and s.fecha >= current_date - (p_days - 1)
     order by s.fecha asc;
end;
$$;

grant execute on function public.list_cartera_history(int) to authenticated;