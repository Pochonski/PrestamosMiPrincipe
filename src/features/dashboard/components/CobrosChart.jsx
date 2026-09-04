import React from 'react';
import { useRef, useState } from 'react';
import { EmptyState } from '../../../components/ui/EmptyState';
import { BarChart3 } from 'lucide-react';
import { formatCRC, formatCRCCompact } from '../../../lib/format';

const GOLD = '#D4AF37';
const W = 600;
const H = 260;
const PAD = { top: 16, right: 16, bottom: 28, left: 56 };

function niceMax(max) {
  if (max <= 0) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(max)));
  const norm = max / mag;
  const nice = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return nice * mag;
}

export function CobrosChart({ data }) {
  const rows = data || [];
  const svgRef = useRef(null);
  const [hover, setHover] = useState(null);

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Sin cobros aún"
        description="Cuando registres cobros aparecerá la tendencia de los últimos 6 meses."
      />
    );
  }

  const values = rows.map((r) => Number(r.value) || 0);
  const max = niceMax(Math.max(...values, 0));
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const x = (i) => PAD.left + (rows.length === 1 ? plotW / 2 : (i * plotW) / (rows.length - 1));
  const y = (v) => PAD.top + plotH * (1 - v / max);

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  const pts = values.map((v, i) => [x(i), y(v)]);
  const line = pts.map((p) => p.map((n) => n.toFixed(1)).join(',')).join(' ');
  const area = `${line} ${x(rows.length - 1).toFixed(1)},${(PAD.top + plotH)} ${x(0).toFixed(1)},${(PAD.top + plotH)}`;

  function onMove(e) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const relX = (e.clientX - rect.left) / rect.width;
    const idx = Math.round(relX * (rows.length - 1));
    setHover(Math.max(0, Math.min(rows.length - 1, idx)));
  }

  return (
    <div
      className="relative h-48 w-full sm:h-64"
      role="img"
      aria-label="Cobros por mes, últimos 6 meses"
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="cobros-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={GOLD} stopOpacity={0.35} />
            <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
          </linearGradient>
        </defs>

        {ticks.map((t, i) => {
          const ty = y(t);
          return (
            <g key={i}>
              <line
                x1={PAD.left}
                y1={ty}
                x2={W - PAD.right}
                y2={ty}
                stroke="currentColor"
                strokeOpacity={0.1}
                strokeDasharray="3 3"
              />
              <text
                x={PAD.left - 8}
                y={ty + 3}
                textAnchor="end"
                fontSize={11}
                className="fill-slate-500 dark:fill-navy-300"
              >
                {formatCRCCompact(t)}
              </text>
            </g>
          );
        })}

        {rows.map((r, i) => (
          <text
            key={`lbl-${i}`}
            x={x(i)}
            y={H - 8}
            textAnchor="middle"
            fontSize={12}
            className="fill-slate-500 dark:fill-navy-300"
          >
            {r.label}
          </text>
        ))}

        <polygon points={area} fill="url(#cobros-fill)" />
        <polyline points={line} fill="none" stroke={GOLD} strokeWidth={2} />

        {hover !== null && (
          <g>
            <line
              x1={x(hover)}
              y1={PAD.top}
              x2={x(hover)}
              y2={PAD.top + plotH}
              stroke={GOLD}
              strokeOpacity={0.3}
            />
            <circle cx={x(hover)} cy={y(values[hover])} r={5} fill={GOLD} />
          </g>
        )}
      </svg>

      {hover !== null && (
        <div
          className="pointer-events-none absolute top-2 rounded-card border border-navy-700/60 bg-navy-900 px-3 py-2 text-xs shadow-modal"
          style={{ left: `${(hover / (rows.length - 1)) * 100}%`, transform: 'translateX(-50%)' }}
        >
          <p className="font-semibold text-white">{rows[hover].label}</p>
          <p className="mt-0.5 font-bold tabular-nums text-gold-400">{formatCRC(values[hover])}</p>
        </div>
      )}
    </div>
  );
}