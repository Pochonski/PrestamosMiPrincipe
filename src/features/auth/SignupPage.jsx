import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AuthBranding } from './AuthBranding';
import { LoginForm } from './LoginForm';
import { GlassCard } from './components/GlassCard';
import { Logo } from '../../components/ui/Logo';
import { MeshGradient } from './components/MeshGradient';

export function SignupPage() {
  return (
    <div className="grid min-h-screen grid-cols-1 bg-neutral-50 dark:bg-navy-900 lg:grid-cols-2">
      <AuthBranding />

      <div className="relative flex items-center justify-center overflow-hidden p-6 sm:p-10">
        <div className="absolute inset-0 lg:hidden">
          <MeshGradient />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-white via-neutral-50 to-gold-50/30 dark:hidden" />
        <div className="absolute inset-0 hidden bg-navy-900/95 dark:block" />

        <div className="relative w-full max-w-md">
          <Link
            to="/login"
            className="mb-6 inline-flex items-center gap-1 rounded-sm text-sm font-medium text-neutral-500 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 dark:text-navy-300 dark:hover:text-white dark:focus-visible:ring-offset-navy-900 lg:hidden"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Volver
          </Link>

          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <span className="flex h-11 w-11 items-center justify-center rounded-card bg-gold-gradient shadow-glow">
              <Logo withText={false} className="h-6 w-6" />
            </span>
            <div>
              <p className="text-base font-bold text-navy-900 dark:text-white">
                Préstamos Mi Príncipe
              </p>
            </div>
          </div>

          <GlassCard className="p-6 sm:p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-extrabold tracking-tight text-navy-900 dark:text-white sm:text-3xl">
                Crear cuenta
              </h1>
              <p className="mt-1 text-sm text-neutral-600 dark:text-navy-300">
                Empezá a gestionar tu cartera en minutos.
              </p>
            </div>
            <LoginForm mode="signup" />
            <p className="mt-6 text-center text-sm text-neutral-600 dark:text-navy-300">
              ¿Ya tenés cuenta?{' '}
              <Link
                to="/login"
                className="rounded-sm font-semibold text-gold-600 hover:text-gold-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 dark:text-gold-300 dark:hover:text-gold-200"
              >
                Iniciar sesión
              </Link>
            </p>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
