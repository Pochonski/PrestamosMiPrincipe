import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.warn(
    '[supabase] Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. ' +
    'Copiá .env.example a .env y rellená las variables.',
  );
}

export const supabase = createClient(url || 'http://localhost', anonKey || 'public-anon-key', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'pmp:auth',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});

let cachedOrgId = null;
let cachedUserId = null;
let cacheStamp = 0;
const CACHE_TTL_MS = 30_000;

export async function getOrgId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No authenticated user');

  const now = Date.now();
  if (cachedOrgId && cachedUserId === user.id && now - cacheStamp < CACHE_TTL_MS) {
    return cachedOrgId;
  }

  const { data: membership, error } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) throw error;
  if (!membership) throw new Error('User has no organization');

  cachedOrgId = membership.org_id;
  cachedUserId = user.id;
  cacheStamp = now;
  return cachedOrgId;
}

export function invalidateOrgCache() {
  cachedOrgId = null;
  cachedUserId = null;
  cacheStamp = 0;
}