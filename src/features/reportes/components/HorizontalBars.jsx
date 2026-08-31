export function HorizontalBars({ data, max }) {
  if (!data || data.length === 0) {
    return null;
  }
  const maxValue = max || Math.max(...data.map((d) => d.value), 1);

  return (
    <ul className="space-y-3">
      {data.map((d, i) => {
        const pct = Math.round((d.value / maxValue) * 100);
        return (
          <li key={d.label + i} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="truncate font-semibold text-navy-700 dark:text-navy-100">
                {d.label}
              </span>
              <span className="ml-2 shrink-0 font-bold tabular-nums text-slate-700 dark:text-navy-100">
                {d.value}
              </span>
            </div>
            <div className="relative h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-navy-700/60">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gold-gradient"
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}