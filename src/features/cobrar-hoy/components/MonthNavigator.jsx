import React from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { getMonthBounds, shiftMonth, monthKeyOf } from '../selectors';

export function MonthNavigator({ monthKey, onChange }) {
  const { label } = getMonthBounds(monthKey);
  const isCurrent = monthKey === monthKeyOf(new Date());
  return (
    <div className="glass flex items-center justify-between gap-2 rounded-card p-2">
      <button
        type="button"
        onClick={() => onChange(shiftMonth(monthKey, -1))}
        aria-label="Mes anterior"
        className="flex h-9 w-9 items-center justify-center rounded-input text-navy-700 hover:bg-slate-100 dark:text-navy-200 dark:hover:bg-navy-700"
      >
        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
      </button>
      <p className="inline-flex min-w-0 flex-1 items-center justify-center gap-2 truncate text-sm font-bold text-navy-900 dark:text-white">
        <CalendarDays className="h-4 w-4 shrink-0 text-gold-500" aria-hidden="true" />
        <span className="truncate">{label}</span>
      </p>
      <button
        type="button"
        onClick={() => onChange(shiftMonth(monthKey, 1))}
        aria-label="Mes siguiente"
        className="flex h-9 w-9 items-center justify-center rounded-input text-navy-700 hover:bg-slate-100 dark:text-navy-200 dark:hover:bg-navy-700"
      >
        <ChevronRight className="h-5 w-5" aria-hidden="true" />
      </button>
      {!isCurrent && (
        <button
          type="button"
          onClick={() => onChange(monthKeyOf(new Date()))}
          className="shrink-0 rounded-full bg-gold-gradient px-3 py-1.5 text-xs font-bold text-navy-900 shadow-glow"
        >
          Este mes
        </button>
      )}
    </div>
  );
}
