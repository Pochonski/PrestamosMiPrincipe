# Migraciones y seguridad de base de datos

## Estado actual (importante)

El proyecto usa Supabase. El esquema de **producción** (proyecto
`lcdoaegahqhwqzwcortl`) tiene un historial de migraciones propio que **no
coincide exactamente** con los timestamps de `supabase/migrations/`. No usar
`supabase db push` contra producción sin antes conciliar ese historial:
podría aplicar migraciones desactualizadas y deshacer cambios.

La forma en que este proyecto ha aplicado cambios de esquema en producción es
**manualmente vía el SQL Editor del Dashboard de Supabase** (como indican los
archivos `src/features/auth/sql/*.sql`).

## Cambios pendientes de aplicar en producción

### Endurecimiento de RLS (seguridad)

`supabase/security/harden-rls-prod.sql` cierra dos huecos de seguridad
detectados en la auditoría pre-producción:

1. **`Users can create orgs`**: permitía a cualquier usuario autenticado
   insertar una organización directamente (sin control de membresía). Se
   reemplaza por una política que bloquea el insert directo.
2. **`Org owners can manage members`**: permitía a un usuario autenticado
   auto-insertarse como miembro de una organización ajena conociendo su
   `org_id`. Se reemplaza por una política que bloquea el insert directo.

La creación de organizaciones y membresías sigue funcionando porque ocurre
exclusivamente vía RPCs `security definer` (`public.create_organization` y
`public.accept_invite`), que bypasean RLS de forma controlada y validada.

**Aplicar con:**
1. Supabase Dashboard → SQL Editor → New query.
2. Pegar el contenido de `supabase/security/harden-rls-prod.sql`.
3. Run.

## Migraciones locales (development/E2E)

`supabase/migrations/` se usa para levantar un Supabase **local** con
`supabase start` (para los tests E2E). Los tests E2E (`npm run test:e2e`)
dependen de que Supabase local esté corriendo con estas migraciones.