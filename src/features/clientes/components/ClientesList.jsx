import { ClienteCard } from './ClienteCard';
import { ClienteEmpty } from './ClienteEmpty';

export function ClientesList({ clientes, query, onOpen, onEdit, onDelete, onCreate }) {
  if (!clientes || clientes.length === 0) {
    return <ClienteEmpty query={query} onCreate={onCreate} />;
  }
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
      {clientes.map((c) => (
        <li key={c.id} className="animate-fade-in">
          <ClienteCard
            cliente={c}
            onOpen={onOpen}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </li>
      ))}
    </ul>
  );
}