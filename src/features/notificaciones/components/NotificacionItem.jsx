import { AlertTriangle, HandCoins, Info, Bell, Circle } from 'lucide-react';
import clsx from 'clsx';
import { Card } from '../../../components/ui/Card';
import { getTipoMeta, formatFechaRelativa } from '../selectors';

const ICONS = {
  AlertTriangle,
  HandCoins,
  Info,
  Bell,
};

export function NotificacionItem({ item, onClick }) {
  const meta = getTipoMeta(item.tipo);
  const Icon = ICONS[meta.icon] || Bell;

  return (
    <Card
      className={clsx(
        'cursor-pointer p-4 transition-all hover:shadow-cardHover sm:p-5',
        !item.leida && 'border-l-4 border-l-gold-400 bg-gold-50/40 dark:bg-gold-500/5',
      )}
      onClick={() => onClick?.(item)}
    >
      <div className="flex items-start gap-3">
        <div
          className={clsx(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
            meta.tone === 'danger' && 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300',
            meta.tone === 'success' && 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300',
            meta.tone === 'info' && 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300',
            meta.tone === 'neutral' && 'bg-slate-100 text-slate-600 dark:bg-navy-700 dark:text-navy-200',
          )}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p
              className={clsx(
                'truncate text-sm font-semibold',
                item.leida ? 'text-navy-700 dark:text-navy-200' : 'text-navy-900 dark:text-white',
              )}
            >
              {item.titulo}
            </p>
            {!item.leida && (
              <Circle
                className="h-2 w-2 shrink-0 fill-gold-500 text-gold-500"
                aria-label="No leída"
              />
            )}
          </div>
          <p
            className={clsx(
              'mt-0.5 text-xs',
              item.leida ? 'text-slate-500 dark:text-navy-300' : 'text-slate-700 dark:text-navy-100',
            )}
          >
            {item.mensaje}
          </p>
          <p className="mt-1 text-[10px] text-slate-400 dark:text-navy-300">
            {formatFechaRelativa(item.fecha)}
          </p>
        </div>
      </div>
    </Card>
  );
}