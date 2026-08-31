import { formatCRC } from '../../../lib/format';

const CHART_HEIGHT = 220;
const PADDING_TOP = 28;
const PADDING_BOTTOM = 28;

export function BarChart({ data, height = CHART_HEIGHT }) {
  if (!data || data.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-slate-500 dark:text-navy-300">
        Sin datos.
      </p>
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
    >
      <line
        x1="0"
        y1={baseline}
        x2={W}
        y2={baseline}
        className="stroke-slate-200 dark:stroke-navy-700"
        strokeWidth="1"
      />
      {data.map((d, i) => {
        const barH = (d.value / max) * usableH;
        const barX = i * slot + (slot - barW) / 2;
        const barY = baseline - barH;
        const cx = i * slot + slot / 2;
        return (
          <g key={d.label + i}>
            <rect
              x={barX}
              y={barY}
              width={barW}
              height={barH}
              rx="3"
              fill="#D4AF37"
            />
            {d.value > 0 && (
              <text
                x={cx}
                y={barY - 6}
                fontSize="13"
                textAnchor="middle"
                className="fill-slate-500 dark:fill-navy-300"
              >
                {formatCRC(d.value)}
              </text>
            )}
            <text
              x={cx}
              y={H - 8}
              fontSize="14"
              textAnchor="middle"
              className="fill-slate-700 dark:fill-navy-100"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}