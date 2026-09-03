import React from 'react';
import { CheckCircle2, Circle, XCircle } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { IconBox } from '../../../components/ui/IconBox';
import { formatCRC, formatDate } from '../../../lib/format';

const STATUS_META = {
  pendiente: { tone: 'neutral', label: 'No pagado', icon: Circle },
  pagada: { tone: 'success', label: 'Pagado', icon: CheckCircle2 },
  cancelada: { tone: 'info', label: 'Cancelado', icon: XCircle },
};

const TONE_MAP = {
  pagada: 'emerald',
  cancelada: 'sky',
  pendiente: 'neutral',
};

export function PrestamoCalendar({ cuotas, total }) {
  const safeCuotas = cuotas || [];
  const totalAPagar = total ?? safeCuotas.reduce((s, c) => s + c.monto, 0);

  if (!safeCuotas || safeCuotas.length === 0) {
    return null;
  }

  return (
    <Card padding="md">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-navy-900 dark:text-white">
            Calendario de cuotas
          </h3>
          <p className="text-xs text-neutral-500 dark:text-navy-300">
            {safeCuotas.length} {safeCuotas.length === 1 ? 'cuota' : 'cuotas'} · total{' '}
            {formatCRC(totalAPagar)}
          </p>
        </div>
      </div>

      <ul className="divide-y divide-slate-100 dark:divide-navy-700/60">
        {safeCuotas.map((c) => {
          const meta = STATUS_META[c.estado] || STATUS_META.pendiente;
          return (
            <li
              key={c.numero}
              className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
            >
              <IconBox icon={meta.icon} tone={TONE_MAP[c.estado] || 'neutral'} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-navy-900 dark:text-white">
                  Cuota #{c.numero}
                </p>
                <p className="text-xs text-neutral-500 dark:text-navy-300">{formatDate(c.fecha)}</p>
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
