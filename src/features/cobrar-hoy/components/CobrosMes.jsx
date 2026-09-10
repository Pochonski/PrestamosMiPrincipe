import React, { useMemo, useState } from 'react';
import { BadgeCheck, BadgeX, Download, HandCoins, Search, Users, Wallet, ReceiptText } from 'lucide-react';
import { Skeleton } from '../../../components/ui/Skeleton';
import { EmptyState } from '../../../components/ui/EmptyState';
import { SectionTitle } from '../../../components/ui/SectionTitle';
import { StatCard } from '../../../components/ui/StatCard';
import { Alert } from '../../../components/ui/Alert';
import { Card } from '../../../components/ui/Card';
import { MonthNavigator } from './MonthNavigator';
import { ClienteCobroRow } from './ClienteCobroRow';
import {
  filterGrupos,
  monthKeyOf,
  sortGrupos,
  useCobrosMes,
} from '../selectors';
import { formatCRC, formatCRCCompact } from '../../../lib/format';
import { downloadCSV, downloadCSVChunked, generateCSV } from '../../exportar/selectors';

const SORTS = [
  { id: 'total', label: 'Mayor total' },
  { id: 'cobros', label: 'Más cobros' },
  { id: 'nombre', label: 'Nombre A–Z' },
  { id: 'reciente', label: 'Cobro más reciente' },
];

const selectCls =
  'rounded-input border border-white/50 bg-white/70 backdrop-blur-md px-4 py-2.5 text-sm font-medium text-navy-800 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/10 dark:bg-white/[0.06] dark:text-navy-100 dark:focus-visible:ring-offset-black';

const CSV_COLUMNS = [
  { key: 'fecha', label: 'Fecha' },
  { key: 'cliente', label: 'Cliente' },
  { key: 'cedula', label: 'Cédula' },
  { key: 'telefono', label: 'Teléfono' },
  { key: 'ruta', label: 'Ruta' },
  { key: 'prestamo_id', label: 'Préstamo ID' },
  { key: 'cuota', label: 'Cuota #' },
  { key: 'tipo', label: 'Tipo' },
  { key: 'capital', label: 'Capital pagado' },
  { key: 'interes', label: 'Interés pagado' },
  { key: 'monto', label: 'Monto' },
  { key: 'nota', label: 'Nota' },
];

function toCsvRows(cobros, grupos) {
  const clienteById = new Map(grupos.map((g) => [g.clienteId, g.cliente]));
  return cobros.map((c) => {
    const cli = clienteById.get(c.cliente_id ?? c.clienteId) || {};
    return {
      fecha: c.fecha,
      cliente: cli.nombre || '',
      cedula: cli.cedula || '',
      telefono: cli.telefono || '',
      ruta: c.ruta || '',
      prestamo_id: c.prestamo_id ?? c.prestamoId ?? '',
      cuota: c.cuota_numero ?? c.cuotaNumero ?? '',
      tipo: c.tipo || '',
      capital: c._capital ?? c.capital_pagado ?? '',
      interes: c._interes ?? c.interes_pagado ?? '',
      monto: c.monto ?? '',
      nota: c.nota || '',
    };
  });
}

