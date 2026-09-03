import React from 'react';
import {
  Wallet,
  TrendingUp,
  AlertTriangle,
  Banknote,
} from 'lucide-react';
import { StatCard } from '../../../components/ui/StatCard';
import { formatCRCCompact } from '../../../lib/format';

export function KpiRow({ kpis }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <StatCard
        label="Cartera total"
        value={formatCRCCompact(kpis.carteraTotal)}
        sub={`${kpis.cantidadActivos} préstamos activos`}
        icon={Wallet}
        tone="gold"
      />
      <StatCard
        label="Cobrado hoy"
        value={formatCRCCompact(kpis.totalCobradoHoy)}
        sub={
          kpis.cantidadCobradoHoy > 0
            ? `${kpis.cantidadCobradoHoy} ${kpis.cantidadCobradoHoy === 1 ? 'cobro' : 'cobros'} realizados`
            : 'Aún sin cobros hoy'
        }
        icon={TrendingUp}
        tone="success"
      />
      <StatCard
        label="En mora"
        value={formatCRCCompact(kpis.totalAtrasado)}
        sub={
          kpis.cantidadAtrasados > 0
            ? `${kpis.cantidadAtrasados} ${kpis.cantidadAtrasados === 1 ? 'cuota atrasada' : 'cuotas atrasadas'}`
            : 'Sin atrasos'
        }
        icon={AlertTriangle}
        tone="danger"
      />
      <StatCard
        label="Por cobrar hoy"
        value={formatCRCCompact(kpis.totalCobrarHoy)}
        sub={
          kpis.cantidadCobrarHoy > 0
            ? `${kpis.cantidadCobrarHoy} ${kpis.cantidadCobrarHoy === 1 ? 'cuota vence' : 'cuotas vencen'} hoy`
            : 'Sin cuotas hoy'
        }
        icon={Banknote}
        tone="info"
      />
    </div>
  );
}