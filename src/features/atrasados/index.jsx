import React from 'react';
import { AlertTriangle, Wallet, TrendingDown } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { IconBox } from '../../components/ui/IconBox';
import { Badge } from '../../components/ui/Badge';
import { SectionTitle } from '../../components/ui/SectionTitle';
import { StatCard } from '../../components/ui/StatCard';
import { useAtrasados } from './selectors';
import { formatCRC, formatCRCCompact, formatDate } from '../../lib/format';

export function AtrasadosPage({ onNavigate }) {
  const { items, resumen, loading } = useAtrasados();

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 sm:gap-6">
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  function handleCobrar(item) {
    onNavigate?.('cobro', {
      prestamoId: item.prestamo.id,
      clienteId: item.cliente.id,
    });
  }

  const maxAtraso = items.reduce((max, x) => Math.max(max, x.diasAtraso), 0);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 sm:gap-6">
      <header>
        <div className="flex items-center gap-3">
          <IconBox icon={AlertTriangle} tone="rose" size="md" />
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-navy-900 sm:text-2xl dark:text-white">
              Préstamos atrasados
            </h1>
            <p className="mt-0.5 text-sm text-neutral-600 dark:text-navy-300">
              Cuotas vencidas que aún no fueron pagadas.
            </p>
          </div>
        </div>
      </header>

      <section className="space-y-2">
        <SectionTitle title="Resumen" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <StatCard
            label="Cuotas atrasadas"
            value={resumen.cantidad}
            sub={resumen.cantidad === 1 ? 'cuota pendiente' : 'cuotas pendientes'}
            icon={AlertTriangle}
            tone="danger"
          />
          <StatCard
            label="Total adeudado"
            value={formatCRCCompact(resumen.total)}
            sub="solo intereses"
            icon={Wallet}
            tone="gold"
          />
          <StatCard
            label="Máx. días atraso"
            value={maxAtraso > 0 ? `${maxAtraso}` : '0'}
            sub={maxAtraso === 1 ? 'día vencido' : 'días vencidos'}
            icon={TrendingDown}
            tone={maxAtraso > 0 ? 'danger' : 'neutral'}
          />
        </div>
      </section>

      <section className="space-y-3">
        <SectionTitle title={`Pendientes (${items.length})`} />
        {items.length === 0 ? (
          <EmptyState
            icon={TrendingDown}
            variant="success"
            title="¡Sin atrasos!"
            description="Todos los clientes están al día con sus cuotas."
          />
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {items.map((item) => (
              <li key={`${item.prestamo.id}-${item.cuota.numero}`} className="animate-fade-in">
                <AtrasadoCard item={item} onCobrar={handleCobrar} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function AtrasadoCard({ item, onCobrar }) {
  const { prestamo, cuota, cliente, diasAtraso } = item;
  return (
    <Card
      className="cursor-pointer p-4 transition-shadow hover:shadow-cardHover sm:p-5"
      onClick={() => onCobrar?.(item)}
    >
      <div className="flex items-start gap-3">
        <IconBox icon={Wallet} tone="rose" size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-base font-bold text-navy-900 dark:text-white">
              {cliente.nombre}
            </p>
            <Badge tone="danger" icon={AlertTriangle}>
              {diasAtraso}d
            </Badge>
          </div>
          <p className="mt-0.5 truncate text-xs text-neutral-500 dark:text-navy-300">
            {cliente.cedula} · {cliente.telefono}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 dark:border-navy-700/60">
        <div>
          <p className="section-label">Cuota</p>
          <p className="mt-0.5 text-sm font-bold tabular-nums text-navy-900 dark:text-white">
            {formatCRC(cuota.monto)}
          </p>
        </div>
        <div>
          <p className="section-label">Venció</p>
          <p className="mt-0.5 text-sm font-semibold tabular-nums text-danger-600 dark:text-danger-500">
            {formatDate(cuota.fecha)}
          </p>
        </div>
        <div>
          <p className="section-label">Ruta</p>
          <p className="mt-0.5 truncate text-sm font-semibold text-navy-900 dark:text-white">
            {prestamo.ruta || '—'}
          </p>
        </div>
      </div>
    </Card>
  );
}

export default AtrasadosPage;
