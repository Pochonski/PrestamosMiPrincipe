import React from 'react';
import { Bell } from 'lucide-react';
import { EmptyState } from '../../../components/ui/EmptyState';

export function EmptyNotificaciones({ filter }) {
  const isFiltered = filter === 'no-leidas';
  return (
    <EmptyState
      icon={Bell}
      title={isFiltered ? '¡Todo al día!' : 'Sin notificaciones'}
      description={
        isFiltered
          ? 'No tenés notificaciones sin leer.'
          : 'Cuando haya cobros pendientes o atrasos, aparecerán acá.'
      }
    />
  );
}
