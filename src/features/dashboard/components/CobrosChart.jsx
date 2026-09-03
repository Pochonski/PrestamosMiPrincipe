import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { EmptyState } from '../../../components/ui/EmptyState';
import { BarChart3 } from 'lucide-react';
import { formatCRC, formatCRCCompact } from '../../../lib/format';

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;
  const value = payload[0].value;
  return (
    <div className="rounded-card border border-navy-700/60 bg-navy-900 px-3 py-2 text-xs shadow-modal">
      <p className="font-semibold text-white">{label}</p>
      <p className="mt-0.5 font-bold tabular-nums text-gold-400">{formatCRC(value)}</p>
    </div>
  );
}

export function CobrosChart({ data }) {
  const rows = data || [];
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Sin cobros aún"
        description="Cuando registres cobros aparecerá la tendencia de los últimos 6 meses."
      />
    );
  }

  return (
    <div className="h-48 w-full sm:h-64" role="img" aria-label="Cobros por mes, últimos 6 meses">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ top: 10, right: 12, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="cobros-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-navy-700" vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={8}
            tick={{ fontSize: 12 }}
            className="fill-slate-500 dark:fill-navy-300"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={52}
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => formatCRCCompact(v)}
            className="fill-slate-500 dark:fill-navy-300"
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#D4AF37', strokeOpacity: 0.3 }} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#D4AF37"
            strokeWidth={2}
            fill="url(#cobros-fill)"
            dot={false}
            activeDot={{ r: 5, fill: '#D4AF37' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}