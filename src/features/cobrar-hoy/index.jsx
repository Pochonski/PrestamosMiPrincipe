import React from 'react';
import { CalendarClock, Wallet, CheckCircle2 } from 'lucide-react';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { IconBox } from '../../components/ui/IconBox';
import { SectionTitle } from '../../components/ui/SectionTitle';
import { StatCard } from '../../components/ui/StatCard';
import { CuotaItem } from './components/CuotaItem';
import { useCobrarHoy } from './selectors';
import { formatCRCCompact } from '../../lib/format';

export function CobrarHoyPage({ onNavigate }) {
  const { items, resumen, loading } = useCobrarHoy();

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 sm:gap-6">
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
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

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 sm:gap-6">
      <header>
        <div className="flex items-center gap-3">
          <IconBox icon={CalendarClock} tone="info" size="md" />
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-navy-900 sm:text-2xl dark:text-white">
              Cobrar hoy
            </h1>
            <p className="mt-0.5 text-sm text-neutral-600 dark:text-navy-300">
              Cuotas con vencimiento el día de hoy.
            </p>
          </div>
        </div>
      </header>

      <section className="space-y-2">
        <SectionTitle title="Resumen" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <StatCard
            label="Cuotas hoy"
            value={resumen.cantidad}
            sub={resumen.cantidad === 1 ? 'cuota vence hoy' : 'cuotas vencen hoy'}
            icon={CalendarClock}
            tone="info"
          />
          <StatCard
            label="Total a cobrar"
            value={formatCRCCompact(resumen.total)}
            sub="solo intereses"
            icon={Wallet}
            tone="gold"
          />
        </div>
      </section>

      <section className="space-y-3">
        <SectionTitle title={`Pendientes (${items.length})`} />
        {items.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            variant="success"
            title="¡Al día!"
            description="No hay cuotas con vencimiento hoy."
          />
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {items.map((item) => (
              <li key={`${item.prestamo.id}-${item.cuota.numero}`} className="animate-fade-in">
                <CuotaItem item={item} onCobrar={handleCobrar} variant="today" />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default CobrarHoyPage;
