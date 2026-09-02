import { useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { Stepper } from '../../../components/ui/Stepper';
import { Step1RutaPeriodo } from './steps/Step1RutaPeriodo';
import { Step2Monto } from './steps/Step2Monto';
import { Step3CuotasTasa } from './steps/Step3CuotasTasa';
import { Step4Fechas } from './steps/Step4Fechas';
import { Step5Resumen } from './steps/Step5Resumen';
import { usePrestamoForm } from '../hooks/usePrestamoForm';

const STEPS = [
  { num: 1, label: 'Ruta y período' },
  { num: 2, label: 'Monto' },
  { num: 3, label: 'Cuotas y tasa' },
  { num: 4, label: 'Fechas' },
  { num: 5, label: 'Resumen' },
];

export function PrestamoEditModal({ prestamo, onClose, onSaved }) {
  const form = usePrestamoForm({ initialPrestamo: prestamo });

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

  async function handleSave() {
    const res = await form.submit();
    if (res.ok) {
      onSaved?.(res.prestamo);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch bg-navy-900/60 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
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
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 dark:text-navy-300 dark:hover:bg-navy-700"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
          <h2 className="text-sm font-bold text-navy-900 dark:text-white">Editar préstamo</h2>
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
            <Step5Resumen values={form.values} cliente={null} />
          )}
        </div>

        <footer className="sticky bottom-0 z-10 flex items-center justify-between gap-2 border-t border-slate-100 bg-white/95 px-4 py-3 backdrop-blur dark:border-navy-700 dark:bg-navy-800/95">
          {form.step > 1 ? (
            <button
              type="button"
              onClick={form.prevStep}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-navy-700 transition-colors hover:bg-slate-100 dark:text-navy-100 dark:hover:bg-navy-700"
            >
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
              className="inline-flex items-center gap-1.5 rounded-xl bg-gold-gradient px-4 py-2.5 text-sm font-bold text-navy-900 shadow-glow transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            >
              Siguiente
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              disabled={form.submitting || !form.allValid}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gold-gradient px-4 py-2.5 text-sm font-bold text-navy-900 shadow-glow transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            >
              {form.submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar cambios
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
