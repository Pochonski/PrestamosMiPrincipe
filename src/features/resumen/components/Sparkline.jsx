import React from 'react';

export function Sparkline({ data, color = '#D4AF37', height = 28 }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const W = 80;
  const H = height;
  const step = W / (data.length - 1);
  const points = data
    .map((v, i) => {
      const x = i * step;
      const y = H - ((v - min) / range) * (H - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');
  const fillPoints = `0,${H} ${points} ${W},${H}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-20 h-7" preserveAspectRatio="none" aria-hidden="true">
      <polygon points={fillPoints} fill={color} opacity="0.12" />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
