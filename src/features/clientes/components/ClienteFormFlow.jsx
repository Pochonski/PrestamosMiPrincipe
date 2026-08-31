import { useEffect } from 'react';
import { X, ArrowLeft, ArrowRight, Save, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { Stepper } from '../../../components/ui/Stepper';
import { Step1Identidad } from './steps/Step1Identidad';
import { Step2Contacto } from './steps/Step2Contacto';
import { Step3Resumen } from './steps/Step3Resumen';
import { useClienteForm } from '../hooks/useClienteForm';
import * as usuariosService from '../../../services/usuarios';

const STEPS = [
  { num: 1, label: 'Identidad' },
  { num: 2, label: 'Contacto' },
  { num: 3, label: 'Resumen' },
];

export function ClienteFormFlow({ cliente, onClose, onSaved }) {
  const form = useClienteForm({ cliente });
  const actual = usuariosService.getActual();

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose?.();
    }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  function handleSave() {
    const res = form.submit(actual?.id);
    if (res.ok) {
      onSaved?.(res.cliente);
    }
  }

  return (
    <div
      className={clsx(
        'fixed inset-0 z-50 flex items-stretch bg-navy-900/60 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4',
        'animate-fade-in',
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className={clsx(
          'flex w-full flex-col bg-white shadow-cardHover sm:max-w-lg sm:rounded-3xl',
          'dark:bg-navy-800',
          'animate-slide-up',
        )}
        role="dialog"
        aria-modal="true"
      >
        <header className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-slate-100 bg-white/95 px-4 py-3 backdrop-blur dark:border-navy-700 dark:bg-navy-800/95">
          <button
            type="button"
            onClick={onClose}
            className={clsx(
              'flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors',
              'hover:bg-slate-100 dark:text-navy-300 dark:hover:bg-navy-700',
            )}
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
          <h2 className="text-sm font-bold text-navy-900 dark:text-white">
            {form.isEdit ? 'Editar cliente' : 'Nuevo cliente'}
          </h2>
          <div className="w-9" />
        </header>

        <div className="border-b border-slate-100 bg-white px-4 py-3 dark:border-navy-700 dark:bg-navy-800">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-navy-300">
              Paso {form.step} de 3
            </span>
          </div>
          <Stepper steps={STEPS} current={form.step} onJump={form.goToStep} />
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          {form.step === 1 && (
            <Step1Identidad
              values={form.values}
              errors={form.errors}
              showError={form.showError}
              set={form.set}
              touch={form.touch}
            />
          )}
          {form.step === 2 && (
            <Step2Contacto
              values={form.values}
              errors={form.errors}
              showError={form.showError}
              set={form.set}
              touch={form.touch}
            />
          )}
          {form.step === 3 && <Step3Resumen values={form.values} />}
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

          {form.step < 3 ? (
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
              disabled={form.submitting}
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
              {form.isEdit ? 'Guardar cambios' : 'Guardar cliente'}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}