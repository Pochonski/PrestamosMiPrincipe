import { useEffect, useState } from 'react';
import { X, ArrowLeft, ArrowRight, Save, Loader2, UserPlus, Search } from 'lucide-react';
import clsx from 'clsx';
import { Stepper } from '../../components/ui/Stepper';
import { Step1RutaPeriodo } from './components/steps/Step1RutaPeriodo';
import { Step2Monto } from './components/steps/Step2Monto';
import { Step3CuotasTasa } from './components/steps/Step3CuotasTasa';
import { Step4Fechas } from './components/steps/Step4Fechas';
import { Step5Resumen } from './components/steps/Step5Resumen';
import { usePrestamoForm } from './hooks/usePrestamoForm';
import { useAuth } from '../auth/useAuth';
import * as clientesService from '../../services/clientes';
import { Avatar } from '../../components/ui/Avatar';

const STEPS = [
  { num: 1, label: 'Ruta y período' },
  { num: 2, label: 'Monto' },
  { num: 3, label: 'Cuotas y tasa' },
  { num: 4, label: 'Fechas' },
  { num: 5, label: 'Resumen' },
];

export function PrestamoCreatePage({ onNavigate, params }) {
  const initialClienteId = params?.clienteId || null;
  const [clienteId, setClienteId] = useState(initialClienteId);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') {
        onNavigate?.(clienteId ? 'cliente-detalle' : 'clientes', clienteId ? { clienteId } : {});
      }
    }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onNavigate, clienteId]);

  if (!clienteId) {
    return <ClientPicker onPick={setClienteId} onClose={() => onNavigate?.('clientes', {})} />;
  }

  return <PrestamoForm clienteId={clienteId} onNavigate={onNavigate} />;
}

