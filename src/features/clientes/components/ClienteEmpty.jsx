import React from 'react';
import { UserPlus, Users } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';

export function ClienteEmpty({ query, onCreate }) {
  const hasQuery = Boolean(query);
  return (
    <EmptyState
      icon={hasQuery ? Users : UserPlus}
      variant="default"
      title={hasQuery ? 'Sin resultados' : 'Aún no hay clientes'}
      description={
        hasQuery
          ? 'No encontramos clientes que coincidan con tu búsqueda. Probá con otro nombre o cédula.'
          : 'Empezá registrando tu primer cliente para poder crear préstamos.'
      }
      action={
        !hasQuery && (
          <Button variant="primary" icon={UserPlus} onClick={onCreate} className="mt-2">
            Crear primer cliente
          </Button>
        )
      }
    />
  );
}
