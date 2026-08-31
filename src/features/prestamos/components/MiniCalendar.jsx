import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

const WEEKDAYS = ['D', 'L', 'K', 'M', 'J', 'V', 'S'];

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function lastDayOfMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function buildGrid(monthDate) {
  const first = startOfMonth(monthDate);
  const firstDayOfWeek = first.getDay();
  const grid = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(first);
    d.setDate(i - firstDayOfWeek + 1);
    grid.push(d);
  }
  return grid;
}

const monthFmt = new Intl.DateTimeFormat('es-CR', { month: 'long', year: 'numeric' });

function clampDayToMonth(year, month, day) {
  return Math.min(day, lastDayOfMonth(year, month));
}

export function MiniCalendar({ value, onChange }) {
  const [view, setView] = useState(() => {
    const now = new Date();
    if (value) {
      return new Date(now.getFullYear(), now.getMonth(), clampDayToMonth(now.getFullYear(), now.getMonth(), value));
    }
    return new Date();
  });

  const grid = useMemo(() => buildGrid(view), [view]);
  const viewMonth = view.getMonth();
  const viewYear = view.getFullYear();

  function shift(delta) {
    const d = new Date(view);
    d.setMonth(view.getMonth() + delta);
    setView(d);
  }

  function pickDay(d) {
    if (d.getMonth() !== viewMonth) return;
    onChange?.(d.getDate());
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card dark:border-navy-700 dark:bg-navy-800">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => shift(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-navy-300 dark:hover:bg-navy-700"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold capitalize text-navy-900 dark:text-white">
          {monthFmt.format(view)}
        </span>
        <button
          type="button"
          onClick={() => shift(1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-navy-300 dark:hover:bg-navy-700"
          aria-label="Mes siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-navy-300">
        {WEEKDAYS.map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {grid.map((d, i) => {
          const inMonth = d.getMonth() === viewMonth && d.getFullYear() === viewYear;
          const selected = inMonth && value === d.getDate();
          return (
            <button
              key={i}
              type="button"
              onClick={() => pickDay(d)}
              disabled={!inMonth}
              className={clsx(
                'flex h-9 w-full items-center justify-center rounded-lg text-sm font-medium transition-colors',
                !inMonth && 'text-slate-300 dark:text-navy-700',
                inMonth && !selected && 'text-navy-700 hover:bg-slate-100 dark:text-navy-100 dark:hover:bg-navy-700',
                selected && 'bg-gold-gradient font-bold text-navy-900 shadow-glow',
              )}
              aria-label={d.toLocaleDateString('es-CR')}
              aria-pressed={selected}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}