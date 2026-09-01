import { CalendarClock, Wallet, CheckCircle2, Loader2 } from 'lucide-react';
import { SectionTitle } from '../../components/ui/SectionTitle';
import { StatCard } from '../../components/ui/StatCard';
import { CuotaItem } from './components/CuotaItem';
import { useCobrarHoy } from './selectors';
import { formatCRCCompact } from '../../lib/format';

export function CobrarHoyPage({ onNavigate }) {
  const { items, resumen, loading } = useCobrarHoy();

  if (loading) {
    return (
      <div className="mx-auto flex max-w-4xl items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
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
    <div className="mx-auto flex max-w-4xl flex-col gap-5 sm:gap-6">
      <header>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300">
            <CalendarClock className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-navy-900 sm:text-2xl dark:text-white">
              Cobrar hoy
            </h1>
            <p className="mt-0.5 text-sm text-slate-600 dark:text-navy-300">
              Cuotas con vencimiento el día de hoy.
            </p>
          </div>
        </div>
      </header>

      <section>
        <SectionTitle title="Resumen" />
        <div className="mt-3 grid grid-cols-2 gap-3 sm:gap-4">
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

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-navy-700 dark:bg-navy-800">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
        <Icon className="h-7 w-7" />
      </div>
      <div>
        <h3 className="text-base font-bold text-navy-900 dark:text-white">{title}</h3>
        <p className="mt-1 text-sm text-slate-600 dark:text-navy-300">{description}</p>
      </div>
    </div>
  );
}

export default CobrarHoyPage;