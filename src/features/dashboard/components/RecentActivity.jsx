import { HandCoins, Clock } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { formatCRC, formatDateShort } from '../../../lib/format';

export function RecentActivity({ items }) {
  const list = items || [];
  return (
    <Card className="p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-navy-900 dark:text-white">Actividad reciente</h3>
          <p className="text-xs text-slate-500 dark:text-navy-300">Últimos movimientos registrados</p>
        </div>
        <Badge tone="gold">{list.length}</Badge>
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-navy-700 dark:text-navy-300">
            <Clock className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-navy-700 dark:text-navy-100">
            Sin movimientos aún
          </p>
          <p className="text-xs text-slate-500 dark:text-navy-300">
            Cuando registres cobros aparecerán aquí.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-navy-700/60">
          {list.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
                <HandCoins className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-navy-900 dark:text-white">
                  {item.titulo}
                </p>
                <p className="truncate text-xs text-slate-500 dark:text-navy-300">
                  {item.subtitulo}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {formatCRC(item.monto)}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-navy-300">
                  {formatDateShort(item.fecha)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}