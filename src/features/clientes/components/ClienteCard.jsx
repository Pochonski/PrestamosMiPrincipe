import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Avatar } from '../../../components/ui/Avatar';
import { formatPhoneCR } from '../../../lib/format';
import { colorFor } from '../../../lib/color';
import { ClienteActionsMenu } from './ClienteActionsMenu';

export function ClienteCard({ cliente, onOpen, onEdit, onDelete }) {
  return (
    <Card interactive padding="md" onClick={() => onOpen?.(cliente)}>
      <div
        className="absolute right-3 top-3 sm:right-4 sm:top-4"
        onClick={(e) => e.stopPropagation()}
      >
        <ClienteActionsMenu
          onEdit={() => onEdit?.(cliente)}
          onDelete={() => onDelete?.(cliente)}
        />
      </div>

      <div className="flex items-start gap-3 pr-10">
        <Avatar nombre={cliente.nombre} color={colorFor(cliente.id)} size="md" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold text-navy-900 dark:text-white">
            {cliente.nombre}
          </h3>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-navy-300">
            {cliente.cedula} · {formatPhoneCR(cliente.telefono)}
          </p>
          <p className="mt-2 line-clamp-2 text-sm text-neutral-600 dark:text-navy-300">
            {cliente.direccion}
          </p>
        </div>
      </div>
    </Card>
  );
}
