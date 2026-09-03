import React from 'react';
import {
  Wallet,
  TrendingUp,
  AlertTriangle,
  Banknote,
} from 'lucide-react';
import { StatCard } from '../../../components/ui/StatCard';
import { formatCRCCompact } from '../../../lib/format';

const singular = (n, singular, plural) => (n === 1 ? singular : plural);

const KPI_ITEMS = [
  {
    label: 'Cartera total',
    icon: Wallet,
    tone: 'gold',
    deltaKey: 'carteraTotal',
    sparkKey: 'carteraTotal',
    value: (k) => formatCRCCompact(k.carteraTotal),
    sub: (k) => `${k.cantidadActivos} ${singular(k.cantidadActivos, 'préstamo activo', 'préstamos activos')}`,
  },
  {
    label: 'Cobrado hoy',
    icon: TrendingUp,
    tone: 'success',
    deltaKey: 'cobradoHoy',
    sparkKey: 'cobradoHoy',
    value: (k) => formatCRCCompact(k.totalCobradoHoy),
    sub: (k) =>
      k.cantidadCobradoHoy > 0
        ? `${k.cantidadCobradoHoy} ${singular(k.cantidadCobradoHoy, 'cobro', 'cobros')} realizados`
        : 'Aún sin cobros hoy',
  },
  {
    label: 'En mora',
    icon: AlertTriangle,
    tone: 'danger',
    deltaKey: 'totalAtrasado',
    value: (k) => formatCRCCompact(k.totalAtrasado),
    sub: (k) =>
      k.cantidadAtrasados > 0
        ? `${k.cantidadAtrasados} ${singular(k.cantidadAtrasados, 'cuota atrasada', 'cuotas atrasadas')}`
        : 'Sin atrasos',
  },
  {
    label: 'Por cobrar hoy',
    icon: Banknote,
    tone: 'info',
    deltaKey: 'totalCobrarHoy',
    value: (k) => formatCRCCompact(k.totalCobrarHoy),
    sub: (k) =>
      k.cantidadCobrarHoy > 0
        ? `${k.cantidadCobrarHoy} ${singular(k.cantidadCobrarHoy, 'cuota vence', 'cuotas vencen')} hoy`
        : 'Sin cuotas hoy',
  },
];

const SPARK_BY_KEY = {
  carteraTotal: 'spark7',
  cobradoHoy: 'spark7',
};

export function KpiRow({ kpis, deltas = {}, metrics }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
      {KPI_ITEMS.map(({ label, icon, tone, value, sub, deltaKey, sparkKey }) => {
        const delta = typeof deltas?.[deltaKey] === 'number' ? deltas[deltaKey] : undefined;
        const spark = metrics?.[SPARK_BY_KEY[sparkKey]];
        const moroso = label === 'En mora' && kpis.totalAtrasado > 0;
        return (
          <StatCard
            key={label}
            label={label}
            value={value(kpis)}
            sub={<span className="line-clamp-1">{sub(kpis)}</span>}
            icon={icon}
            tone={tone}
            delta={delta}
            spark={spark}
            className={moroso ? 'ring-2 ring-danger-500/60 dark:ring-danger-500/40' : undefined}
          />
        );
      })}
    </div>
  );
}