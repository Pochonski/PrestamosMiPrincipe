import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, KeyRound } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { describeAuthError as describeError } from './errors';

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
              className="!h-9 !px-2 !text-xs sm:!h-7"
            >
              Recuperar contraseña
            </Button>
          )}
          {errorMeta.title?.includes('Email sin confirmar') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResendConfirmation}
              className="!h-9 !px-2 !text-xs sm:!h-7"
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
        minLength={isSignUp ? 10 : undefined}
      />

      {!isSignUp && (
        <div className="flex items-center justify-between text-sm">
          <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 text-neutral-600 dark:text-navy-200">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-5 w-5 rounded border-slate-300 text-gold-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/20 dark:bg-white/10 dark:focus-visible:ring-offset-black"
            />
            Recordarme
          </label>
          <button
            type="button"
            onClick={handleForgot}
            disabled={submitting}
            className="font-semibold text-gold-600 hover:text-gold-700 disabled:opacity-50 dark:text-gold-300 dark:hover:text-gold-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black rounded-sm"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>
      )}

      <Button type="submit" variant="primary" size="lg" fullWidth loading={submitting}>
        {isSignUp ? 'Crear cuenta' : 'Iniciar sesión'}
      </Button>
    </form>
  );
}
