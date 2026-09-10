import React, { useId } from 'react';
export function DonutChart({ data, total, size = 180, colorMap }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const glowId = `donutGlow-${uid}`;
  const radius = size / 2 - 20;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;
  const GAP = 3;

  if (!data || data.length === 0 || total === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-full border-2 border-dashed border-white/50 dark:border-white/10"
        style={{ width: size, height: size }}
        role="img"
        aria-label="Sin datos"
      >
        <p className="text-xs text-neutral-500 dark:text-navy-300">Sin datos</p>
      </div>
    );
  }

  const segments = [];
  let cumulative = 0;
  for (const d of data) {
    const length = (d.value / total) * circumference;
    segments.push({ ...d, length, offset: cumulative });
    cumulative += length;
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="Gráfico de dona"
    >
      <defs>
        <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#D4AF37" floodOpacity="0.35" />
        </filter>
      </defs>
      <g transform={`translate(${cx}, ${cy}) rotate(-90)`}>
        <circle r={radius} fill="none" className="stroke-slate-100 dark:stroke-white/10" strokeWidth="20" />
        {segments.map((d, i) => (
          <circle
            key={d.label + i}
            r={radius}
            fill="none"
            stroke={colorMap?.[d.label] || d.color}
            strokeWidth="20"
            strokeLinecap="round"
            strokeDasharray={`${Math.max(d.length - GAP, 0.5)} ${circumference - d.length + GAP}`}
            strokeDashoffset={-(d.offset - GAP / 2)}
            filter={`url(#${glowId})`}
          />
        ))}
      </g>
      <text
        x={cx}
        y={cy - 2}
        textAnchor="middle"
        fontSize="20"
        className="fill-navy-900 font-display font-bold tabular-nums dark:fill-white"
      >
        {total}
      </text>
      <text
        x={cx}
        y={cy + 16}
        textAnchor="middle"
        fontSize="9"
        className="fill-slate-500 uppercase tracking-wider dark:fill-navy-300"
      >
        préstamos
      </text>
    </svg>
  );
}