export function CobrosMes({ onNavigate }) {
  const [monthKey, setMonthKey] = useState(() => monthKeyOf(new Date()));
  const [q, setQ] = useState('');
  const [ruta, setRuta] = useState('');
  const [tipo, setTipo] = useState('');
  const [sort, setSort] = useState('total');

  const { grupos, totales, totalesPrev, validacion, rutas, loading } = useCobrosMes(monthKey);

  const visible = useMemo(
    () => sortGrupos(filterGrupos(grupos, { q, ruta, tipo }), sort),
    [grupos, q, ruta, tipo, sort],
  );
  const maxTotal = useMemo(() => visible.reduce((m, g) => Math.max(m, g.total), 0), [visible]);
  const delta = totalesPrev.total > 0 ? ((totales.total - totalesPrev.total) / totalesPrev.total) * 100 : null;

  function handleExport() {
    const allRows = [];
    for (const g of grupos) allRows.push(...g.cobros);
    const items = toCsvRows(allRows, grupos);
    const filename = `cobros-${monthKey}.csv`;
    if (items.length > 500) return downloadCSVChunked(filename, items, CSV_COLUMNS);
    return downloadCSV(filename, generateCSV(items, CSV_COLUMNS));
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-5 sm:gap-6">
        <Skeleton className="h-14 w-full" />
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

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <MonthNavigator monthKey={monthKey} onChange={setMonthKey} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <StatCard
          label="Cobrado en el mes"
          value={formatCRCCompact(totales.total)}
          sub={`${totales.count} cobros · ${grupos.length} clientes`}
          icon={Wallet}
          tone="gold"
          delta={delta}
        />
        <StatCard label="Capital" value={formatCRCCompact(totales.capital)} sub="abono a saldo" icon={BadgeCheck} tone="success" />
        <StatCard label="Intereses" value={formatCRCCompact(totales.interes)} sub="cuotas cobradas" icon={HandCoins} tone="info" />
        <StatCard
          label="Clientes que pagaron"
          value={grupos.length}
          sub={totales.count === 1 ? '1 cobro registrado' : `${totales.count} cobros registrados`}
          icon={Users}
          tone="navy"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar cliente, cédula o teléfono…"
            aria-label="Buscar cobros del mes"
            className="w-full min-h-[44px] rounded-input border border-white/50 bg-white/70 backdrop-blur-md py-2.5 pl-9 pr-3 text-sm text-navy-800 placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/10 dark:bg-white/[0.06] dark:text-navy-100 dark:focus-visible:ring-offset-black"
          />
        </label>
        <select value={ruta} onChange={(e) => setRuta(e.target.value)} aria-label="Filtrar por ruta" className={selectCls}>
          <option value="">Todas las rutas</option>
          {rutas.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} aria-label="Filtrar por tipo" className={selectCls}>
          <option value="">Capital + interés</option>
          <option value="capital">Solo capital</option>
          <option value="interes">Solo interés</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Ordenar clientes" className={selectCls}>
          {SORTS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <section className="space-y-3">
        <SectionTitle title={`Por cliente (${visible.length})`} />
        {visible.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title="Sin cobros este mes"
            description="Todavía no hay cobros registrados en este mes con los filtros actuales."
          />
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {visible.map((g) => (
              <li key={g.clienteId || 'sin-cliente'} className="animate-fade-in">
                <ClienteCobroRow
                  grupo={g}
                  maxTotal={maxTotal}
                  onVerCliente={(row) =>
                    row.cliente?.id && onNavigate?.('cliente-detalle', { clienteId: row.cliente.id })
                  }
                  onVerCobro={(c) =>
                    onNavigate?.('prestamo-detalle', { prestamoId: c.prestamo_id ?? c.prestamoId })
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <SectionTitle title="Conciliación del mes" />
        <Card padding="md">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
            <div>
              <p className="section-label">Total mes</p>
              <p className="mt-0.5 text-base font-bold tabular-nums text-navy-900 dark:text-white">{formatCRC(totales.total)}</p>
            </div>
            <div>
              <p className="section-label">Capital</p>
              <p className="mt-0.5 text-base font-bold tabular-nums text-success-600 dark:text-success-500">{formatCRC(totales.capital)}</p>
            </div>
            <div>
              <p className="section-label">Interés</p>
              <p className="mt-0.5 text-base font-bold tabular-nums text-gold-600 dark:text-gold-300">{formatCRC(totales.interes)}</p>
            </div>
            <div>
              <p className="section-label">Cobros</p>
              <p className="mt-0.5 text-base font-bold tabular-nums text-navy-900 dark:text-white">{totales.count}</p>
            </div>
            <div>
              <p className="section-label">Clientes</p>
              <p className="mt-0.5 text-base font-bold tabular-nums text-navy-900 dark:text-white">{grupos.length}</p>
            </div>
          </div>
          <ul className="mt-3 space-y-1.5">
            {validacion.checks.map((c) => (
              <li key={c.id} className="flex items-center gap-2 text-sm">
                {c.ok ? (
                  <BadgeCheck className="h-4 w-4 shrink-0 text-success-600 dark:text-success-500" aria-hidden="true" />
                ) : (
                  <BadgeX className="h-4 w-4 shrink-0 text-danger-600 dark:text-danger-500" aria-hidden="true" />
                )}
                <span className="font-medium text-navy-800 dark:text-navy-100">{c.label}</span>
                <span className="ml-auto shrink-0 text-xs tabular-nums text-neutral-500 dark:text-navy-300">{c.detalle}</span>
              </li>
            ))}
          </ul>
          {!validacion.ok && (
            <div className="mt-3">
              <Alert tone="danger" title="Las cuentas no cuadran">
                Revisá los cobros del mes: hay una diferencia entre los totales y el detalle por cliente.
              </Alert>
            </div>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 dark:border-white/10">
            <button
              type="button"
              onClick={handleExport}
              disabled={totales.count === 0}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-input bg-navy-900 px-4 py-2 text-xs font-bold text-white disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-gold-500 dark:text-navy-900 dark:focus-visible:ring-offset-black"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              Exportar CSV del mes
            </button>
            <span className="text-xs text-neutral-500 dark:text-navy-300">
              {validacion.ok ? 'Cuentas verificadas: todo cuadra.' : 'Hay descuadres pendientes de revisión.'}
            </span>
          </div>
        </Card>
      </section>
    </div>
  );
}
