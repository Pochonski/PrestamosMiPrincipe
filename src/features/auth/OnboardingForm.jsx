import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Building2, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from './useAuth';
import { Input } from './components/Input';

export function OnboardingForm() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [nombre, setNombre] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  function makeSlug(v) {
    return v
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 32);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!nombre.trim() || !user) return;
    setError(null);
    setSubmitting(true);
    try {
      const slug = makeSlug(nombre) || 'org';
      const { data: orgId, error: rpcErr } = await supabase.rpc('create_organization', {
        org_nombre: nombre.trim(),
        org_slug: slug,
      });
      if (rpcErr) throw rpcErr;
      if (!orgId) throw new Error('No se creó la organización');

      await refreshProfile();
      setDone(true);
      setTimeout(() => navigate('/', { replace: true }), 800);
    } catch (err) {
      setError(err.message || 'Error al crear la organización');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-navy-900 dark:text-white">¡Listo!</h2>
        <p className="text-sm text-slate-600 dark:text-navy-300">
          Tu organización fue creada. Redirigiendo al dashboard...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="rounded-2xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </p>
      )}
      <Input
        type="text"
        label="Nombre del negocio"
        placeholder="Ej: Préstamos Mi Príncipe"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        icon={Building2}
        required
        autoFocus
      />
      <button
        type="submit"
        disabled={submitting || !nombre.trim()}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gold-gradient px-5 py-3.5 text-base font-bold text-navy-900 shadow-glow transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
      >
        {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
        Crear organización
      </button>
    </form>
  );
}