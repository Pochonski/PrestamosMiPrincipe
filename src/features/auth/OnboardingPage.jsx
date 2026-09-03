import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useAuth } from './useAuth';
import { OnboardingForm } from './OnboardingForm';
import { GlassCard } from './components/GlassCard';
import { Logo } from '../../components/ui/Logo';
import { MeshGradient } from './components/MeshGradient';
import { Avatar } from '../../components/ui/Avatar';

export function OnboardingPage() {
  const { user, profile, signOut, currentOrg, loading } = useAuth();
  const name = profile?.full_name || user?.email?.split('@')[0] || 'Ahí';

  if (!loading && currentOrg) {
    return <Navigate to={`/${currentOrg.slug}`} replace />;
  }

  return (
    <div className="grid min-h-screen grid-cols-1 bg-neutral-50 dark:bg-navy-900 lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-navy-radial p-12 text-white lg:flex">
        <MeshGradient />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-card bg-gold-gradient shadow-glow">
              <Logo withText={false} className="h-7 w-7" />
            </span>
            <div>
              <p className="text-lg font-bold text-white">Préstamos</p>
              <p className="text-xs font-bold uppercase tracking-widest text-gold-400">Mi Príncipe</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-card bg-gold-500/20 text-gold-300">
            <Sparkles className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Bienvenido,
            <br />
            <span className="bg-gold-gradient bg-clip-text text-transparent">{name}</span>
          </h1>
          <p className="max-w-md text-base text-navy-200">
            Estás a un paso de empezar. Solo necesitamos un nombre para tu organización y todo
            queda listo.
          </p>
        </div>

        <div className="relative z-10 text-xs text-navy-300">
          ¿No sos vos?{' '}
          <button
            type="button"
            onClick={signOut}
            className="rounded-sm font-semibold text-gold-300 hover:text-gold-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-900"
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      <div className="relative flex items-center justify-center overflow-hidden p-6 sm:p-10">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-neutral-50 to-gold-50/30 dark:hidden" />
        <div className="absolute inset-0 hidden bg-navy-900/95 dark:block" />

        <div className="relative w-full max-w-md">
          <Link
            to="/login"
            onClick={signOut}
            className="mb-6 inline-flex items-center gap-1 rounded-sm text-sm font-medium text-neutral-500 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 dark:text-navy-300 dark:hover:text-white dark:focus-visible:ring-offset-navy-900 lg:hidden"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Cambiar de cuenta
          </Link>

          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <Avatar nombre={name} size="md" />
            <div>
              <p className="text-base font-bold text-navy-900 dark:text-white">{name}</p>
              <p className="text-xs text-neutral-500 dark:text-navy-300">{user?.email}</p>
            </div>
          </div>

          <GlassCard className="p-6 sm:p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-extrabold tracking-tight text-navy-900 dark:text-white sm:text-3xl">
                Creá tu organización
              </h1>
              <p className="mt-1 text-sm text-neutral-600 dark:text-navy-300">
                Es el espacio donde vas a registrar tus clientes, préstamos y cobros.
              </p>
            </div>
            <OnboardingForm />
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
