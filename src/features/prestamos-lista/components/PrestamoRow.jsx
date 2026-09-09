import React from 'react';
import { AlertTriangle, ArrowRight, HandCoins, Wallet } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { labelPeriodo } from '../../prestamos/selectors';
import { formatCRC, formatDate } from '../../../lib/format';

function statusBadge(row) {
  if (row.status === 'atrasado') {
    return (
      <Badge tone="danger" icon={AlertTriangle}>
        Atrasado{row.diasAtraso > 0 ? ` · ${row.diasAtraso}d` : ''}
      </Badge>
    );
  }
  if (row.status === 'cancelado') return <Badge tone="success">Cancelado</Badge>;
  return <Badge tone="info">Vigente</Badge>;
}

export function PrestamoRow({ row, onCobrar, onVer }) {
  const { prestamo, cliente } = row;
  const periodoLabel = labelPeriodo(prestamo.periodo);
  const pct = Math.round((row.progreso || 0) * 100);

  return (
    <Card interactive padding="md" onClick={() => onVer?.(row)}>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-input bg-gold-gradient text-navy-900 shadow-glow">
          <Wallet className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-base font-bold text-navy-900 dark:text-white">
              {cliente?.nombre || 'Cliente eliminado'}
            </p>
            {statusBadge(row)}
          </div>
          <p className="mt-0.5 truncate text-xs text-neutral-500 dark:text-navy-300">
            {[cliente?.cedula, cliente?.telefono].filter(Boolean).join(' · ') || '—'}
          </p>
          <p className="mt-0.5 truncate text-xs text-neutral-500 dark:text-navy-300">
            {[prestamo.ruta && `Ruta: ${prestamo.ruta}`, periodoLabel, prestamo.tasa != null && `${prestamo.tasa}%`]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 dark:border-white/10">
        <div>
          <p className="section-label">Cuota a cobrar</p>
          <p className="mt-0.5 text-sm font-bold tabular-nums text-navy-900 dark:text-white">
            {formatCRC(row.cuotaMonto)}
          </p>
        </div>
        <div>
          <p className="section-label">Próxima fecha</p>
          <p className="mt-0.5 text-sm font-semibold tabular-nums text-navy-900 dark:text-white">
            {row.proxima ? `${formatDate(row.proxima.fecha)} · #${row.proxima.numero}` : '—'}
          </p>
        </div>
        <div>
          <p className="section-label">Saldo capital</p>
          <p className="mt-0.5 text-sm font-bold tabular-nums text-navy-900 dark:text-white">
            {formatCRC(row.saldo)}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <div>
          <p className="section-label">Monto original</p>
          <p className="mt-0.5 text-sm font-semibold tabular-nums text-navy-900 dark:text-white">
            {formatCRC(prestamo.monto)}
          </p>
        </div>
        <div>
          <p className="section-label">Cuotas</p>
          <p className="mt-0.5 text-sm font-semibold tabular-nums text-navy-900 dark:text-white">
            {row.pagadas}/{row.totalCuotas}
            {row.vencidas > 0 && (
              <span className="ml-1 text-danger-600 dark:text-danger-500">({row.vencidas} venc.)</span>
            )}
          </p>
        </div>
        <div>
          <p className="section-label">Total a pagar</p>
          <p className="mt-0.5 text-sm font-semibold tabular-nums text-navy-900 dark:text-white">
            {formatCRC(row.totalAPagar)}
          </p>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-navy-300">
          <span>Progreso</span>
          <span className="font-semibold tabular-nums">{pct}%</span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
          <div
            className="h-full rounded-full bg-gold-gradient transition-all"
            style={{ width: `${pct}%` }}
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-white/10">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onVer?.(row);
          }}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-info-600 dark:text-info-500"
        >
          Ver detalle
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
        {(row.status === 'vigente' || row.status === 'atrasado') && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onCobrar?.(row);
            }}
            className="inline-flex items-center gap-1.5 rounded-input bg-gold-gradient px-3 py-1.5 text-xs font-bold text-navy-900 shadow-glow"
          >
            <HandCoins className="h-3.5 w-3.5" aria-hidden="true" />
            Cobrar
          </button>
        )}
      </div>
    </Card>
  );
}
