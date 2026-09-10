import React from 'react';
import { Search, X } from 'lucide-react';
import clsx from 'clsx';
import { Button } from '../../../components/ui/Button';

export function ClienteSearch({ value, onChange, total, filtered }) {
  return (
    <div className="space-y-2">
      <div
        className={clsx(
          'glass flex min-h-[44px] items-center gap-2 rounded-card px-3 py-3 transition-all',
          'focus-within:border-gold-400 focus-within:ring-2 focus-within:ring-gold-400/25',
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
            className="!h-9 !w-9 !p-0 sm:!h-7 sm:!w-7"
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
