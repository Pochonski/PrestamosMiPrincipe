import React from 'react';
import clsx from 'clsx';
import { Calendar, Filter } from 'lucide-react';

const RANGOS = [
  { id: 'hoy', label: 'Hoy' },
  { id: '7d', label: '7d' },
  { id: '30d', label: '30d' },
  { id: 'mes', label: 'Mes' },
  { id: 'custom', label: 'Personalizado' },
];

export function ResumenFilters({ filters, onChange, rutas = [] }) {
  const { rango = 'mes', from, to, ruta } = filters;

  function set(part) {
    onChange({ ...filters, ...part });
  }

  return (
    <div className="glass flex flex-col gap-3 rounded-card p-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-500">
          <Calendar className="h-3.5 w-3.5" /> Rango
        </span>
        <div className="inline-flex max-w-full overflow-x-auto rounded-full border border-white/50 bg-white/50 p-1 backdrop-blur-md scrollbar-hide dark:border-white/10 dark:bg-white/[0.04]">
          {RANGOS.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => set({ rango: r.id })}
              className={clsx(
                'rounded-full px-3 py-1 text-xs font-semibold transition min-h-[44px] sm:min-h-0 shrink-0',
                rango === r.id ? 'bg-white/80 text-navy-900 shadow-sm backdrop-blur-md dark:bg-white/10 dark:text-white' : 'text-neutral-500 hover:text-navy-700',
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
        {rango === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={from || ''}
              onChange={(e) => set({ from: e.target.value })}
              className="min-h-[44px] w-full rounded-input border border-white/50 bg-white/70 px-3 py-2.5 text-sm backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:focus-visible:ring-offset-black"
            />
            <span className="text-xs text-neutral-500">—</span>
            <input
              type="date"
              value={to || ''}
              onChange={(e) => set({ to: e.target.value })}
              className="min-h-[44px] w-full rounded-input border border-white/50 bg-white/70 px-3 py-2.5 text-sm backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:focus-visible:ring-offset-black"
            />
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-500">
          <Filter className="h-3.5 w-3.5" /> Ruta
        </span>
        <select
          value={ruta || ''}
          onChange={(e) => set({ ruta: e.target.value || null })}
          className="min-h-[44px] rounded-input border border-white/50 bg-white/70 px-3 py-2.5 text-sm backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:focus-visible:ring-offset-black"
        >
          <option value="">Todas</option>
          {rutas.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
