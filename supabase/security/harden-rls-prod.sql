-- =====================================================================
-- Endurecimiento de RLS para PRODUCCIÓN
-- Aplicar contra el proyecto remoto (lcdoaegahqhwqzwcortl).
-- Basado en el estado REAL del schema de prod (no en migraciones locales,
-- que están desincronizadas).
--
-- Cierra dos huecos:
--   1) "Users can create orgs": permitía a cualquier autenticado insertar
--      una organización directamente. Las orgs solo deben crearse vía el
--      RPC security definer public.create_organization.
--   2) "Org owners can manage members": permitía a un autenticado
--      auto-insertarse en una org ajena conociendo su org_id. La membresía
--      solo debe crearse vía create_organization / accept_invite.
--
-- NOTA: no usa 'false' literal en WITH CHECK de forma que PostgREST lo
-- rechace limpiamente; se usa una expresión que siempre es falsa.
-- =====================================================================

-- 1) Bloquear creación directa de organizaciones
drop policy if exists "Users can create orgs" on public.organizations;
drop policy if exists "Users can create orgs (no direct)" on public.organizations;
create policy "Users can create orgs (no direct)" on public.organizations
  for insert to authenticated with check (false);

-- 2) Bloquear inserción directa de membresías
drop policy if exists "Org owners can manage members" on public.org_members;
drop policy if exists "org_members insert blocked" on public.org_members;
create policy "org_members insert blocked" on public.org_members
  for insert to authenticated with check (false);