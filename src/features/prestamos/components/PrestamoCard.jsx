import { useEffect, useRef, useState } from 'react';
import { Wallet, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { formatCRC, formatDate } from '../../../lib/format';
import * as prestamosService from '../../../services/prestamos';
import { labelPeriodo } from '../selectors';

const STATUS_META = {
  vigente: { tone: 'success', label: 'Vigente' },
  atrasado: { tone: 'danger', label: 'Atrasado' },
  cancelado: { tone: 'neutral', label: 'Cancelado' },
};

export function PrestamoCard({ prestamo, onOpen, onEdit, onDelete }) {
  const status = prestamosService.getStatus(prestamo);
  const agotadas = prestamosService.cuotasAgotadas(prestamo);
  const meta = agotadas
    ? { tone: 'warning', label: 'Cuotas agotadas' }
    : STATUS_META[status];
  const cuota = prestamosService.cuotaDelPeriodo(prestamo);
  const prox = prestamosService.proximoCobro(prestamo);
  const saldo = prestamosService.getSaldoCapital(prestamo);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    function onKey(e) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  function handleEdit(e) {
    e.stopPropagation();
    setMenuOpen(false);
    onEdit?.(prestamo);
  }

  function handleDelete(e) {
    e.stopPropagation();
    setMenuOpen(false);
    onDelete?.(prestamo);
  }

  return (
    <Card
      className="p-4 transition-shadow hover:shadow-cardHover sm:p-5"
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => onOpen?.(prestamo)}
        onKeyDown={(e) => { if (e.key === 'Enter') onOpen?.(prestamo); }}
        className="cursor-pointer"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div
              className={clsx(
                'flex h-10 w-10 items-center justify-center rounded-xl',
                agotadas && 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
                !agotadas && status === 'atrasado' && 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300',
                !agotadas && status === 'cancelado' && 'bg-slate-100 text-slate-500 dark:bg-navy-700 dark:text-navy-300',
                !agotadas && status === 'vigente' && 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300',
              )}
            >
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-base font-bold text-navy-900 dark:text-white">
                  {formatCRC(prestamo.monto)}
                </p>
                <Badge tone={meta.tone}>{meta.label}</Badge>
              </div>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-navy-300">
                {labelPeriodo(prestamo.periodo)} · {prestamo.n_cuotas || prestamo.nCuotas} cuotas · {prestamo.tasa}%
              </p>
            </div>
          </div>
          {(onEdit || onDelete) && prestamo.estado !== 'cancelado' && (
            <div ref={menuRef} className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 dark:text-navy-300 dark:hover:bg-navy-700"
                aria-label="Acciones"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 z-20 mt-1 w-44 origin-top-right rounded-xl bg-white p-1 shadow-cardHover border border-slate-100 dark:bg-navy-800 dark:border-navy-700 animate-fade-in"
                >
                  {onEdit && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleEdit}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-navy-700 transition-colors hover:bg-slate-100 dark:text-navy-100 dark:hover:bg-navy-700"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleDelete}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Eliminar
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 dark:border-navy-700/60">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-navy-300">
              Cuota
            </p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-navy-900 dark:text-white">
              {formatCRC(cuota)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-navy-300">
              Saldo
            </p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-navy-900 dark:text-white">
              {formatCRC(saldo)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-navy-300">
              {status === 'cancelado' ? 'Final' : 'Próx. cobro'}
            </p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-navy-900 dark:text-white">
              {prox ? formatDate(prox.fecha) : '—'}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
