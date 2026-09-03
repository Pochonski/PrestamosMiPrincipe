import React from 'react';
import { TrendingUp, Wallet, AlertTriangle, Banknote, Users, HandCoins, CheckCircle2, Calendar } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { IconBox } from '../../components/ui/IconBox';
import { SectionTitle } from '../../components/ui/SectionTitle';
import { StatCard } from '../../components/ui/StatCard';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { formatCRC, formatDateTime } from '../../lib/format';
import { useResumenData } from './selectors';

export function ResumenPage() {
  const { data, loading } = useResumenData();

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 sm:gap-6">
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 sm:gap-6">
      <header>
        <div className="flex items-center gap-3">
          <IconBox icon={TrendingUp} tone="gold" size="md" />
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-navy-900 sm:text-2xl dark:text-white">
              Resumen general
            </h1>
            <p className="mt-0.5 text-sm text-neutral-600 dark:text-navy-300">
              Vista ejecutiva del estado del negocio.
            </p>
          </div>
        </div>
      </header>

      <section className="space-y-3">
        <SectionTitle title="Indicadores clave" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard
            label="Clientes"
            value={data.kpis.totalClientes}
            sub={data.kpis.totalClientes === 1 ? 'cliente registrado' : 'clientes registrados'}
            icon={Users}
            tone="navy"
          />
          <StatCard
            label="Préstamos activos"
            value={data.kpis.prestamosActivos}
            sub="vigentes + atrasados"
            icon={Wallet}
            tone="gold"
          />
          <StatCard
            label="Cobrado hoy"
            value={formatCRC(data.kpis.totalCobradoHoy)}
            sub={`${data.kpis.cobrosHoyCount} ${data.kpis.cobrosHoyCount === 1 ? 'cobro' : 'cobros'}`}
            icon={HandCoins}
            tone="success"
          />
          <StatCard
            label="En mora"
            value={formatCRC(data.kpis.totalAtrasado)}
            sub={data.kpis.totalAtrasado > 0 ? 'requiere atención' : 'sin atrasos'}
            icon={AlertTriangle}
            tone={data.kpis.totalAtrasado > 0 ? 'danger' : 'neutral'}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          <StatCard
            label="Cartera activa"
            value={formatCRC(data.kpis.carteraActiva)}
            sub="saldo pendiente"
            icon={Banknote}
            tone="info"
          />
          <StatCard
            label="Cobrado este mes"
            value={formatCRC(data.kpis.cobrosMes)}
            sub="total del mes en curso"
            icon={Calendar}
            tone="navy"
          />
          <StatCard
            label="Cancelados (30d)"
            value={data.kpis.cancelados30}
            sub="préstamos liquidados"
            icon={CheckCircle2}
            tone="emerald"
          />
        </div>
      </section>

      <section className="space-y-3">
        <SectionTitle title={`Top clientes (${data.topClientes.length})`} />
        {data.topClientes.length === 0 ? (
          <EmptyState icon={Users} title="Sin clientes todavía" />
        ) : (
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-navy-700/50">
                  <tr className="text-left text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-navy-300">
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3 text-center">Préstamos</th>
                    <th className="px-4 py-3 text-right">Total prestado</th>
                    <th className="px-4 py-3 text-right">Saldo pendiente</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-navy-700/60">
                  {data.topClientes.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-navy-700/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar nombre={c.nombre} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-navy-900 dark:text-white">
                              {c.nombre}
                            </p>
                            <p className="truncate text-xs text-neutral-500 dark:text-navy-300">
                              {c.cedula}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge tone="navy">{c.prestamosCount}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums text-navy-900 dark:text-white">
                        {formatCRC(c.totalPrestado)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums text-gold-600 dark:text-gold-300">
                        {formatCRC(c.saldoPendiente)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </section>

      <section className="space-y-3">
        <SectionTitle title={`Últimos cobros (${data.ultimosCobros.length})`} />
        {data.ultimosCobros.length === 0 ? (
          <EmptyState icon={HandCoins} title="Aún no hay cobros" />
        ) : (
          <Card className="divide-y divide-slate-100 p-0 dark:divide-navy-700/60">
            {data.ultimosCobros.map((c) => {
              const tipoMeta =
                c.tipo === 'capital'
                  ? { tone: 'emerald', label: 'Capital' }
                  : { tone: 'gold', label: 'Interés' };
              return (
                <div key={c.id} className="flex items-center gap-3 p-4">
                  <Avatar nombre={c.cliente?.nombre || '—'} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-navy-900 dark:text-white">
                        {c.cliente?.nombre || 'Cliente eliminado'}
                      </p>
                      <Badge tone={tipoMeta.tone}>{tipoMeta.label}</Badge>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-navy-300">
                      Cuota #{c.cuotaNumero} · {formatDateTime(c.fecha)}
                    </p>
                  </div>
                  <p className="text-sm font-bold tabular-nums text-navy-900 dark:text-white">
                    {formatCRC(c.monto)}
                  </p>
                </div>
              );
            })}
          </Card>
        )}
      </section>
    </div>
  );
}

export default ResumenPage;
