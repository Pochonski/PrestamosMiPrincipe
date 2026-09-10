import React from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { getMonthBounds, shiftMonth, monthKeyOf } from '../selectors';

export function MonthNavigator({ monthKey, onChange }) {
  const { label } = getMonthBounds(monthKey);
  const isCurrent = monthKey === monthKeyOf(new Date());
  return (
    <div className="glass flex items-center justify-between gap-2 rounded-card p-3">
      <button
        type="button"
        onClick={() => onChange(shiftMonth(monthKey, -1))}
        aria-label="Mes anterior"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-input text-navy-700 hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-navy-200 dark:hover:bg-white/10"
      >
        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
      </button>
      <p className="inline-flex min-w-0 flex-1 items-center justify-center gap-2 truncate text-sm font-bold text-navy-900 dark:text-white">
        <CalendarDays className="h-4 w-4 shrink-0 text-gold-600 dark:text-gold-400" aria-hidden="true" />
        <span className="truncate">{label}</span>
      </p>
      <button
        type="button"
        onClick={() => onChange(shiftMonth(monthKey, 1))}
        aria-label="Mes siguiente"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-input text-navy-700 hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-navy-200 dark:hover:bg-white/10"
      >
        <ChevronRight className="h-5 w-5" aria-hidden="true" />
      </button>
      {!isCurrent && (
        <button
          type="button"
          onClick={() => onChange(monthKeyOf(new Date()))}
          className="inline-flex min-h-[44px] shrink-0 items-center rounded-full bg-gold-gradient px-4 py-2 text-xs font-bold text-navy-900 shadow-glow"
        >
          Este mes
        </button>
      )}
    </div>
  );
}
