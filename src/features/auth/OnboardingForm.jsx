import React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from './useAuth';
import { describeAuthError } from './errors';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { IconBox } from '../../components/ui/IconBox';

export function OnboardingForm() {
  const navigate = useNavigate();
  const { user, currentOrg, refreshProfile } = useAuth();
  const [nombre, setNombre] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMeta, setErrorMeta] = useState(null);
  const [done, setDone] = useState(false);
  const redirectTimer = useRef(null);

  useEffect(
    () => () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    },
    [],
  );

  function makeSlug(v) {
    return v
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 32);
  }

  async function tryCreate(slugBase) {
    let lastErr = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const slug = attempt === 0 ? slugBase : `${slugBase}-${attempt + 1}`;
      const { data: orgId, error: rpcErr } = await supabase.rpc('create_organization', {
        org_nombre: nombre.trim(),
        org_slug: slug,
      });
      if (!rpcErr) return { orgId, slug };
      const msg = String(rpcErr.message || '').toLowerCase();
      const isDuplicate = rpcErr.code === '23505' || msg.includes('duplicate') || msg.includes('slug');
      if (isDuplicate && attempt < 4) {
        lastErr = rpcErr;
        continue;
      }
      throw rpcErr;
    }
    throw lastErr;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!nombre.trim() || !user) return;
    setErrorMeta(null);
    setSubmitting(true);
    try {
      const slugBase = makeSlug(nombre) || 'org';
      const { orgId, slug } = await tryCreate(slugBase);
      if (!orgId) throw new Error('No se creó la organización');

      await refreshProfile();
      setDone(true);
      redirectTimer.current = setTimeout(() => navigate(`/${slug}`, { replace: true }), 800);
    } catch (err) {
      const raw = String(err?.message || '').toLowerCase();
      if (raw.includes('already in organization')) {
        setErrorMeta({
          title: 'Ya tenés una organización',
          message: 'Cada usuario solo puede pertenecer a una organización. Redirigiendo al dashboard...',
          variant: 'warning',
        });
        const fallback = currentOrg?.slug ? `/${currentOrg.slug}` : '/';
        setTimeout(() => navigate(fallback, { replace: true }), 1200);
        return;
      }
      setErrorMeta(describeAuthError(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto">
          <IconBox icon={CheckCircle2} tone="emerald" size="lg" ring />
        </div>
        <h2 className="text-xl font-bold text-navy-900 dark:text-white">¡Listo!</h2>
        <p className="text-sm text-neutral-600 dark:text-navy-300">
          Tu organización fue creada. Redirigiendo al dashboard...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMeta && (
        <Alert tone={errorMeta.variant === 'warning' ? 'warning' : 'danger'} title={errorMeta.title}>
          {errorMeta.message}
        </Alert>
      )}
      <Input
        name="org_name"
        label="Nombre del negocio"
        placeholder="Ej: Préstamos Mi Príncipe"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        icon={Building2}
        required
        autoFocus
      />
      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={submitting}
        disabled={!nombre.trim()}
      >
        Crear organización
      </Button>
    </form>
  );
}
