import { Wallet } from 'lucide-react';
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

export function PrestamoCard({ prestamo, onOpen }) {
  const status = prestamosService.getStatus(prestamo);
  const agotadas = prestamosService.cuotasAgotadas(prestamo);
  const meta = agotadas
    ? { tone: 'warning', label: 'Cuotas agotadas' }
    : STATUS_META[status];
  const cuota = prestamosService.cuotaDelPeriodo(prestamo);
  const prox = prestamosService.proximoCobro(prestamo);
  const saldo = prestamosService.getSaldoCapital(prestamo);

  return (
    <Card
      className="cursor-pointer p-4 transition-shadow hover:shadow-cardHover sm:p-5"
      onClick={() => onOpen?.(prestamo)}
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
              {labelPeriodo(prestamo.periodo)} · {prestamo.nCuotas} cuotas · {prestamo.tasa}%
            </p>
          </div>
        </div>
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
    </Card>
  );
}