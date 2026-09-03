import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, KeyRound } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { SocialButton } from './components/SocialButton';
import { describeAuthError as describeError } from './errors';

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
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

  const errorTone =
    errorMeta?.variant === 'warning'
      ? 'warning'
      : errorMeta?.variant === 'info'
        ? 'info'
        : 'danger';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && errorMeta && (
        <Alert tone={errorTone} title={errorMeta.title}>
          <p>{error}</p>
          {errorMeta.title?.includes('Credenciales inválidas') && (
            <Button
              variant="ghost"
              size="sm"
              icon={KeyRound}
              onClick={handleForgot}
              className="!h-7 !px-2 !text-xs"
            >
              Recuperar contraseña
            </Button>
          )}
          {errorMeta.title?.includes('Email sin confirmar') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResendConfirmation}
              className="!h-7 !px-2 !text-xs"
            >
              Reenviar email de confirmación
            </Button>
          )}
        </Alert>
      )}

      {info && <Alert tone="success">{info}</Alert>}

      {isSignUp && (
        <Input
          name="full_name"
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
        name="email"
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
        name="password"
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
          <label className="inline-flex cursor-pointer items-center gap-2 text-neutral-600 dark:text-navy-200">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-gold-500 focus:ring-gold-400 dark:border-navy-600 dark:bg-navy-800"
            />
            Recordarme
          </label>
          <button
            type="button"
            onClick={handleForgot}
            disabled={submitting}
            className="font-semibold text-gold-600 hover:text-gold-700 disabled:opacity-50 dark:text-gold-300 dark:hover:text-gold-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-navy-900 rounded-sm"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>
      )}

      <Button type="submit" variant="primary" size="lg" fullWidth loading={submitting}>
        {isSignUp ? 'Crear cuenta' : 'Iniciar sesión'}
      </Button>

      {!isSignUp && (
        <>
          <div className="relative my-4 flex items-center">
            <div className="flex-1 border-t border-slate-200 dark:border-navy-700" />
            <span className="px-3 text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-navy-300">
              o continuar con
            </span>
            <div className="flex-1 border-t border-slate-200 dark:border-navy-700" />
          </div>

          <SocialButton onClick={handleGoogle} icon={GoogleIcon}>
            Google
          </SocialButton>
        </>
      )}
    </form>
  );
}
