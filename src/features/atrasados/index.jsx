import { AlertTriangle, Wallet, TrendingDown, Loader2 } from 'lucide-react';
import { SectionTitle } from '../../components/ui/SectionTitle';
import { StatCard } from '../../components/ui/StatCard';
import { useAtrasados } from './selectors';
import { Card } from '../../components/ui/Card';
import { formatCRC, formatCRCCompact, formatDate } from '../../lib/format';

export function AtrasadosPage({ onNavigate }) {
  const { items, resumen, loading } = useAtrasados();

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

  const maxAtraso = items.reduce((max, x) => Math.max(max, x.diasAtraso), 0);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5 sm:gap-6">
      <header>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-navy-900 sm:text-2xl dark:text-white">
              Préstamos atrasados
            </h1>
            <p className="mt-0.5 text-sm text-slate-600 dark:text-navy-300">
              Cuotas vencidas que aún no fueron pagadas.
            </p>
          </div>
        </div>
      </header>

      <section>
        <SectionTitle title="Resumen" />
        <div className="mt-3 grid grid-cols-3 gap-3 sm:gap-4">
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
          <Card className="flex flex-col items-center gap-3 p-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
              <TrendingDown className="h-7 w-7 rotate-180" />
            </div>
            <div>
              <h3 className="text-base font-bold text-navy-900 dark:text-white">¡Sin atrasos!</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-navy-300">
                Todos los clientes están al día con sus cuotas.
              </p>
            </div>
          </Card>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {items.map((item) => (
              <li
                key={`${item.prestamo.id}-${item.cuota.numero}`}
                className="animate-fade-in"
              >
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
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
          <Wallet className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-base font-bold text-navy-900 dark:text-white">
              {cliente.nombre}
            </p>
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
              <AlertTriangle className="h-3 w-3" />
              {diasAtraso}d
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-navy-300">
            {cliente.cedula} · {cliente.telefono}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 dark:border-navy-700/60">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-navy-300">
            Cuota
          </p>
          <p className="mt-0.5 text-sm font-bold tabular-nums text-navy-900 dark:text-white">
            {formatCRC(cuota.monto)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-navy-300">
            Venció
          </p>
          <p className="mt-0.5 text-sm font-semibold tabular-nums text-rose-600 dark:text-rose-400">
            {formatDate(cuota.fecha)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-navy-300">
            Ruta
          </p>
          <p className="mt-0.5 truncate text-sm font-semibold text-navy-900 dark:text-white">
            {prestamo.ruta || '—'}
          </p>
        </div>
      </div>
    </Card>
  );
}

export default AtrasadosPage;