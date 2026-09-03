import React from 'react';
import { AlertTriangle, HandCoins, Info, Bell, Circle } from 'lucide-react';
import clsx from 'clsx';
import { Card } from '../../../components/ui/Card';
import { IconBox } from '../../../components/ui/IconBox';
import { getTipoMeta, formatFechaRelativa } from '../selectors';

const ICONS = {
  AlertTriangle,
  HandCoins,
  Info,
  Bell,
};

const TONE_MAP = {
  danger: 'rose',
  success: 'emerald',
  info: 'sky',
  neutral: 'neutral',
};

export function NotificacionItem({ item, onClick }) {
  const meta = getTipoMeta(item.tipo);
  const Icon = ICONS[meta.icon] || Bell;

  return (
    <Card
      interactive
      padding="md"
      className={clsx(
        'p-4 sm:p-5',
        !item.leida && 'border-l-4 border-l-gold-400 bg-gold-50/40 dark:bg-gold-500/5',
      )}
      onClick={() => onClick?.(item)}
    >
      <div className="flex items-start gap-3">
        <IconBox icon={Icon} tone={TONE_MAP[meta.tone] || 'neutral'} size="md" />

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
              <span
                className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gold-700 dark:text-gold-300"
              >
                <Circle
                  className="h-2 w-2 shrink-0 fill-gold-500 text-gold-500"
                  aria-hidden="true"
                />
                <span>Nueva</span>
              </span>
            )}
          </div>
          <p
            className={clsx(
              'mt-0.5 text-xs',
              item.leida ? 'text-neutral-500 dark:text-navy-300' : 'text-neutral-700 dark:text-navy-100',
            )}
          >
            {item.mensaje}
          </p>
          <p className="mt-1 text-[10px] text-neutral-400 dark:text-navy-300">
            {formatFechaRelativa(item.fecha)}
          </p>
        </div>
      </div>
    </Card>
  );
}
