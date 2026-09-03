import React from 'react';
import { HandCoins, Clock } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { IconBox } from '../../../components/ui/IconBox';
import { formatCRC, formatDateShort } from '../../../lib/format';

export function RecentActivity({ items }) {
  const list = items || [];
  return (
    <Card className="p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-navy-900 dark:text-white">Actividad reciente</h3>
          <p className="text-xs text-neutral-500 dark:text-navy-300">Últimos movimientos registrados</p>
        </div>
        <Badge tone="gold">{list.length}</Badge>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="Sin movimientos aún"
          description="Cuando registres cobros aparecerán aquí."
        />
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-navy-700/60">
          {list.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <IconBox icon={HandCoins} tone="emerald" size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-navy-900 dark:text-white">
                  {item.titulo}
                </p>
                <p className="truncate text-xs text-neutral-500 dark:text-navy-300">
                  {item.subtitulo}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold tabular-nums text-success-600 dark:text-success-500">
                  {formatCRC(item.monto)}
                </p>
                <p className="text-[10px] text-neutral-400 dark:text-navy-300">
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
