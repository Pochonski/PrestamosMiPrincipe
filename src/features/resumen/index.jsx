import React from 'react';
import { useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Wallet,
  AlertTriangle,
  Banknote,
  Users,
  HandCoins,
  CheckCircle2,
  Calendar,
  BarChart3,
  Percent,
  Target,
  Download,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { IconBox } from '../../components/ui/IconBox';
import { SectionTitle } from '../../components/ui/SectionTitle';
import { StatCard } from '../../components/ui/StatCard';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { formatCRC, formatDateTime } from '../../lib/format';
import { useResumenData } from './selectors';
import { ResumenFilters } from './components/ResumenFilters';
import { Sparkline } from './components/Sparkline';
import { BarChart } from '../reportes/components/BarChart';
import { DonutChart } from '../reportes/components/DonutChart';
import { HorizontalBars } from '../reportes/components/HorizontalBars';
import { withOrgPrefix } from '../../components/layout/nav-config';
import { useAuth } from '../auth/useAuth';

function useResumenFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rango = searchParams.get('rango') || 'mes';
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';
  const ruta = searchParams.get('ruta') || '';
  const filters = useMemo(() => ({ rango, from: from || null, to: to || null, ruta: ruta || null }), [rango, from, to, ruta]);
  function setFilters(next) {
    const params = new URLSearchParams(searchParams);
    Object.entries(next).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    // clean custom dates if not custom
    if (next.rango && next.rango !== 'custom') {
      params.delete('from');
      params.delete('to');
    }
    setSearchParams(params, { replace: true });
  }
  return [filters, setFilters];
}

