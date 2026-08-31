import { UserPlus, Users } from 'lucide-react';
import { Card } from '../../../components/ui/Card';

export function ClienteEmpty({ query, onCreate }) {
  const hasQuery = Boolean(query);
  return (
    <Card className="flex flex-col items-center justify-center gap-3 p-8 text-center sm:p-10">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-50 text-gold-500 dark:bg-gold-500/10 dark:text-gold-300">
        {hasQuery ? <Users className="h-8 w-8" /> : <UserPlus className="h-8 w-8" />}
      </div>
      <h3 className="text-lg font-bold text-navy-900 dark:text-white">
        {hasQuery ? 'Sin resultados' : 'Aún no hay clientes'}
      </h3>
      <p className="max-w-sm text-sm text-slate-600 dark:text-navy-300">
        {hasQuery
          ? 'No encontramos clientes que coincidan con tu búsqueda. Probá con otro nombre o cédula.'
          : 'Empezá registrando tu primer cliente para poder crear préstamos.'}
      </p>
      {!hasQuery && (
        <button
          type="button"
          onClick={onCreate}
          className="mt-2 inline-flex items-center gap-2 rounded-xl bg-gold-gradient px-4 py-2.5 text-sm font-bold text-navy-900 shadow-glow transition-transform hover:scale-[1.02]"
        >
          <UserPlus className="h-4 w-4" />
          Crear primer cliente
        </button>
      )}
    </Card>
  );
}