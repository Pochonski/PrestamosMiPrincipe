import React from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from './useAuth';
import { stripOrgPrefix } from '../../components/layout/nav-config';
import { Spinner } from '../../components/ui/Spinner';

export function OrgSlugGuard({ children }) {
  const { orgSlug } = useParams();
  const { currentOrg, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-navy-900">
        <Spinner size="lg" tone="gold" />
      </div>
    );
  }

  if (!currentOrg) return <Navigate to="/onboarding" replace />;

  if (!orgSlug || orgSlug !== currentOrg.slug) {
    const isSingleSegment = location.pathname.split('/').filter(Boolean).length === 1;
    const stripped = isSingleSegment ? '/' : stripOrgPrefix(location.pathname);
    const search = location.search || '';
    return <Navigate to={`/${currentOrg.slug}${stripped === '/' ? '' : stripped}${search}`} replace />;
  }

  return children;
}

export function LegacyRedirect() {
  const { currentOrg, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" tone="gold" />
      </div>
    );
  }
  if (!currentOrg) return <Navigate to="/onboarding" replace />;
  const search = location.search || '';
  const path = location.pathname;
  // already has correct slug? OrgSlugGuard will handle, but legacy is for paths without slug
  return <Navigate to={`/${currentOrg.slug}${path === '/' ? '' : path}${search}`} replace />;
}
