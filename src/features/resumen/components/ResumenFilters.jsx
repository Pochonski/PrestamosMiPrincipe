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
    <div className="flex flex-col gap-3 rounded-card border border-slate-200 bg-white p-3 dark:border-navy-700 dark:bg-navy-800 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-500">
          <Calendar className="h-3.5 w-3.5" /> Rango
        </span>
        <div className="inline-flex overflow-hidden rounded-full border border-slate-200 bg-slate-100 p-1 dark:border-navy-700 dark:bg-navy-900">
          {RANGOS.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => set({ rango: r.id })}
              className={clsx(
                'rounded-full px-3 py-1 text-xs font-semibold transition',
                rango === r.id ? 'bg-white text-navy-900 shadow-sm dark:bg-navy-700 dark:text-white' : 'text-neutral-500 hover:text-navy-700',
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
              className="rounded-input border border-slate-200 bg-white px-2 py-1.5 text-xs dark:border-navy-700 dark:bg-navy-900"
            />
            <span className="text-xs text-neutral-500">—</span>
            <input
              type="date"
              value={to || ''}
              onChange={(e) => set({ to: e.target.value })}
              className="rounded-input border border-slate-200 bg-white px-2 py-1.5 text-xs dark:border-navy-700 dark:bg-navy-900"
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
          className="rounded-input border border-slate-200 bg-white px-3 py-2 text-xs dark:border-navy-700 dark:bg-navy-800"
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
