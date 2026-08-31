import { AlertTriangle } from 'lucide-react';
import { Card } from '../../../components/ui/Card';

export function RestoreConfirm({ backupDate, onConfirm, onCancel }) {
  let label = 'fecha desconocida';
  if (backupDate) {
    try {
      label = new Date(backupDate).toLocaleString('es-CR', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
      });
    } catch {
      label = 'fecha inválida';
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-navy-900/60 backdrop-blur-sm sm:items-center"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel?.(); }}
    >
      <Card className="w-full max-w-md rounded-t-3xl sm:rounded-3xl">
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-bold text-navy-900 dark:text-white">
                Restaurar datos
              </h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-navy-300">
                Vas a reemplazar TODOS los datos actuales por los del respaldo del{' '}
                <strong className="text-navy-900 dark:text-white">{label}</strong>. Esta acción no se puede deshacer.
              </p>
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
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-rose-700"
            >
              Restaurar
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}