function exportResumenCSV(data) {
  const { kpis, topClientes, ultimosCobros } = data;
  const rows = [
    ['KPI', 'Valor'],
    ['Clientes', kpis.totalClientes],
    ['Prestamos activos', kpis.prestamosActivos],
    ['Cobrado hoy', kpis.totalCobradoHoy],
    ['En mora', kpis.totalAtrasado],
    ['Cartera activa', kpis.carteraActiva],
    ['Cobrado mes', kpis.cobrosMes],
    ['Cancelados 30d', kpis.cancelados30],
    ['Tasa morosidad %', kpis.tasaMorosidad.toFixed(2)],
    ['Eficiencia hoy %', kpis.eficienciaCobroHoy ?? '—'],
    ['Prestamo promedio', kpis.prestamoPromedio],
    [],
    ['Top clientes', 'Total prestado', 'Saldo'],
    ...topClientes.map((c) => [c.nombre, c.totalPrestado, c.saldoPendiente]),
    [],
    ['Ultimos cobros', 'Cliente', 'Monto', 'Tipo'],
    ...ultimosCobros.map((c) => [c.cliente?.nombre || '—', c.monto, c.tipo]),
  ];
  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `resumen-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ResumenPage({ onNavigate }) {
  const [filters, setFilters] = useResumenFilters();
  const { data, loading, isError, error, hasMore, refetch } = useResumenData(filters);
  const { currentOrg } = useAuth();
  const navigate = useNavigate();

  function go(path, params = {}) {
    if (onNavigate && (path === '/clientes' || path === '/cobros/nuevo' || path === '/cobrar-hoy')) {
      // map path to nav id for AppShell's controlled navigation
      const idMap = { '/clientes': 'clientes', '/cobros/nuevo': 'cobro', '/cobrar-hoy': 'cobrar-hoy' };
      const id = idMap[path];
      if (id) {
        onNavigate(id, params);
        return;
      }
    }
    const slug = currentOrg?.slug;
    const base = slug ? withOrgPrefix(slug, path) : path;
    const search = Object.keys(params).length ? `?${new URLSearchParams(params).toString()}` : '';
    navigate(`${base}${search}`);
  }

  function goClienteDetalle(clienteId) {
    if (onNavigate) onNavigate('cliente-detalle', { clienteId });
    else go(`/clientes/${clienteId}`);
  }

  function goPrestamoDetalle(prestamoId) {
    if (onNavigate) onNavigate('prestamo-detalle', { prestamoId });
    else go(`/prestamos/${prestamoId}`);
  }

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 sm:gap-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-4">
        <Alert tone="danger" title="Error al cargar resumen">
          {error?.message || 'No se pudo cargar el resumen.'}
        </Alert>
        <Button variant="secondary" icon={RefreshCw} onClick={() => refetch()}>
          Reintentar
        </Button>
      </div>
    );
  }

  const k = data.kpis;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 sm:gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <IconBox icon={TrendingUp} tone="gold" size="md" />
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-navy-900 sm:text-2xl dark:text-white">Resumen general</h1>
            <p className="mt-0.5 text-sm text-neutral-600 dark:text-navy-300">
              Vista ejecutiva · {currentOrg?.nombre || '—'} {filters.ruta ? `· Ruta ${filters.ruta}` : ''} {filters.rango !== 'mes' ? `· ${filters.rango}` : ''}
            </p>
          </div>
        </div>
        <Button variant="secondary" icon={Download} onClick={() => exportResumenCSV(data)}>
          Exportar CSV
        </Button>
      </header>

      <ResumenFilters filters={filters} onChange={setFilters} rutas={data.rutas} />

      {hasMore && (
        <Alert tone="warning" title="Datos parciales">
          Mostrando hasta 500 registros por tipo. Filtrá por ruta o rango para ver más detalle. La paginación completa viene en la próxima iteración.
        </Alert>
      )}

      {/* KPIs principales */}
      <section className="space-y-3">
        <SectionTitle title="Indicadores clave" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <div className="relative">
            <StatCard label="Clientes" value={k.totalClientes} sub={k.totalClientes === 1 ? 'cliente registrado' : 'clientes registrados'} icon={Users} tone="navy" />
          </div>
          <StatCard label="Préstamos activos" value={k.prestamosActivos} sub="vigentes + atrasados" icon={Wallet} tone="gold" />
          <div className="relative">
            <StatCard
              label="Cobrado hoy"
              value={formatCRC(k.totalCobradoHoy)}
              sub={`${k.cobrosHoyCount} cobros · por cobrar ${formatCRC(k.totalPorCobrarHoy)}`}
              icon={HandCoins}
              tone="success"
              delta={k.eficienciaCobroHoy != null ? k.eficienciaCobroHoy - 100 : undefined}
            />
            <div className="absolute bottom-2 right-2 hidden sm:block">
              <Sparkline data={data.spark7} color="#16a34a" />
            </div>
          </div>
          <StatCard
            label="En mora"
            value={formatCRC(k.totalAtrasado)}
            sub={`${k.cantidadAtrasados} préstamos · ${k.tasaMorosidad.toFixed(1)}% cartera`}
            icon={AlertTriangle}
            tone={k.totalAtrasado > 0 ? 'danger' : 'neutral'}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          <StatCard label="Cartera activa" value={formatCRC(k.carteraActiva)} sub="saldo pendiente" icon={Banknote} tone="info" />
          <StatCard
            label="Cobrado este mes"
            value={formatCRC(k.cobrosMes)}
            sub={`prev ${formatCRC(k.cobrosPrevMes)}`}
            icon={Calendar}
            tone="navy"
            delta={k.deltaCobrosMes}
          />
          <StatCard label="Cancelados (30d)" value={k.cancelados30} sub="préstamos liquidados" icon={CheckCircle2} tone="emerald" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
          <Card hover className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Tasa morosidad</p>
              <p className={`mt-1 text-2xl font-bold tabular-nums ${k.tasaMorosidad > 10 ? 'text-danger-600' : 'text-navy-800 dark:text-navy-50'}`}>{k.tasaMorosidad.toFixed(1)}%</p>
              <p className="mt-1 text-xs text-neutral-500">{formatCRC(k.totalAtrasado)} / {formatCRC(k.carteraActiva)}</p>
            </div>
            <IconBox icon={Percent} tone={k.tasaMorosidad > 10 ? 'danger' : 'neutral'} size="md" />
          </Card>
          <Card hover className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Eficiencia cobro hoy</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-navy-800 dark:text-navy-50">{k.eficienciaCobroHoy == null ? '—' : `${k.eficienciaCobroHoy.toFixed(0)}%`}</p>
              <p className="mt-1 text-xs text-neutral-500">{formatCRC(k.totalCobradoHoy)} / {formatCRC(k.totalPorCobrarHoy)} por cobrar</p>
            </div>
            <IconBox icon={Target} tone="success" size="md" />
          </Card>
          <Card hover className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Préstamo promedio</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-navy-800 dark:text-navy-50">{formatCRC(Math.round(k.prestamoPromedio))}</p>
              <p className="mt-1 text-xs text-neutral-500">{k.prestamosActivos} activos</p>
            </div>
            <IconBox icon={BarChart3} tone="gold" size="md" />
          </Card>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-2">
          <Card hover className="flex items-center justify-between cursor-pointer" onClick={() => (onNavigate ? onNavigate('cobrar-hoy') : go('/cobrar-hoy'))}>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Por cobrar hoy</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-navy-800 dark:text-navy-50">{k.cantidadCobrarHoy} cuotas · {formatCRC(k.totalPorCobrarHoy)}</p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-neutral-400" />
          </Card>
          <Card hover className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Cobros en rango</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-navy-800 dark:text-navy-50">{data.cobrosEnRangoCount} cobros</p>
            </div>
            <Sparkline data={data.spark30.slice(-14)} color="#0ea5e9" height={24} />
          </Card>
        </div>
      </section>

      {/* Charts */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle title="Cobros últimos 6 meses" />
          <div className="mt-3">
            <BarChart data={data.cobros6m} />
          </div>
        </Card>
        <Card>
          <SectionTitle title="Préstamos por estado" />
          <div className="mt-3 flex justify-center">
            <DonutChart
              data={[
                { label: 'Vigente', value: data.porEstado.vigente, color: '#D4AF37' },
                { label: 'Atrasado', value: data.porEstado.atrasado, color: '#ef4444' },
                { label: 'Cancelado', value: data.porEstado.cancelado, color: '#10b981' },
              ]}
              total={data.porEstado.vigente + data.porEstado.atrasado + data.porEstado.cancelado}
            />
            <div className="mt-3 flex justify-center gap-4 text-xs">
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-gold-400" /> Vigente {data.porEstado.vigente}</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-danger-500" /> Atrasado {data.porEstado.atrasado}</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Cancelado {data.porEstado.cancelado}</span>
            </div>
          </div>
        </Card>
      </section>

      <section>
        <Card>
          <SectionTitle title="Saldo por ruta (top 5)" />
          <div className="mt-3">
            <HorizontalBars data={data.saldoPorRuta.map((r) => ({ label: r.ruta, value: r.saldo }))} />
          </div>
        </Card>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionTitle title={`Top clientes (${data.topClientes.length})`} />
          <Button variant="ghost" size="sm" onClick={() => (onNavigate ? onNavigate('clientes') : go('/clientes'))}>
            Ver todos
          </Button>
        </div>
        {data.topClientes.length === 0 ? (
          <EmptyState icon={Users} title="Sin clientes todavía" description="Creá tu primer cliente para ver el ranking." action={<Button variant="primary" onClick={() => (onNavigate ? onNavigate('clientes') : go('/clientes'))}>Ir a clientes</Button>} />
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
                    <tr key={c.id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-navy-700/30" onClick={() => goClienteDetalle(c.id)}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar nombre={c.nombre} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-navy-900 dark:text-white">{c.nombre}</p>
                            <p className="truncate text-xs text-neutral-500 dark:text-navy-300">{c.cedula}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge tone="navy">{c.prestamosCount}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums text-navy-900 dark:text-white">{formatCRC(c.totalPrestado)}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums text-gold-600 dark:text-gold-300">{formatCRC(c.saldoPendiente)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </section>

      {data.topMorosos.length > 0 && (
        <section className="space-y-3">
          <SectionTitle title={`Top morosos (${data.topMorosos.length})`} />
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-navy-700/50">
                  <tr className="text-left text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3 text-right">Atrasado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-navy-700/60">
                  {data.topMorosos.map((c) => (
                    <tr key={c.id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-navy-700/30" onClick={() => goClienteDetalle(c.id)}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar nombre={c.nombre} size="sm" />
                          <p className="truncate text-sm font-semibold text-navy-900 dark:text-white">{c.nombre}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-bold tabular-nums text-danger-600">{formatCRC(c.atrasado)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionTitle title={`Últimos cobros (${data.ultimosCobros.length})`} />
          <Button variant="ghost" size="sm" onClick={() => (onNavigate ? onNavigate('cobro') : go('/cobros/nuevo'))}>
            Ver más
          </Button>
        </div>
        {data.ultimosCobros.length === 0 ? (
          <EmptyState icon={HandCoins} title="Aún no hay cobros" description="Registrá el primer cobro para ver actividad reciente." />
        ) : (
          <Card className="divide-y divide-slate-100 p-0 dark:divide-navy-700/60">
            {data.ultimosCobros.map((c) => {
              const tipoMeta = c.tipo === 'capital' ? { tone: 'emerald', label: 'Capital' } : { tone: 'gold', label: 'Interés' };
              return (
                <div key={c.id} className="flex cursor-pointer items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-navy-700/30" onClick={() => goPrestamoDetalle(c.prestamo_id || c.prestamoId || '')}>
                  <Avatar nombre={c.cliente?.nombre || '—'} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-navy-900 dark:text-white">{c.cliente?.nombre || 'Cliente eliminado'}</p>
                      <Badge tone={tipoMeta.tone}>{tipoMeta.label}</Badge>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-navy-300">Cuota #{c.cuotaNumero ?? '—'} · {formatDateTime(c.fecha)}</p>
                  </div>
                  <p className="text-sm font-bold tabular-nums text-navy-900 dark:text-white">{formatCRC(c.monto)}</p>
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
