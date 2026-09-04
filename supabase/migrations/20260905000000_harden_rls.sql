-- =====================================================================
-- Migración: endurecimiento de RLS para producción
-- Fecha: 2026-09-05 (posterior a org_invites_single que define is_org_admin)
-- ---------------------------------------------------------------------
-- Cierra hueco de seguridad detectado en auditoría pre-producción:
--   org_members permitía inserción directa por un usuario autenticado
--   sin membresía (policy "Org owners can manage members" en schema.sql),
--   lo que permitía auto-insertarse en una organización ajena conociendo
--   el org_id (UUID expuesto por la API).
--
-- La membresía real se crea exclusivamente vía RPC security definer:
--   - public.create_organization(...)
--   - public.accept_invite(...)
-- que bypasean RLS de forma controlada y validada.
-- =====================================================================

drop policy if exists "Org owners can manage members" on public.org_members;
drop policy if exists "org_members insert blocked" on public.org_members;

create policy "org_members insert blocked" on public.org_members
  for insert to authenticated with check (false);