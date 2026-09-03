import React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Wallet, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { IconBox } from '../../../components/ui/IconBox';
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
  const meta = agotadas ? { tone: 'warning', label: 'Cuotas agotadas' } : STATUS_META[status];
  const cuota = prestamosService.cuotaDelPeriodo(prestamo);
  const prox = prestamosService.proximoCobro(prestamo);
  const saldo = prestamosService.getSaldoCapital(prestamo);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const menuBtnRef = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    function onKey(e) {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        menuBtnRef.current?.focus();
      }
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

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen?.(prestamo);
    }
  }

  const toneIcon = agotadas
    ? 'amber'
    : status === 'atrasado'
      ? 'rose'
      : status === 'cancelado'
        ? 'neutral'
        : 'emerald';

  return (
    <Card padding="md" hover>
      <div
        role="button"
        tabIndex={0}
        onClick={() => onOpen?.(prestamo)}
        onKeyDown={handleKeyDown}
        aria-label={`Préstamo ${formatCRC(prestamo.monto)} - ${meta.label}`}
        className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-navy-900 rounded-input"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <IconBox icon={Wallet} tone={toneIcon} size="md" />
            <div>
              <div className="flex items-center gap-2">
                <p className="text-base font-bold text-navy-900 dark:text-white">
                  {formatCRC(prestamo.monto)}
                </p>
                <Badge tone={meta.tone}>{meta.label}</Badge>
              </div>
              <p className="mt-0.5 text-xs text-neutral-500 dark:text-navy-300">
                {labelPeriodo(prestamo.periodo)} · {prestamo.n_cuotas || prestamo.nCuotas} cuotas ·{' '}
                {prestamo.tasa}%
              </p>
            </div>
          </div>
          {(onEdit || onDelete) && prestamo.estado !== 'cancelado' && (
            <div ref={menuRef} className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
              <button
                ref={menuBtnRef}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen((v) => !v);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-input text-neutral-500 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-navy-300 dark:hover:bg-navy-700"
                aria-label="Acciones del préstamo"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <MoreVertical className="h-4 w-4" aria-hidden="true" />
              </button>
              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 z-20 mt-1 w-44 origin-top-right rounded-input bg-white p-1 shadow-cardHover animate-fade-in border border-slate-100 dark:bg-navy-800 dark:border-navy-700"
                >
                  {onEdit && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleEdit}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-navy-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-navy-100 dark:hover:bg-navy-700"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      Editar
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleDelete}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-danger-600 transition-colors hover:bg-danger-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-danger-500 dark:hover:bg-danger-500/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
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
            <p className="section-label">Cuota</p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-navy-900 dark:text-white">
              {formatCRC(cuota)}
            </p>
          </div>
          <div>
            <p className="section-label">Saldo</p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-navy-900 dark:text-white">
              {formatCRC(saldo)}
            </p>
          </div>
          <div>
            <p className="section-label">{status === 'cancelado' ? 'Final' : 'Próx. cobro'}</p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-navy-900 dark:text-white">
              {prox ? formatDate(prox.fecha) : '—'}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
