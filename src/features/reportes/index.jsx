import React from 'react';
import { BarChart3, MapPin } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { IconBox } from '../../components/ui/IconBox';
import { SectionTitle } from '../../components/ui/SectionTitle';
import { BarChart } from './components/BarChart';
import { DonutChart } from './components/DonutChart';
import { HorizontalBars } from './components/HorizontalBars';
import { useReportesData } from './selectors';
import { formatCRC } from '../../lib/format';

const EMPTY = {
  cobrosPorMes: [],
  prestamosPorEstado: [],
  distribucionRuta: [],
  totalPrestamos: 0,
};

const DONUT_COLOR_MAP = {
  vigente: '#10B981',
  atrasado: '#F43F5E',
  cancelado: '#94A3B8',
  completado: '#0EA5E9',
};

export function ReportesPage() {
  const { data, loading } = useReportesData();

  if (loading || !data) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 sm:gap-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const safe = data && data.cobrosPorMes ? data : EMPTY;
  const totalCobros6m = safe.cobrosPorMes.reduce((s, x) => s + x.value, 0);
  const prestamosPorEstadoTotal = safe.prestamosPorEstado.reduce((s, x) => s + x.value, 0);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 sm:gap-6">
      <header>
        <div className="flex items-center gap-3">
          <IconBox icon={BarChart3} tone="info" size="md" />
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-navy-900 sm:text-2xl dark:text-white">
              Reportes
            </h1>
            <p className="mt-0.5 text-sm text-neutral-600 dark:text-navy-300">
              Visualizaciones del estado del negocio.
            </p>
          </div>
        </div>
      </header>

      <section className="space-y-3">
        <SectionTitle title="Cobros por mes" />
        <Card className="p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-neutral-600 dark:text-navy-300">
              Últimos 6 meses · total {formatCRC(totalCobros6m)}
            </p>
          </div>
          <BarChart data={safe.cobrosPorMes} />
        </Card>
      </section>

      <section className="space-y-3">
        <SectionTitle title="Préstamos por estado" />
        <Card className="p-4 sm:p-5">
          {prestamosPorEstadoTotal === 0 ? (
            <p className="py-10 text-center text-sm text-neutral-500 dark:text-navy-300">
              Sin préstamos registrados.
            </p>
          ) : (
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-around">
              <DonutChart
                data={safe.prestamosPorEstado}
                total={prestamosPorEstadoTotal}
                colorMap={DONUT_COLOR_MAP}
              />
              <ul className="space-y-3 self-center sm:self-stretch">
                {safe.prestamosPorEstado.map((d) => {
                  const pct = Math.round((d.value / prestamosPorEstadoTotal) * 100);
                  return (
                    <li key={d.label} className="flex items-center gap-3">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: DONUT_COLOR_MAP[d.label] || d.color }}
                        aria-hidden="true"
                      />
                      <span className="text-sm font-semibold text-navy-700 dark:text-navy-100">
                        {d.label}
                      </span>
                      <span className="text-sm tabular-nums text-neutral-600 dark:text-navy-300">
                        {d.value}
                      </span>
                      <span className="text-xs tabular-nums text-neutral-400 dark:text-navy-300">
                        ({pct}%)
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </Card>
      </section>

      <section className="space-y-3">
        <SectionTitle title="Distribución por ruta" />
        <Card className="p-4 sm:p-5">
          {safe.distribucionRuta.length === 0 ? (
            <p className="py-10 text-center text-sm text-neutral-500 dark:text-navy-300">
              Sin rutas registradas.
            </p>
          ) : (
            <div className="mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-neutral-400 dark:text-navy-300" aria-hidden="true" />
              <p className="text-sm text-neutral-600 dark:text-navy-300">
                Top {safe.distribucionRuta.length}{' '}
                {safe.distribucionRuta.length === 1 ? 'ruta' : 'rutas'} por cantidad de préstamos
              </p>
            </div>
          )}
          <HorizontalBars data={safe.distribucionRuta} />
        </Card>
      </section>
    </div>
  );
}

export default ReportesPage;
