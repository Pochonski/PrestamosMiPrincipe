import React from 'react';
import { Search, X } from 'lucide-react';
import clsx from 'clsx';
import { Button } from '../../../components/ui/Button';

export function ClienteSearch({ value, onChange, total, filtered }) {
  return (
    <div className="space-y-2">
      <div
        className={clsx(
          'flex items-center gap-2 rounded-card border bg-white px-3 py-2.5 shadow-card transition-all',
          'border-slate-200 focus-within:border-gold-400 focus-within:ring-2 focus-within:ring-gold-400/30',
          'dark:bg-navy-800 dark:border-navy-700 dark:focus-within:border-gold-400',
        )}
      >
        <Search className="h-4 w-4 shrink-0 text-neutral-400 dark:text-navy-300" aria-hidden="true" />
        <input
          type="search"
          inputMode="search"
          placeholder="Buscar por nombre, cédula o teléfono"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Buscar cliente"
          className={clsx(
            'min-w-0 flex-1 bg-transparent text-sm outline-none',
            'placeholder:text-neutral-400 dark:placeholder:text-navy-300',
            'text-navy-900 dark:text-white',
          )}
        />
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon={X}
            onClick={() => onChange('')}
            aria-label="Limpiar búsqueda"
            className="!h-7 !w-7 !p-0"
          />
        )}
      </div>
      <p className="px-1 text-xs text-neutral-500 dark:text-navy-300">
        {value
          ? `${filtered} de ${total} ${total === 1 ? 'cliente' : 'clientes'}`
          : `${total} ${total === 1 ? 'cliente registrado' : 'clientes registrados'}`}
      </p>
    </div>
  );
}
