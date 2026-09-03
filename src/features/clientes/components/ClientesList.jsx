import { Loader2 } from 'lucide-react';
import { ClienteCard } from './ClienteCard';
import { ClienteEmpty } from './ClienteEmpty';

export function ClientesList({ clientes, query, onOpen, onEdit, onDelete, onCreate, hasMore, loadingMore, loadMore, PAGE_SIZE = 50 }) {
  if (!clientes || clientes.length === 0) {
    return <ClienteEmpty query={query} onCreate={onCreate} />;
  }
  return (
    <div className="space-y-4">
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
      {hasMore && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-navy-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-navy-700 dark:bg-navy-800 dark:text-navy-100 dark:hover:bg-navy-700"
          >
            {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
            {loadingMore ? 'Cargando…' : `Cargar más (${PAGE_SIZE})`}
          </button>
        </div>
      )}
    </div>
  );
}