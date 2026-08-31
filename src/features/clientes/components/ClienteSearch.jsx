import { Search, X } from 'lucide-react';
import clsx from 'clsx';

export function ClienteSearch({ value, onChange, total, filtered }) {
  return (
    <div className="space-y-2">
      <div
        className={clsx(
          'flex items-center gap-2 rounded-2xl border bg-white px-3 py-2.5 shadow-card transition-colors',
          'border-slate-200 focus-within:border-gold-400 focus-within:ring-2 focus-within:ring-gold-400/30',
          'dark:bg-navy-800 dark:border-navy-700 dark:focus-within:border-gold-400',
        )}
      >
        <Search className="h-4 w-4 shrink-0 text-slate-400 dark:text-navy-300" />
        <input
          type="search"
          inputMode="search"
          placeholder="Buscar por nombre, cédula o teléfono"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={clsx(
            'min-w-0 flex-1 bg-transparent text-sm outline-none',
            'placeholder:text-slate-400 dark:placeholder:text-navy-300',
            'text-navy-900 dark:text-white',
          )}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className={clsx(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors',
              'hover:bg-slate-100 dark:text-navy-300 dark:hover:bg-navy-700',
            )}
            aria-label="Limpiar búsqueda"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <p className="px-1 text-xs text-slate-500 dark:text-navy-300">
        {value
          ? `${filtered} de ${total} ${total === 1 ? 'cliente' : 'clientes'}`
          : `${total} ${total === 1 ? 'cliente registrado' : 'clientes registrados'}`}
      </p>
    </div>
  );
}