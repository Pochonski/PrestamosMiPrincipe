import { ArrowRight, Calendar, Wallet } from 'lucide-react';
import clsx from 'clsx';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { formatCRC, formatDate } from '../../../lib/format';

export function CuotaItem({ item, onCobrar, variant = 'today' }) {
  const { prestamo, cuota, cliente } = item;
  const isAtrasado = variant === 'atrasado';

  return (
    <Card
      className="p-4 sm:p-5 cursor-pointer transition-shadow hover:shadow-cardHover"
      onClick={() => onCobrar?.(item)}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-gradient text-navy-900">
          <Wallet className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-base font-bold text-navy-900 dark:text-white">
              {cliente.nombre}
            </p>
            {isAtrasado && <Badge tone="danger">Atrasado</Badge>}
          </div>
          <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-navy-300">
            {cliente.cedula} · {cliente.telefono}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 dark:border-navy-700/60">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-navy-300">
            Cuota
          </p>
          <p className="mt-0.5 text-sm font-bold tabular-nums text-navy-900 dark:text-white">
            {formatCRC(cuota.monto)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-navy-300">
            Fecha
          </p>
          <p className="mt-0.5 text-sm font-semibold tabular-nums text-navy-900 dark:text-white">
            {formatDate(cuota.fecha)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-navy-300">
            Ruta
          </p>
          <p className="mt-0.5 truncate text-sm font-semibold text-navy-900 dark:text-white">
            {prestamo.ruta || '—'}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-navy-700/60">
        <span className={clsx(
          'inline-flex items-center gap-1.5 text-xs font-semibold',
          isAtrasado ? 'text-rose-600 dark:text-rose-400' : 'text-sky-600 dark:text-sky-400',
        )}>
          <Calendar className="h-3.5 w-3.5" />
          Cuota #{cuota.numero}
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gold-600 dark:text-gold-300">
          Cobrar ahora
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Card>
  );
}