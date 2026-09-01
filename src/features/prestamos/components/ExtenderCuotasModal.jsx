import { useEffect } from 'react';
import { X, Plus, Loader2, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import { formatCRC, formatDate } from '../../../lib/format';
import { useExtenderCuotas } from '../hooks/useExtenderCuotas';

const inputBase = clsx(
  'w-full rounded-xl border bg-white px-3.5 py-3 text-base outline-none transition-colors tabular-nums',
  'placeholder:text-slate-400 dark:placeholder:text-navy-300',
  'text-navy-900 dark:text-white',
  'border-slate-200 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20',
  'dark:bg-navy-800 dark:border-navy-700 dark:focus:border-gold-400',
);

export function ExtenderCuotasModal({ prestamo, onClose, onSaved }) {
  const form = useExtenderCuotas({ prestamo });

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

  if (!prestamo) {
    return (
      <Shell onClose={onClose} title="Extender cuotas">
        <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          <AlertCircle className="h-5 w-5 shrink-0" />
          Préstamo no encontrado
        </div>
      </Shell>
    );
  }

  const totalInteres = form.preview.reduce((s, c) => s + c.monto, 0);

  return (
    <Shell onClose={onClose} title="Extender cuotas">
      <div className="space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-navy-700 dark:bg-navy-700/40">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-navy-300">
            Cuotas actuales
          </p>
          <p className="mt-1 text-base font-bold text-navy-900 dark:text-white">
            {prestamo.cuotas.length} {prestamo.cuotas.length === 1 ? 'cuota' : 'cuotas'} cerradas · {prestamo.cuotas.filter((c) => c.estado === 'pagada').length} pagadas
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-navy-300">
            Agregá nuevas cuotas para continuar cobrando intereses sobre el saldo pendiente.
          </p>
        </div>

        <label className="block">
          <span className="mb-1.5 flex items-center justify-between text-sm font-medium text-navy-700 dark:text-navy-100">
            <span>
              N° de cuotas a agregar <span className="ml-0.5 text-rose-500">*</span>
            </span>
            <span className="text-[10px] font-normal text-slate-400 dark:text-navy-300">
              1 a 60
            </span>
          </span>
          <input
            type="text"
            inputMode="numeric"
            value={form.nCuotas ? String(form.nCuotas) : ''}
            onChange={(e) => form.setN(e.target.value)}
            placeholder="2"
            className={inputBase}
          />
          {form.error && (
            <p className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
              {form.error}
            </p>
          )}
        </label>

        {form.preview.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-navy-300">
              Vista previa
            </p>
            <Card>
              <ul className="divide-y divide-slate-100 dark:divide-navy-700/60">
                {form.preview.map((c) => (
                  <li key={c.numero} className="flex items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-sm font-semibold text-navy-900 dark:text-white">
                        Cuota #{c.numero}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-navy-300">
                        {formatDate(c.fecha)}
                      </p>
                    </div>
                    <p className="text-sm font-bold tabular-nums text-navy-900 dark:text-white">
                      {formatCRC(c.monto)}
                    </p>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 dark:border-navy-700/60">
                <span className="text-xs font-medium text-slate-600 dark:text-navy-300">
                  Total en intereses
                </span>
                <span className="text-sm font-bold tabular-nums text-gold-600 dark:text-gold-300">
                  {formatCRC(totalInteres)}
                </span>
              </div>
            </Card>
          </div>
        )}
      </div>

      <Footer>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl px-4 py-2.5 text-sm font-semibold text-navy-700 transition-colors hover:bg-slate-100 dark:text-navy-100 dark:hover:bg-navy-700"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={Boolean(form.error) || form.submitting}
          className={clsx(
            'inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold transition-all',
            'bg-gold-gradient text-navy-900 shadow-glow',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none',
          )}
        >
          {form.submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Extender cuotas
        </button>
      </Footer>
    </Shell>
  );
}

function Shell({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch bg-navy-900/60 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div className="flex w-full flex-col bg-white shadow-cardHover sm:max-w-lg sm:rounded-3xl dark:bg-navy-800 animate-slide-up">
        <header className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 dark:border-navy-700">
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-navy-300 dark:hover:bg-navy-700"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
          <h2 className="text-sm font-bold text-navy-900 dark:text-white">{title}</h2>
          <div className="w-9" />
        </header>
        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">{children}</div>
      </div>
    </div>
  );
}

function Card({ children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card dark:border-navy-700 dark:bg-navy-800">
      {children}
    </div>
  );
}

function Footer({ children }) {
  return (
    <footer className="sticky bottom-0 z-10 flex items-center justify-end gap-2 border-t border-slate-100 bg-white/95 px-4 py-3 backdrop-blur dark:border-navy-700 dark:bg-navy-800/95">
      {children}
    </footer>
  );
}