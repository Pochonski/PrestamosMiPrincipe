import React from 'react';

function GlassBar({ pct, label, now }) {
  return (
    <div className="relative h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
      <div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--bar-from, #F3DFA0), var(--bar-to, #B8902A))' }}
        role="progressbar"
        aria-label={label}
        aria-valuenow={now}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span className="absolute inset-x-[3px] top-[1.5px] h-[2px] rounded-full bg-white/60" aria-hidden="true" />
      </div>
    </div>
  );
}

export function HorizontalBars({ data, max, formatValue, maxSaldo, maxCount, formatSaldo, formatCount }) {
  if (!data || data.length === 0) {
    return null;
  }
  const dual = data.length > 0 && data[0] && (data[0].saldo !== undefined || data[0].count !== undefined);
  const maxValue = max || Math.max(...data.map((d) => d.value), 1);
  const topSaldo = maxSaldo || Math.max(...data.map((d) => d.saldo ?? 0), 1);
  const topCount = maxCount || Math.max(...data.map((d) => d.count ?? 0), 1);

  return (
    <ul className="space-y-4">
      {data.map((d, i) => {
        if (!dual) {
          const pct = Math.max(0, Math.min(100, Math.round((d.value / maxValue) * 100)));
          return (
            <li key={d.label + i} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="truncate font-display font-semibold text-navy-700 dark:text-navy-100">
                  {d.label}
                </span>
                <span className="ml-2 shrink-0 font-display font-bold tabular-nums text-slate-700 dark:text-navy-100">
                  {formatValue ? formatValue(d.value) : d.value}
                </span>
              </div>
              <GlassBar pct={pct} label={d.label} now={pct} />
            </li>
          );
        }
        const pctSaldo = Math.max(0, Math.min(100, Math.round(((d.saldo ?? 0) / topSaldo) * 100)));
        const pctCount = Math.max(0, Math.min(100, Math.round(((d.count ?? 0) / topCount) * 100)));
        return (
          <li key={d.label + i} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-2 text-xs">
              <span className="truncate font-display font-semibold text-navy-700 dark:text-navy-100">
                {d.label}
              </span>
              <span className="flex shrink-0 items-baseline gap-2">
                <span className="font-display font-bold tabular-nums text-navy-900 dark:text-white">
                  {formatSaldo ? formatSaldo(d.saldo ?? 0) : d.saldo}
                </span>
                <span className="rounded-full bg-info-500/10 px-2 py-0.5 font-bold tabular-nums text-info-700 dark:text-info-500">
                  {formatCount ? formatCount(d.count ?? 0) : d.count} prést.
                </span>
              </span>
            </div>
            <div className="space-y-1 [--bar-from:#F3DFA0] [--bar-to:#B8902A]">
              <GlassBar pct={pctSaldo} label={`${d.label} saldo`} now={pctSaldo} />
            </div>
            <div className="space-y-1 [--bar-from:#7DD3FC] [--bar-to:#0284C7]">
              <GlassBar pct={pctCount} label={`${d.label} cantidad`} now={pctCount} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
