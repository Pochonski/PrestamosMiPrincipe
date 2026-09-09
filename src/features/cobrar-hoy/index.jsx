import React, { useState } from 'react';
import clsx from 'clsx';
import { AlertTriangle, CalendarClock, HandCoins, Wallet, CheckCircle2 } from 'lucide-react';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { IconBox } from '../../components/ui/IconBox';
import { SectionTitle } from '../../components/ui/SectionTitle';
import { StatCard } from '../../components/ui/StatCard';
import { CuotaItem } from './components/CuotaItem';
import { CobrosMes } from './components/CobrosMes';
import { useCobrarHoy } from './selectors';
import { formatCRCCompact } from '../../lib/format';

const TABS = [
  { id: 'hoy', label: 'Cobrar hoy' },
  { id: 'mes', label: 'Cobrado del mes' },
];

export function CobrarHoyPage({ onNavigate }) {
  const [tab, setTab] = useState('hoy');
  const { items, atrasadas, resumenDia, loading } = useCobrarHoy();

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
          <IconBox icon={HandCoins} tone="gold" size="md" />
          <div>
            <h1 className="font-display text-xl font-bold tracking-tight text-navy-900 sm:text-2xl dark:text-white">
              Cobros
            </h1>
            <p className="mt-0.5 text-sm text-neutral-600 dark:text-navy-300">
              Lo que toca cobrar hoy y lo ya cobrado en el mes, cliente por cliente.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Secciones de cobros">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={clsx(
                'inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-all',
                tab === t.id
                  ? 'bg-navy-900 text-white shadow-card dark:bg-gold-500 dark:text-navy-900'
                  : 'bg-white/50 backdrop-blur-md text-navy-700 hover:bg-white/80 dark:bg-white/[0.06] dark:text-navy-200 dark:hover:bg-white/10',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {tab === 'mes' ? (
        <CobrosMes onNavigate={onNavigate} />
      ) : loading ? (
        <>
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
          <Skeleton className="h-40 w-full" />
        </>
      ) : (
        <>
          <section className="space-y-2">
            <SectionTitle title="Resumen del día" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
              <StatCard
                label="A cobrar hoy"
                value={formatCRCCompact(resumenDia.total)}
                sub={`${resumenDia.cantidad === 1 ? '1 cuota pendiente' : `${resumenDia.cantidad} cuotas pendientes`} · hoy + atrasadas`}
                icon={Wallet}
                tone="gold"
              />
              <StatCard
                label="Vencen hoy"
                value={resumenDia.hoyCant}
                sub={`${formatCRCCompact(resumenDia.hoyTotal)} por cobrar`}
                icon={CalendarClock}
                tone="info"
              />
              <StatCard
                label="Atrasadas"
                value={resumenDia.atrCant}
                sub={`${formatCRCCompact(resumenDia.atrTotal)} por cobrar`}
                icon={AlertTriangle}
                tone={resumenDia.atrCant > 0 ? 'danger' : 'neutral'}
              />
            </div>
          </section>

          {resumenDia.cantidad === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              variant="success"
              title="¡Al día!"
              description="No hay cuotas con vencimiento hoy ni pagos atrasados."
            />
          ) : (
            <>
              {atrasadas.length > 0 && (
                <section className="space-y-3">
                  <SectionTitle title={`Atrasadas (${atrasadas.length})`} />
                  <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {atrasadas.map((item) => (
                      <li key={`${item.prestamo.id}-${item.cuota.numero}`} className="animate-fade-in">
                        <CuotaItem item={item} onCobrar={handleCobrar} variant="atrasado" />
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section className="space-y-3">
                <SectionTitle title={`Vencen hoy (${items.length})`} />
                {items.length === 0 ? (
                  <EmptyState
                    icon={CheckCircle2}
                    variant="success"
                    title="Hoy al día"
                    description="Nada vence hoy; solo quedan atrasadas por cobrar."
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
            </>
          )}
        </>
      )}
    </div>
  );
}

export default CobrarHoyPage;
