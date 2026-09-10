import React, { useId } from 'react';
import { formatCRC } from '../../../lib/format';

const CHART_HEIGHT = 220;
const PADDING_TOP = 28;
const PADDING_BOTTOM = 28;
const GRIDLINES = 3;

export function BarChart({ data, height = CHART_HEIGHT }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const gradId = `barGlass-${uid}`;
  if (!data || data.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-neutral-500 dark:text-navy-300">Sin datos.</p>
    );
  }

  const max = Math.max(...data.map((d) => d.value), 1);
  const W = 600;
  const H = height;
  const usableH = H - PADDING_TOP - PADDING_BOTTOM;
  const slot = W / data.length;
  const barW = slot * 0.55;
  const baseline = PADDING_TOP + usableH;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      className="h-56 w-full"
      role="img"
      aria-label="Gráfico de barras"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F3DFA0" />
          <stop offset="55%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#B8902A" />
        </linearGradient>
      </defs>
      {Array.from({ length: GRIDLINES }, (_, g) => {
        const y = PADDING_TOP + (usableH / GRIDLINES) * g;
        return (
          <line
            key={g}
            x1="0"
            y1={y}
            x2={W}
            y2={y}
            className="stroke-slate-100 dark:stroke-white/10"
            strokeWidth="1"
          />
        );
      })}
      <line
        x1="0"
        y1={baseline}
        x2={W}
        y2={baseline}
        className="stroke-slate-200 dark:stroke-white/10"
        strokeWidth="1"
      />
      {data.map((d, i) => {
        const barH = (d.value / max) * usableH;
        const barX = i * slot + (slot - barW) / 2;
        const barY = baseline - barH;
        const cx = i * slot + slot / 2;
        const isMax = d.value === max && max > 0;
        return (
          <g key={d.label + i} opacity={isMax ? 1 : 0.65}>
            <rect
              x={barX}
              y={barY}
              width={barW}
              height={Math.max(barH, 0)}
              rx="6"
              fill={`url(#${gradId})`}
            />
            {barH > 4 && (
              <rect
                x={barX + 3}
                y={barY + 2}
                width={Math.max(barW - 6, 0)}
                height="2.5"
                rx="1.25"
                fill="#FFFFFF"
                opacity="0.55"
              />
            )}
            {d.value > 0 && (
              <text
                x={cx}
                y={barY - 6}
                fontSize="13"
                textAnchor="middle"
                className="fill-slate-500 font-display font-bold tabular-nums dark:fill-navy-200"
              >
                {formatCRC(d.value)}
              </text>
            )}
            <text
              x={cx}
              y={H - 8}
              fontSize="14"
              textAnchor="middle"
              className={
                isMax
                  ? 'font-display font-bold tabular-nums fill-navy-900 dark:fill-white'
                  : 'font-display tabular-nums fill-slate-700 dark:fill-navy-300'
              }
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
