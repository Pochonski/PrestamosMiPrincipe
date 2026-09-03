import React from 'react';
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, Loader2, LogIn } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../auth/useAuth';
import { describeAuthError } from '../../auth/errors';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Alert } from '../../../components/ui/Alert';
import { IconBox } from '../../../components/ui/IconBox';
import * as invitesService from '../../../services/invites';

export function InviteAcceptPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { session, user, currentOrg, refreshProfile, loading } = useAuth();
  const [status, setStatus] = useState('idle'); // idle | accepting | success | error | needsAuth
  const [errorMeta, setErrorMeta] = useState(null);

  useEffect(() => {
    if (loading) return;
    if (!token) {
      setErrorMeta({ title: 'Link inválido', message: 'Token no encontrado.', variant: 'error' });
      setStatus('error');
      return;
    }
    if (!session || !user) {
      // Guardar token para después del login/signup
      try {
        localStorage.setItem('pmp:invite_token', token);
      } catch {}
      setStatus('needsAuth');
      return;
    }
    if (currentOrg) {
      setErrorMeta({
        title: 'Ya tenés una organización',
        message: 'Cada usuario solo puede pertenecer a una organización. Si querés cambiar, pedile al owner que te remueva primero.',
        variant: 'warning',
      });
      setStatus('error');
      return;
    }
    // Auto aceptar si está logueado y sin org
    handleAccept();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, session, user, currentOrg, loading]);

  async function handleAccept() {
    setStatus('accepting');
    setErrorMeta(null);
    try {
      const orgId = await invitesService.acceptInvite(token);
      if (!orgId) throw new Error('No se pudo aceptar la invitación');
      await refreshProfile();
      try {
        localStorage.removeItem('pmp:invite_token');
      } catch {}
      // invalidar cache ya lo hace refreshProfile
      setStatus('success');
      setTimeout(() => navigate('/', { replace: true }), 1000);
    } catch (err) {
      setErrorMeta(describeAuthError(err));
      setStatus('error');
    }
  }

  if (status === 'needsAuth') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-6 dark:bg-navy-900">
        <Card className="w-full max-w-md space-y-4 text-center">
          <IconBox icon={LogIn} tone="gold" size="lg" ring className="mx-auto" />
          <h1 className="text-xl font-bold text-navy-900 dark:text-white">Invitación pendiente</h1>
          <p className="text-sm text-neutral-600 dark:text-navy-300">
            Necesitás iniciar sesión o crear una cuenta con el email invitado para aceptar.
          </p>
          <Alert tone="warning" title="Token guardado">
            Guardamos tu invitación. Después de iniciar sesión te redirigiremos automáticamente.
          </Alert>
          <div className="flex flex-col gap-2">
            <Button variant="primary" fullWidth onClick={() => navigate(`/login?invite=${token}`, { replace: true })}>
              Iniciar sesión
            </Button>
            <Button variant="secondary" fullWidth onClick={() => navigate(`/signup?invite=${token}`, { replace: true })}>
              Crear cuenta
            </Button>
            <Link to="/" className="text-xs text-neutral-500">
              Volver al inicio
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (status === 'accepting' || (loading && status === 'idle')) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-navy-900">
        <Card className="w-full max-w-md space-y-4 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-gold-500" />
          <p className="text-sm font-semibold text-navy-900 dark:text-white">Aceptando invitación...</p>
        </Card>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-6 dark:bg-navy-900">
        <Card className="w-full max-w-md space-y-4 text-center">
          <IconBox icon={CheckCircle2} tone="emerald" size="lg" ring className="mx-auto" />
          <h1 className="text-xl font-bold text-navy-900 dark:text-white">¡Bienvenido a la organización!</h1>
          <p className="text-sm text-neutral-600 dark:text-navy-300">Redirigiendo al dashboard...</p>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-6 dark:bg-navy-900">
        <Card className="w-full max-w-md space-y-4">
          <div className="flex flex-col items-center gap-2 text-center">
            <IconBox icon={AlertTriangle} tone="danger" size="lg" ring className="mx-auto" />
            <h1 className="text-xl font-bold text-navy-900 dark:text-white">{errorMeta?.title || 'Error'}</h1>
          </div>
          <Alert tone={errorMeta?.variant === 'warning' ? 'warning' : 'danger'} title={errorMeta?.title}>
            {errorMeta?.message}
          </Alert>
          <div className="flex flex-col gap-2">
            {session ? (
              <Button variant="primary" fullWidth onClick={() => navigate('/', { replace: true })}>
                Ir al dashboard
              </Button>
            ) : (
              <Button variant="primary" fullWidth onClick={() => navigate('/login', { replace: true })}>
                Iniciar sesión
              </Button>
            )}
            <Button variant="ghost" fullWidth onClick={() => navigate('/', { replace: true })}>
              Volver
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return null;
}

export default InviteAcceptPage;
