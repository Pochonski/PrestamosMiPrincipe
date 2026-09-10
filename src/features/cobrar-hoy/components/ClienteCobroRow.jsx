import React, { useState } from 'react';
import { ChevronDown, ReceiptText } from 'lucide-react';
import clsx from 'clsx';
import { Card } from '../../../components/ui/Card';
import { Avatar } from '../../../components/ui/Avatar';
import { Badge } from '../../../components/ui/Badge';
import { formatCRC, formatDate } from '../../../lib/format';

export function ClienteCobroRow({ grupo, maxTotal, onVerCliente, onVerCobro }) {
  const [open, setOpen] = useState(false);
  const { cliente } = grupo;
  const pct = maxTotal > 0 ? Math.round((grupo.total / maxTotal) * 100) : 0;

  return (
    <Card padding="md">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 text-left"
      >
        <Avatar nombre={cliente?.nombre} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-base font-bold text-navy-900 dark:text-white">
              {cliente?.nombre || 'Cliente eliminado'}
            </p>
            <ChevronDown
              className={clsx('h-4 w-4 shrink-0 text-neutral-400 transition-transform', open && 'rotate-180')}
              aria-hidden="true"
            />
          </div>
          <p className="mt-0.5 truncate text-xs text-neutral-500 dark:text-navy-300">
            {[cliente?.cedula, cliente?.telefono].filter(Boolean).join(' · ') || '—'}
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
            <div>
              <p className="section-label">Total mes</p>
              <p className="mt-0.5 text-sm font-bold tabular-nums text-navy-900 dark:text-white">
                {formatCRC(grupo.total)}
              </p>
            </div>
            <div>
              <p className="section-label">Capital</p>
              <p className="mt-0.5 text-sm font-semibold tabular-nums text-success-600 dark:text-success-500">
                {formatCRC(grupo.capital)}
              </p>
            </div>
            <div>
              <p className="section-label">Interés</p>
              <p className="mt-0.5 text-sm font-semibold tabular-nums text-gold-600 dark:text-gold-300">
                {formatCRC(grupo.interes)}
              </p>
            </div>
            <div>
              <p className="section-label">Cobros</p>
              <p className="mt-0.5 text-sm font-semibold tabular-nums text-navy-900 dark:text-white">
                {grupo.count}
              </p>
            </div>
            <div className="hidden sm:block">
              <p className="section-label">Último</p>
              <p className="mt-0.5 text-sm font-semibold tabular-nums text-navy-900 dark:text-white">
                {grupo.ultimo ? formatDate(grupo.ultimo) : '—'}
              </p>
            </div>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
            <div className="h-full rounded-full bg-gold-gradient transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </button>

      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onVerCliente?.(grupo)}
          className="inline-flex min-h-[44px] items-center text-xs font-semibold text-info-600 dark:text-info-500"
        >
          Ver cliente
        </button>
        <span className="text-xs text-neutral-300 dark:text-navy-600">·</span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex min-h-[44px] items-center gap-1 text-xs font-semibold text-neutral-500 dark:text-navy-300"
        >
          <ReceiptText className="h-3.5 w-3.5" aria-hidden="true" />
          {open ? 'Ocultar cobros' : `Ver ${grupo.cobros.length} cobros`}
        </button>
      </div>

      {open && (
        <ul className="mt-3 space-y-2 border-t border-slate-100 pt-3 dark:border-white/10">
          {grupo.cobros.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onVerCobro?.(c)}
                className="flex w-full items-center gap-3 rounded-input px-2 py-2 text-left hover:bg-slate-50 dark:hover:bg-navy-700/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-navy-900 dark:text-white">
                    {formatDate(c.fecha)}
                    {c.cuotaNumero != null && <span className="text-neutral-500 dark:text-navy-300"> · Cuota #{c.cuotaNumero}</span>}
                  </p>
                  <p className="truncate text-xs text-neutral-500 dark:text-navy-300">
                    {[c.ruta, c.nota].filter(Boolean).join(' · ') || '—'}
                  </p>
                </div>
                <Badge tone={c.tipo === 'capital' ? 'success' : 'gold'}>
                  {c.tipo === 'capital' ? 'Capital' : 'Interés'}
                </Badge>
                <p className="shrink-0 text-sm font-bold tabular-nums text-navy-900 dark:text-white">
                  {formatCRC(c.monto)}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
