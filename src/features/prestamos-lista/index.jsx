import React, { useMemo, useState } from 'react';
import { AlertTriangle, Briefcase, CheckCircle2, HandCoins, Wallet } from 'lucide-react';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { IconBox } from '../../components/ui/IconBox';
import { SectionTitle } from '../../components/ui/SectionTitle';
import { StatCard } from '../../components/ui/StatCard';
import { PrestamoRow } from './components/PrestamoRow';
import { PrestamosFilters } from './components/PrestamosFilters';
import { filterPrestamos, sortPrestamos, usePrestamosLista } from './selectors';
import { formatCRCCompact } from '../../lib/format';

export function PrestamosPage({ onNavigate }) {
  const { rows, counts, rutas, resumen, loading } = usePrestamosLista();
  const [tab, setTab] = useState('activos');
  const [q, setQ] = useState('');
  const [ruta, setRuta] = useState('');
  const [periodo, setPeriodo] = useState('');
  const [sort, setSort] = useState('proximo');

  const visible = useMemo(
    () => sortPrestamos(filterPrestamos(rows, { tab, q, ruta, periodo }), sort),
    [rows, tab, q, ruta, periodo, sort],
  );

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 sm:gap-6">
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  function handleCobrar(row) {
    onNavigate?.('cobro', { prestamoId: row.prestamoId, clienteId: row.clienteId });
  }

  function handleVer(row) {
    onNavigate?.('prestamo-detalle', { prestamoId: row.prestamoId });
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 sm:gap-6">
      <header>
        <div className="flex items-center gap-3">
          <IconBox icon={Briefcase} tone="neutral" size="md" />
          <div>
            <h1 className="font-display text-xl font-bold tracking-tight text-navy-900 sm:text-2xl dark:text-white">
              Préstamos
            </h1>
            <p className="mt-0.5 text-sm text-neutral-600 dark:text-navy-300">
              Cartera completa por estado: cuánto se cobra de cada préstamo y en qué fecha.
            </p>
          </div>
        </div>
      </header>

      <section className="space-y-2">
        <SectionTitle title="Resumen" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <StatCard
            label="Préstamos activos"
            value={resumen.activos}
            sub={`vigentes ${resumen.vigente} · atrasados ${resumen.atrasado}`}
            icon={Wallet}
            tone="gold"
          />
          <StatCard
            label="Cartera activa"
            value={formatCRCCompact(resumen.carteraActiva)}
            sub="saldo capital por cobrar"
            icon={Briefcase}
            tone="navy"
          />
          <StatCard
            label="Próxima cobranza"
            value={formatCRCCompact(resumen.proximaCobranza)}
            sub="suma de cuotas de activos"
            icon={HandCoins}
            tone="info"
          />
          <StatCard
            label="Total atrasado"
            value={formatCRCCompact(resumen.totalVencido)}
            sub={`${resumen.atrasado} préstamos atrasados`}
            icon={AlertTriangle}
            tone={resumen.atrasado > 0 ? 'danger' : 'neutral'}
          />
        </div>
      </section>

      <section className="space-y-3">
        <SectionTitle title={`Préstamos (${visible.length})`} />
        <PrestamosFilters
          tab={tab}
          setTab={setTab}
          counts={counts}
          q={q}
          setQ={setQ}
          ruta={ruta}
          setRuta={setRuta}
          rutas={rutas}
          periodo={periodo}
          setPeriodo={setPeriodo}
          sort={sort}
          setSort={setSort}
        />
        {visible.length === 0 ? (
          <EmptyState
            icon={rows.length === 0 ? Wallet : CheckCircle2}
            variant={rows.length === 0 ? 'neutral' : 'success'}
            title={rows.length === 0 ? 'Sin préstamos todavía' : 'Sin resultados'}
            description={
              rows.length === 0
                ? 'Registrá tu primer préstamo desde Clientes para verlo en esta lista.'
                : 'Probá con otro estado, ruta o búsqueda.'
            }
          />
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {visible.map((row) => (
              <li key={row.prestamoId} className="animate-fade-in">
                <PrestamoRow row={row} onCobrar={handleCobrar} onVer={handleVer} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default PrestamosPage;
