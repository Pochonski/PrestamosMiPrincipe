import { CheckCircle2, Circle, XCircle } from 'lucide-react';
import clsx from 'clsx';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { formatCRC, formatDate } from '../../../lib/format';

const STATUS_META = {
  pendiente: { tone: 'neutral', label: 'No pagado', icon: Circle },
  pagada: { tone: 'success', label: 'Pagado', icon: CheckCircle2 },
  cancelada: { tone: 'info', label: 'Cancelado', icon: XCircle },
};

export function PrestamoCalendar({ cuotas, total }) {
  const totalAPagar = total ?? cuotas.reduce((s, c) => s + c.monto, 0);

  if (!cuotas || cuotas.length === 0) {
    return null;
  }

  return (
    <Card className="p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-navy-900 dark:text-white">
            Calendario de cuotas
          </h3>
          <p className="text-xs text-slate-500 dark:text-navy-300">
            {cuotas.length} {cuotas.length === 1 ? 'cuota' : 'cuotas'} · total {formatCRC(totalAPagar)}
          </p>
        </div>
      </div>

      <ul className="divide-y divide-slate-100 dark:divide-navy-700/60">
        {cuotas.map((c) => {
          const meta = STATUS_META[c.estado] || STATUS_META.pendiente;
          const Icon = meta.icon;
          return (
            <li key={c.numero} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <div
                className={clsx(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                  c.estado === 'pagada' && 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300',
                  c.estado === 'cancelada' && 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300',
                  c.estado === 'pendiente' && 'bg-slate-100 text-slate-500 dark:bg-navy-700 dark:text-navy-300',
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-navy-900 dark:text-white">
                  Cuota #{c.numero}
                </p>
                <p className="text-xs text-slate-500 dark:text-navy-300">
                  {formatDate(c.fecha)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold tabular-nums text-navy-900 dark:text-white">
                  {formatCRC(c.monto)}
                </p>
                <Badge tone={meta.tone}>{meta.label}</Badge>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}