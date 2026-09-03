import React from 'react';
import { ArrowRight, Calendar, Wallet } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { formatCRC, formatDate } from '../../../lib/format';

export function CuotaItem({ item, onCobrar, variant = 'today' }) {
  const { prestamo, cuota, cliente } = item;
  const isAtrasado = variant === 'atrasado';

  return (
    <Card interactive padding="md" onClick={() => onCobrar?.(item)}>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-input bg-gold-gradient text-navy-900 shadow-glow">
          <Wallet className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-base font-bold text-navy-900 dark:text-white">
              {cliente.nombre}
            </p>
            {isAtrasado && <Badge tone="danger">Atrasado</Badge>}
          </div>
          <p className="mt-0.5 truncate text-xs text-neutral-500 dark:text-navy-300">
            {cliente.cedula} · {cliente.telefono}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 dark:border-navy-700/60">
        <div>
          <p className="section-label">Cuota</p>
          <p className="mt-0.5 text-sm font-bold tabular-nums text-navy-900 dark:text-white">
            {formatCRC(cuota.monto)}
          </p>
        </div>
        <div>
          <p className="section-label">Fecha</p>
          <p className="mt-0.5 text-sm font-semibold tabular-nums text-navy-900 dark:text-white">
            {formatDate(cuota.fecha)}
          </p>
        </div>
        <div>
          <p className="section-label">Ruta</p>
          <p className="mt-0.5 truncate text-sm font-semibold text-navy-900 dark:text-white">
            {prestamo.ruta || '—'}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-navy-700/60">
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
            isAtrasado
              ? 'text-danger-600 dark:text-danger-500'
              : 'text-info-600 dark:text-info-500'
          }`}
        >
          <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
          Cuota #{cuota.numero}
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gold-600 dark:text-gold-300">
          Cobrar ahora
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      </div>
    </Card>
  );
}