function ClientPicker({ onPick, onClose }) {
  const [query, setQuery] = useState('');
  const [clientes, setClientes] = useState([]);
  useEffect(() => {
    let cancelled = false;
    clientesService.buscar(query).then((r) => {
      if (!cancelled) setClientes(r);
    });
    return () => { cancelled = true; };
  }, [query]);
  const inputBase = clsx(
    'w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm outline-none transition-colors',
    'placeholder:text-slate-400 dark:placeholder:text-navy-300',
    'text-navy-900 dark:text-white',
    'border-slate-200 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20',
    'dark:bg-navy-800 dark:border-navy-700 dark:focus:border-gold-400',
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch bg-navy-900/60 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div className="flex w-full flex-col bg-white shadow-cardHover sm:max-w-md sm:rounded-3xl dark:bg-navy-800 animate-slide-up">
        <header className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 dark:border-navy-700">
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-navy-300 dark:hover:bg-navy-700" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
          <h2 className="text-sm font-bold text-navy-900 dark:text-white">Elegí un cliente</h2>
          <div className="w-9" />
        </header>

        <div className="border-b border-slate-100 px-4 py-3 dark:border-navy-700">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-navy-700 dark:bg-navy-800 focus-within:border-gold-400">
            <Search className="h-4 w-4 shrink-0 text-slate-400 dark:text-navy-300" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar cliente..."
              className={clsx(inputBase, 'border-0 bg-transparent px-0 focus:border-0 focus:ring-0')}
            />
          </div>
        </div>

        <div className="max-h-[60vh] flex-1 overflow-y-auto p-3">
          {clientes.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-navy-700 dark:text-navy-300">
                <UserPlus className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-navy-700 dark:text-navy-100">Sin clientes</p>
              <p className="text-xs text-slate-500 dark:text-navy-300">Primero creá un cliente para poder registrar un préstamo.</p>
            </div>
          ) : (
            <ul className="space-y-1">
              {clientes.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => onPick?.(c.id)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-navy-700"
                  >
                    <Avatar nombre={c.nombre} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-navy-900 dark:text-white">{c.nombre}</p>
                      <p className="truncate text-xs text-slate-500 dark:text-navy-300">{c.cedula}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function PrestamoForm({ clienteId, onNavigate }) {
  const form = usePrestamoForm({ clienteId });
  const { user } = useAuth();
  const cliente = clientesService.getById(clienteId);

  function handleSave() {
    const res = form.submit(user?.id);
    if (res.ok) {
      onNavigate?.('cliente-detalle', { clienteId });
    }
  }

  return (
    <div
      className={clsx(
        'fixed inset-0 z-50 flex items-stretch bg-navy-900/60 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4',
        'animate-fade-in',
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) onNavigate?.('cliente-detalle', { clienteId });
      }}
    >
      <div
        className={clsx(
          'flex w-full flex-col bg-white shadow-cardHover sm:max-w-2xl sm:rounded-3xl',
          'dark:bg-navy-800',
          'animate-slide-up',
        )}
        role="dialog"
        aria-modal="true"
      >
        <header className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-slate-100 bg-white/95 px-4 py-3 backdrop-blur dark:border-navy-700 dark:bg-navy-800/95">
          <button
            type="button"
            onClick={() => onNavigate?.('cliente-detalle', { clienteId })}
            className={clsx(
              'flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors',
              'hover:bg-slate-100 dark:text-navy-300 dark:hover:bg-navy-700',
            )}
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
          <h2 className="text-sm font-bold text-navy-900 dark:text-white">
            Nuevo préstamo
          </h2>
          <div className="w-9" />
        </header>

        <div className="border-b border-slate-100 bg-white px-4 py-3 dark:border-navy-700 dark:bg-navy-800">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-navy-300">
              Paso {form.step} de 5
            </span>
          </div>
          <Stepper steps={STEPS} current={form.step} onJump={form.goToStep} />
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          {form.step === 1 && (
            <Step1RutaPeriodo
              values={form.values}
              errors={form.errors}
              showError={form.showError}
              set={form.set}
              touch={form.touch}
            />
          )}
          {form.step === 2 && (
            <Step2Monto
              values={form.values}
              errors={form.errors}
              showError={form.showError}
              set={form.set}
              touch={form.touch}
            />
          )}
          {form.step === 3 && (
            <Step3CuotasTasa
              values={form.values}
              errors={form.errors}
              showError={form.showError}
              set={form.set}
              touch={form.touch}
            />
          )}
          {form.step === 4 && (
            <Step4Fechas
              values={form.values}
              errors={form.errors}
              showError={form.showError}
              set={form.set}
              touch={form.touch}
            />
          )}
          {form.step === 5 && (
            <Step5Resumen values={form.values} cliente={cliente} />
          )}
        </div>

        <footer className="sticky bottom-0 z-10 flex items-center justify-between gap-2 border-t border-slate-100 bg-white/95 px-4 py-3 backdrop-blur dark:border-navy-700 dark:bg-navy-800/95">
          {form.step > 1 ? (
            <button
              type="button"
              onClick={form.prevStep}
              className={clsx(
                'inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors',
                'text-navy-700 hover:bg-slate-100',
                'dark:text-navy-100 dark:hover:bg-navy-700',
              )}
            >
              <ArrowLeft className="h-4 w-4" />
              Atrás
            </button>
          ) : (
            <span />
          )}

          {form.step < 5 ? (
            <button
              type="button"
              onClick={form.nextStep}
              disabled={!form.stepIsValid}
              className={clsx(
                'inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold transition-all',
                'bg-gold-gradient text-navy-900 shadow-glow',
                'disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none',
              )}
            >
              Siguiente
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              disabled={form.submitting || !form.allValid}
              className={clsx(
                'inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold transition-all',
                'bg-gold-gradient text-navy-900 shadow-glow',
                'disabled:cursor-not-allowed disabled:opacity-50',
              )}
            >
              {form.submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Guardar préstamo
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}

export default PrestamoCreatePage;