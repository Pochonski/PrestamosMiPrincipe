import { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';
import { Card } from '../../../components/ui/Card';
import { Avatar } from '../../../components/ui/Avatar';

export function DeleteConfirm({ cliente, onConfirm, onCancel }) {
  const [confirmText, setConfirmText] = useState('');
  const needsConfirm = cliente?.nombre?.split(' ')[0] || '';
  const isReady = confirmText.trim().toLowerCase() === needsConfirm.toLowerCase();

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
                Eliminar cliente
              </h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-navy-300">
                Esta acción no se puede deshacer. Se eliminarán también todos los cobros asociados.
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3 dark:bg-navy-700/50">
            <Avatar nombre={cliente?.nombre} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-navy-900 dark:text-white">
                {cliente?.nombre}
              </p>
              <p className="truncate text-xs text-slate-500 dark:text-navy-300">
                {cliente?.cedula}
              </p>
            </div>
          </div>

          <div className="mt-5">
            <label className="block text-xs font-medium text-slate-600 dark:text-navy-300">
              Para confirmar, escribí{' '}
              <strong className="font-bold text-navy-900 dark:text-white">
                {needsConfirm}
              </strong>
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={needsConfirm}
              className={clsx(
                'mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none',
                'border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20',
                'dark:bg-navy-800 dark:border-navy-700 dark:focus:border-rose-400',
                'text-navy-900 dark:text-white placeholder:text-slate-400',
              )}
            />
          </div>

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              className={clsx(
                'rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors',
                'text-navy-700 hover:bg-slate-100',
                'dark:text-navy-100 dark:hover:bg-navy-700',
              )}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={!isReady}
              className={clsx(
                'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all',
                'bg-rose-600 text-white hover:bg-rose-700',
                'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-rose-600',
              )}
            >
              <Trash2 className="h-4 w-4" />
              Eliminar cliente
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}