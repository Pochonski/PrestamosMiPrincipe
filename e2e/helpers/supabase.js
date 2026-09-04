import { createClient } from '@supabase/supabase-js';

const url = process.env.E2E_SUPABASE_URL || 'http://127.0.0.1:54321';
const anonKey = process.env.E2E_SUPABASE_ANON_KEY || 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export async function seedUser(prefix, password = 'password123') {
  const email = `${prefix}-${Date.now()}@test.local`;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: 'Test E2E' } },
  });
  if (error) throw error;
  if (!data.user) throw new Error('signUp no devolvió user');
  return { email, password, userId: data.user.id };
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

function makeSlug(v) {
  return v
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
}

// Crea un usuario con organización (owner) listo para loguearse e ir directo
// al dashboard, sin pasar por onboarding vía UI.
export async function seedOrgUser(prefix, password = 'password123') {
  const { email, userId } = await seedUser(prefix, password);
  const nombre = `Org ${prefix}`;
  const slug = `${makeSlug(nombre)}-${Date.now()}`;
  const { error: rpcErr } = await supabase.rpc('create_organization', {
    org_nombre: nombre,
    org_slug: slug,
  });
  if (rpcErr) throw rpcErr;
  return { email, password, userId, orgSlug: slug, orgNombre: nombre };
}