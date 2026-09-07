import React from 'react';
export function DonutChart({ data, total, size = 180, colorMap }) {
  const radius = size / 2 - 20;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  if (!data || data.length === 0 || total === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-full border-2 border-dashed border-slate-200 dark:border-navy-700"
        style={{ width: size, height: size }}
        role="img"
        aria-label="Sin datos"
      >
        <p className="text-xs text-neutral-400 dark:text-navy-300">Sin datos</p>
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
      <g transform={`translate(${cx}, ${cy}) rotate(-90)`}>
        {segments.map((d, i) => (
          <circle
            key={d.label + i}
            r={radius}
            fill="none"
            stroke={colorMap?.[d.label] || d.color}
            strokeWidth="20"
            strokeDasharray={`${d.length} ${circumference - d.length}`}
            strokeDashoffset={-d.offset}
          />
        ))}
      </g>
      <text
        x={cx}
        y={cy - 4}
        textAnchor="middle"
        fontSize="14"
        fontWeight="700"
        className="fill-navy-900 dark:fill-white"
      >
        {total}
      </text>
      <text
        x={cx}
        y={cy + 14}
        textAnchor="middle"
        fontSize="9"
        className="fill-slate-500 dark:fill-navy-300"
      >
        préstamos
      </text>
    </svg>
  );
}
