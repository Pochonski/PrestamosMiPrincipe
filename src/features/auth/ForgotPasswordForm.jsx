import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, Mail, CheckCircle2, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';
import { supabase } from '../../lib/supabase';
import { describeAuthError } from './errors';
import { Input } from './components/Input';

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
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-navy-900 dark:text-white">Revisá tu email</h2>
        <p className="text-sm text-slate-600 dark:text-navy-300">
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
        <div
          className={clsx(
            'flex items-start gap-2 rounded-2xl border p-3 text-sm',
            errorMeta.variant === 'warning'
              ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300'
              : 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300',
          )}
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-80">
              {errorMeta.title}
            </p>
            <p>{errorMeta.message}</p>
          </div>
        </div>
      )}
      <Input
        type="email"
        label="Email"
        placeholder="tu@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        icon={Mail}
        required
        autoComplete="email"
        autoFocus
      />
      <button
        type="submit"
        disabled={submitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gold-gradient px-5 py-3.5 text-base font-bold text-navy-900 shadow-glow transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
      >
        {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
        Enviar link de recuperación
      </button>
      <button
        type="button"
        onClick={() => navigate(redirectTo)}
        className="inline-flex w-full items-center justify-center gap-1 rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:text-navy-200 dark:hover:bg-navy-700"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Volver a iniciar sesión
      </button>
    </form>
  );
}