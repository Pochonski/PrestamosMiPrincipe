import React from 'react';
import { useEffect, useState } from 'react';
import { BadgePercent, Wallet, Hourglass, PiggyBank } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { IconBox } from '../../components/ui/IconBox';
import { Skeleton } from '../../components/ui/Skeleton';
import { SectionTitle } from '../../components/ui/SectionTitle';
import { formatCRC } from '../../lib/format';
import { useDataChange } from '../../lib/hooks/useDataChange';
import * as prestamosService from '../../services/prestamos';
import * as cobrosService from '../../services/cobros';
import * as clientesService from '../../services/clientes';
import { resumenComisiones } from './selectors';

export function ComisionesPage({ onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [resumen, setResumen] = useState(null);
  const [clientes, setClientes] = useState(new Map());

  async function load() {
    try {
      const [prestamos, cobros, cls] = await Promise.all([
        prestamosService.listAll(),
        cobrosService.listAll(),
        clientesService.list({ limit: 500, offset: 0 }).catch(() => []),
      ]);
      setResumen(resumenComisiones({ prestamos, cobros }));
      setClientes(new Map((cls || []).map((c) => [c.id, c.nombre])));
    } catch {
      // Se mantiene lo último cargado.
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useDataChange(() => {
    load();
  });

  if (loading && !resumen) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 sm:gap-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const r = resumen || { cobrada: 0, acreedorCobrada: 0, porCobrar: 0, total: 0, porPrestamo: [], conComision: 0, sinComision: 0 };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 sm:gap-6">
      <div>
        <h1 className="font-display text-xl font-bold tracking-tight text-navy-900 sm:text-2xl dark:text-white">
          Mis comisiones
        </h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-navy-300">
          Diferencia entre la tasa del cliente y la del acreedor, solo sobre intereses cobrados.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiTile icon={Wallet} label="Comisión cobrada" value={formatCRC(r.cobrada)} sub={`Acreedor cobró ${formatCRC(r.acreedorCobrada)}`} tone="gold" />
        <KpiTile icon={Hourglass} label="Por cobrar" value={formatCRC(r.porCobrar)} sub="En cuotas pendientes" tone="sky" />
        <KpiTile icon={PiggyBank} label="Total (cobrada + por cobrar)" value={formatCRC(r.total)} sub={`${r.conComision} préstamo(s) con comisión`} tone="emerald" />
      </div>

      <section className="space-y-2">
        <SectionTitle title={`Por préstamo (${r.porPrestamo.length})`} />
        {r.porPrestamo.length === 0 ? (
          <EmptyState
            icon={BadgePercent}
            title="Sin comisiones configuradas"
            description="Editá un préstamo y cargá la tasa del acreedor para empezar a ver tu comisión."
          />
        ) : (
          <Card className="divide-y divide-slate-100 p-0 dark:divide-white/10">
            {r.porPrestamo.map((row) => (
              <button
                key={row.prestamoId}
                type="button"
                onClick={() => onNavigate?.('prestamo-detalle', { prestamoId: row.prestamoId, clienteId: row.clienteId })}
                className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold-400 dark:hover:bg-navy-700/40"
              >
                <IconBox icon={BadgePercent} tone="gold" size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-navy-900 dark:text-white">
                    {clientes.get(row.clienteId) || row.ruta || 'Préstamo'}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-navy-300">
                    Base {row.tasaBase}% + comisión {row.tasaComision}% · {row.pendientes} pendiente(s)
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold tabular-nums text-gold-600 dark:text-gold-300">
                    {formatCRC(row.cobrada)}
                  </p>
                  <p className="text-[11px] tabular-nums text-neutral-500 dark:text-navy-300">
                    +{formatCRC(row.porCobrar)} por cobrar
                  </p>
                </div>
              </button>
            ))}
          </Card>
        )}
        {r.sinComision > 0 && (
          <p className="text-xs text-neutral-500 dark:text-navy-300">
            {r.sinComision} préstamo(s) sin tasa de acreedor (sin comisión).
          </p>
        )}
      </section>
    </div>
  );
}

function KpiTile({ icon: Icon, label, value, sub, tone }) {
  const toneMap = { gold: 'gold', emerald: 'emerald', sky: 'sky' };
  return (
    <Card padding="sm" hover>
      <div className="flex items-start gap-3">
        <IconBox icon={Icon} tone={toneMap[tone] || 'gold'} size="md" />
        <div className="min-w-0 flex-1">
          <p className="section-label">{label}</p>
          <p className="mt-0.5 text-base font-bold tabular-nums text-navy-900 dark:text-white sm:text-lg">
            {value}
          </p>
          {sub && <p className="mt-0.5 text-[10px] text-neutral-500 dark:text-navy-300">{sub}</p>}
        </div>
      </div>
    </Card>
  );
}

export default ComisionesPage;
