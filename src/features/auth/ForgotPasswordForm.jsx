import React from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { describeAuthError } from './errors';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { IconBox } from '../../components/ui/IconBox';

export function ForgotPasswordForm({ redirectTo = '/login' }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMeta, setErrorMeta] = useState(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMeta(null);
    setSubmitting(true);
    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + redirectTo,
      });
      if (resetErr) throw resetErr;
      setSent(true);
    } catch (err) {
      setErrorMeta(describeAuthError(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="space-y-5 text-center">
        <div className="mx-auto">
          <IconBox icon={CheckCircle2} tone="emerald" size="lg" ring />
        </div>
        <h2 className="text-xl font-bold text-navy-900 dark:text-white">Revisá tu email</h2>
        <p className="text-sm text-neutral-600 dark:text-navy-300">
          Te enviamos un link para restablecer tu contraseña a{' '}
          <strong className="text-navy-900 dark:text-white">{email}</strong>.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center gap-1 text-sm font-semibold text-gold-600 hover:text-gold-700 dark:text-gold-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver a iniciar sesión
        </Link>
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
        type="email"
        name="email"
        label="Email"
        placeholder="tu@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        icon={Mail}
        required
        autoComplete="email"
        autoFocus
      />
      <Button type="submit" variant="primary" size="lg" fullWidth loading={submitting}>
        Enviar link de recuperación
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="md"
        fullWidth
        icon={ArrowLeft}
        onClick={() => navigate(redirectTo)}
      >
        Volver a iniciar sesión
      </Button>
    </form>
  );
}
