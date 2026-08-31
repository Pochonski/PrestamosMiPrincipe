import { Link } from 'react-router-dom';
import { AuthBranding } from './AuthBranding';
import { LoginForm } from './LoginForm';
import { GlassCard } from './components/GlassCard';
import { Logo } from '../../components/ui/Logo';
import { MeshGradient } from './components/MeshGradient';
import { ArrowLeft } from 'lucide-react';

export function SignupPage() {
  return (
    <div className="grid min-h-screen grid-cols-1 bg-slate-50 dark:bg-navy-950 lg:grid-cols-2">
      <AuthBranding />

      <div className="relative flex items-center justify-center overflow-hidden p-6 sm:p-10">
        <div className="absolute inset-0 lg:hidden">
          <MeshGradient />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50 to-gold-50/30 dark:hidden" />
        <div className="absolute inset-0 hidden bg-navy-900/95 dark:block" />

        <div className="relative w-full max-w-md">
          <Link
            to="/login"
            className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-navy-700 dark:text-navy-300 dark:hover:text-white lg:hidden"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver
          </Link>

          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold-gradient shadow-glow">
              <Logo withText={false} className="h-6 w-6" />
            </div>
            <div>
              <p className="text-base font-bold text-navy-900 dark:text-white">Préstamos Mi Príncipe</p>
            </div>
          </div>

          <GlassCard className="p-6 sm:p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-navy-900 dark:text-white sm:text-3xl">
                Crear cuenta
              </h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-navy-300">
                Empezá a gestionar tu cartera en minutos.
              </p>
            </div>
            <LoginForm mode="signup" />
            <p className="mt-6 text-center text-sm text-slate-600 dark:text-navy-300">
              ¿Ya tenés cuenta?{' '}
              <Link
                to="/login"
                className="font-semibold text-gold-600 hover:text-gold-700 dark:text-gold-300 dark:hover:text-gold-200"
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