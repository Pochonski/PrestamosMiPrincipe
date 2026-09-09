import React from 'react';
import clsx from 'clsx';
import { Search } from 'lucide-react';
import { TABS, SORTS } from '../selectors';

const PERIODOS = [
  { id: '', label: 'Todos los períodos' },
  { id: 'diario', label: 'Diario' },
  { id: 'semanal', label: 'Semanal' },
  { id: 'quincenal', label: 'Quincenal' },
  { id: 'mensual', label: 'Mensual' },
  { id: 'dia_mes', label: 'Día del mes' },
];

const selectCls =
  'rounded-input border border-white/50 bg-white/70 backdrop-blur-md px-3 py-2 text-sm font-medium text-navy-800 dark:border-white/10 dark:bg-white/[0.06] dark:text-navy-100';

export function PrestamosFilters({
  tab,
  setTab,
  counts,
  q,
  setQ,
  ruta,
  setRuta,
  rutas,
  periodo,
  setPeriodo,
  sort,
  setSort,
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtrar por estado">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={clsx(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all',
              tab === t.id
                ? 'bg-navy-900 text-white shadow-card dark:bg-gold-500 dark:text-navy-900'
                : 'bg-white/50 backdrop-blur-md text-navy-700 hover:bg-white/80 dark:bg-white/[0.06] dark:text-navy-200 dark:hover:bg-white/10',
            )}
          >
            {t.label}
            <span className={clsx('rounded-full px-1.5 tabular-nums', tab === t.id ? 'bg-white/20' : 'bg-white dark:bg-black')}>
              {counts?.[t.id] ?? 0}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar cliente, cédula, teléfono o ruta…"
            aria-label="Buscar préstamos"
            className="w-full rounded-input border border-white/50 bg-white/70 backdrop-blur-md py-2 pl-9 pr-3 text-sm text-navy-800 placeholder:text-neutral-400 dark:border-white/10 dark:bg-white/[0.06] dark:text-navy-100"
          />
        </label>
        <select value={ruta} onChange={(e) => setRuta(e.target.value)} aria-label="Filtrar por ruta" className={selectCls}>
          <option value="">Todas las rutas</option>
          {(rutas || []).map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select value={periodo} onChange={(e) => setPeriodo(e.target.value)} aria-label="Filtrar por período" className={selectCls}>
          {PERIODOS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Ordenar préstamos" className={selectCls}>
          {SORTS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
