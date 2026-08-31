import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, AlertCircle, AlertTriangle, KeyRound } from 'lucide-react';
import clsx from 'clsx';
import { supabase } from '../../lib/supabase';
import { Input } from './components/Input';
import { SocialButton } from './components/SocialButton';

function describeError(err) {
  const status = err?.status ?? err?.response?.status;
  const code = err?.code || err?.error_code;
  const raw = String(err?.message || err?.error_description || '').toLowerCase();

  if (status === 429 || raw.includes('rate limit')) {
    return {
      title: 'Demasiados intentos',
      message: 'Supabase está limitando las peticiones. Esperá 1-2 minutos e intentá de nuevo.',
      variant: 'warning',
    };
  }
  if (status === 422 || code === 'user_already_exists' || raw.includes('already registered')) {
    return {
      title: 'Email ya registrado',
      message: 'Este email ya tiene cuenta. Iniciá sesión con tu contraseña, o usá "¿Olvidaste tu contraseña?"',
      variant: 'info',
    };
  }
  if (status === 400 && raw.includes('email not confirmed')) {
    return {
      title: 'Email sin confirmar',
      message: 'Revisá tu casilla (incluido spam) y hacé click en el link de confirmación.',
      variant: 'info',
    };
  }
  if (status === 400 && (raw.includes('password') || raw.includes('credential'))) {
    return {
      title: 'Contraseña incorrecta',
      message: 'La contraseña ingresada no es válida. Si no la recordás, usá "¿Olvidaste tu contraseña?"',
      variant: 'error',
    };
  }
  if (status === 401 || status === 403 || raw.includes('invalid login')) {
    return {
      title: 'Credenciales inválidas',
      message: 'No encontramos una cuenta con ese email y contraseña. Verificá los datos o creá una cuenta nueva.',
      variant: 'error',
    };
  }
  if (status === 422 && raw.includes('email')) {
    return {
      title: 'Email inválido',
      message: 'El formato del email no es correcto. Usá un email válido (ej: juan@gmail.com).',
      variant: 'error',
    };
  }
  if (status >= 500) {
    return {
      title: 'Error del servidor',
      message: 'Supabase tuvo un problema. Esperá unos segundos e intentá de nuevo.',
      variant: 'error',
    };
  }
  return {
    title: 'Error',
    message: err?.message || 'Error inesperado. Intentá de nuevo.',
    variant: 'error',
  };
}

