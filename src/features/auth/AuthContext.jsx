import React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { supabase, invalidateOrgCache } from '../../lib/supabase';
import { AuthContext } from './authContextValue';

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [currentOrg, setCurrentOrg] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      setCurrentOrg(null);
      return;
    }
    const { data: prof, error: profErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (profErr) {
      console.warn('[auth] profiles select failed', profErr);
    }
    const { data: membership, error: memErr } = await supabase
      .from('org_members')
      .select('org_id, rol, organizations(*)')
      .eq('user_id', userId)
      .maybeSingle();
    if (memErr) {
      console.warn('[auth] org_members select failed', memErr);
    }
    setProfile(prof);
    if (membership) {
      setCurrentOrg({
        ...membership.organizations,
        rol: membership.rol,
      });
    } else {
      setCurrentOrg(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user?.id) {
      invalidateOrgCache();
      await loadProfile(session.user.id);
    }
  }, [session, loadProfile]);

  async function forceSignOut() {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    setSession(null);
    setProfile(null);
    setCurrentOrg(null);
  }

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!mounted) return;
      if (error || !data.session) {
        setSession(null);
        setLoading(false);
        return;
      }
      setSession(data.session);
      if (data.session?.user) {
        await loadProfile(data.session.user.id);
      }
      setLoading(false);
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (event === 'SIGNED_OUT' || !newSession) {
          setSession(null);
          setProfile(null);
          setCurrentOrg(null);
          return;
        }
        if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
          setSession(newSession);
          if (newSession?.user) {
            await loadProfile(newSession.user.id);
          }
        }
      },
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const rol = currentOrg?.rol ?? null;
  const isOwner = rol === 'owner';
  const isAdmin = rol === 'owner' || rol === 'admin';
  const isViewer = rol === 'viewer';
  const canInvite = rol === 'owner' || rol === 'admin' || rol === 'cobrador';
  const canManageMembers = isAdmin;

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    currentOrg,
    orgId: currentOrg?.id ?? null,
    rol,
    isOwner,
    isAdmin,
    isViewer,
    canInvite,
    canManageMembers,
    loading,
    signOut: forceSignOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}