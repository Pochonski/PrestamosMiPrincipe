import { useEffect, useState } from 'react';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { Card } from '../../../components/ui/Card';
import { formatCRC } from '../../../lib/format';

export function DeletePrestamoConfirm({ prestamo, loading, onConfirm, onCancel }) {
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onCancel?.();
    }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onCancel]);

  const expected = (prestamo?.nombre_cliente && prestamo.nombre_cliente.split(' ')[0])
    || prestamo?.id?.slice(0, 6)
    || '';
  const matches = expected.length > 0 && confirmText.trim().toLowerCase() === expected.toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy-900/60 backdrop-blur-sm sm:items-center">
      <Card className="w-full max-w-md rounded-t-3xl sm:rounded-3xl">
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-bold text-navy-900 dark:text-white">
                Eliminar préstamo
              </h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-navy-300">
                Esta acción no se puede deshacer. Se eliminarán también todas las cuotas pendientes.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="rounded-2xl bg-slate-50 px-3 py-3 dark:bg-navy-700/50">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-navy-300">
                Préstamo
              </p>
              <p className="mt-1 text-sm font-semibold text-navy-900 dark:text-white">
                {prestamo?.ruta || '—'}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-navy-300">
                Capital: {formatCRC(prestamo?.monto || 0)} · {prestamo?.n_cuotas || prestamo?.nCuotas || 0} cuotas
              </p>
            </div>

            <div>
              <label className="block">
                <span className="mb-1.5 flex items-center justify-between text-sm font-medium text-navy-700 dark:text-navy-100">
                  <span>Para confirmar, escribí <strong>{expected || 'el id'}</strong></span>
                </span>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={expected || 'ID del préstamo'}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/30 dark:border-navy-700 dark:bg-navy-800"
                  autoFocus
                />
              </label>
            </div>
          </div>

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-navy-700 transition-colors hover:bg-slate-100 dark:text-navy-100 dark:hover:bg-navy-700"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={!matches || loading}
              className={clsx(
                'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors',
                matches && !loading
                  ? 'bg-rose-600 text-white hover:bg-rose-700'
                  : 'bg-slate-200 text-slate-400 dark:bg-navy-700 dark:text-navy-500',
                'disabled:cursor-not-allowed',
              )}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Eliminar préstamo
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