export function LoginForm({ mode = 'signin', onAuth, redirectTo = '/' }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [errorMeta, setErrorMeta] = useState(null);
  const [info, setInfo] = useState(null);
  const [remember, setRemember] = useState(true);

  const isSignUp = mode === 'signup';

  function clearErrors() {
    setError(null);
    setErrorMeta(null);
    setInfo(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    clearErrors();
    setSubmitting(true);
    try {
      if (isSignUp) {
        const { error: signUpErr } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (signUpErr) throw signUpErr;
        setInfo('Cuenta creada. Si "Confirm email" está activo, revisá tu casilla. Si no, ya podés iniciar sesión.');
      } else {
        const { data, error: signInErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInErr) throw signInErr;
        if (!remember) {
          await supabase.auth.updateUser({ data: { remember: false } });
        }
        onAuth?.(data.session);
        navigate(redirectTo, { replace: true });
      }
    } catch (err) {
      const meta = describeError(err);
      setErrorMeta(meta);
      setError(meta.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleForgot() {
    if (!email) {
      setErrorMeta({
        title: 'Email requerido',
        message: 'Ingresá tu email arriba y volvé a tocar "¿Olvidaste tu contraseña?".',
        variant: 'info',
      });
      setError('Ingresá tu email arriba primero');
      return;
    }
    clearErrors();
    setSubmitting(true);
    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/login',
      });
      if (resetErr) throw resetErr;
      setInfo(`Te enviamos un link de recuperación a ${email}.`);
    } catch (err) {
      const meta = describeError(err);
      setErrorMeta(meta);
      setError(meta.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle() {
    clearErrors();
    setSubmitting(true);
    try {
      const { error: oauthErr } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + redirectTo },
      });
      if (oauthErr) throw oauthErr;
    } catch (err) {
      const meta = describeError(err);
      setErrorMeta(meta);
      setError(meta.message);
      setSubmitting(false);
    }
  }

  async function handleResendConfirmation() {
    clearErrors();
    if (!email) {
      setErrorMeta({
        title: 'Email requerido',
        message: 'Ingresá el email con el que te registraste arriba.',
        variant: 'info',
      });
      setError('Ingresá tu email arriba primero');
      return;
    }
    setSubmitting(true);
    try {
      const { error: resendErr } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: window.location.origin + '/login' },
      });
      if (resendErr) throw resendErr;
      setInfo(`Reenviamos el email de confirmación a ${email}.`);
    } catch (err) {
      const meta = describeError(err);
      setErrorMeta(meta);
      setError(meta.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && errorMeta && (
        <div
          className={clsx(
            'flex items-start gap-2 rounded-2xl border p-3 text-sm',
            errorMeta.variant === 'warning' &&
              'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300',
            errorMeta.variant === 'info' &&
              'border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-300',
            (errorMeta.variant === 'error' || !errorMeta.variant) &&
              'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300',
          )}
        >
          {errorMeta.variant === 'warning' ? (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <div className="flex-1">
            {errorMeta.title && (
              <p className="text-xs font-semibold uppercase tracking-wider opacity-80">
                {errorMeta.title}
              </p>
            )}
            <p className="text-sm">{error}</p>
            {errorMeta.title?.includes('Credenciales inválidas') && (
              <button
                type="button"
                onClick={handleForgot}
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold underline opacity-90 hover:opacity-100"
              >
                <KeyRound className="h-3 w-3" />
                Recuperar contraseña
              </button>
            )}
            {errorMeta.title?.includes('Email sin confirmar') && (
              <button
                type="button"
                onClick={handleResendConfirmation}
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold underline opacity-90 hover:opacity-100"
              >
                Reenviar email de confirmación
              </button>
            )}
          </div>
        </div>
      )}

      {info && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300">
          {info}
        </div>
      )}

      {isSignUp && (
        <Input
          type="text"
          label="Nombre completo"
          placeholder="Ej: María Solís"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          autoComplete="name"
          required
        />
      )}

      <Input
        type="email"
        label="Email"
        placeholder="tu@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        icon={Mail}
        required
      />

      <Input
        type="password"
        label="Contraseña"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete={isSignUp ? 'new-password' : 'current-password'}
        icon={Lock}
        required
        minLength={6}
      />

      {!isSignUp && (
        <div className="flex items-center justify-between text-sm">
          <label className="inline-flex cursor-pointer items-center gap-2 text-slate-600 dark:text-navy-200">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-gold-500 focus:ring-gold-400"
              style={{ accentColor: '#D4AF37' }}
            />
            Recordarme
          </label>
          <button
            type="button"
            onClick={handleForgot}
            disabled={submitting}
            className="font-semibold text-gold-600 hover:text-gold-700 disabled:opacity-60 dark:text-gold-300 dark:hover:text-gold-200"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gold-gradient px-5 py-3.5 text-base font-bold text-navy-900 shadow-glow transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
      >
        {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
        {isSignUp ? 'Crear cuenta' : 'Iniciar sesión'}
      </button>

      {!isSignUp && (
        <>
          <div className="relative my-4 flex items-center">
            <div className="flex-1 border-t border-slate-200 dark:border-navy-700" />
            <span className="px-3 text-xs uppercase tracking-wider text-slate-400 dark:text-navy-300">
              o continuar con
            </span>
            <div className="flex-1 border-t border-slate-200 dark:border-navy-700" />
          </div>

          <SocialButton
            onClick={handleGoogle}
            icon={() => (
              <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
          >
            Google
          </SocialButton>
        </>
      )}
    </form>
  );
}