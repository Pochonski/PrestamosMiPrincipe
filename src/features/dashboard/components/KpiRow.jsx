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
    value: (k) => formatCRCCompact(k.carteraTotal),
    sub: (k) => `${k.cantidadActivos} ${singular(k.cantidadActivos, 'préstamo activo', 'préstamos activos')}`,
  },
  {
    label: 'Cobrado hoy',
    icon: TrendingUp,
    tone: 'success',
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
    value: (k) => formatCRCCompact(k.totalCobrarHoy),
    sub: (k) =>
      k.cantidadCobrarHoy > 0
        ? `${k.cantidadCobrarHoy} ${singular(k.cantidadCobrarHoy, 'cuota vence', 'cuotas vencen')} hoy`
        : 'Sin cuotas hoy',
  },
];

export function KpiRow({ kpis }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {KPI_ITEMS.map(({ label, icon, tone, value, sub }) => (
        <StatCard
          key={label}
          label={label}
          value={value(kpis)}
          sub={<span className="line-clamp-1">{sub(kpis)}</span>}
          icon={icon}
          tone={tone}
        />
      ))}
    </div>
  );
}