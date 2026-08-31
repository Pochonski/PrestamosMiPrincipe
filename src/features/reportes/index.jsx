import { BarChart3, MapPin } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { SectionTitle } from '../../components/ui/SectionTitle';
import { BarChart } from './components/BarChart';
import { DonutChart } from './components/DonutChart';
import { HorizontalBars } from './components/HorizontalBars';
import { useReportesData } from './selectors';
import { formatCRC } from '../../lib/format';

export function ReportesPage() {
  const data = useReportesData();

  const totalCobros6m = data.cobrosPorMes.reduce((s, x) => s + x.value, 0);
  const prestamosPorEstadoTotal = data.prestamosPorEstado.reduce((s, x) => s + x.value, 0);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5 sm:gap-6">
      <header>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-navy-900 sm:text-2xl dark:text-white">
              Reportes
            </h1>
            <p className="mt-0.5 text-sm text-slate-600 dark:text-navy-300">
              Visualizaciones del estado del negocio.
            </p>
          </div>
        </div>
      </header>

      <section className="space-y-3">
        <SectionTitle title="Cobros por mes" />
        <Card className="p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-slate-600 dark:text-navy-300">
              Últimos 6 meses · total {formatCRC(totalCobros6m)}
            </p>
          </div>
          <BarChart data={data.cobrosPorMes} />
        </Card>
      </section>

      <section className="space-y-3">
        <SectionTitle title="Préstamos por estado" />
        <Card className="p-4 sm:p-5">
          {prestamosPorEstadoTotal === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500 dark:text-navy-300">
              Sin préstamos registrados.
            </p>
          ) : (
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-around">
              <DonutChart data={data.prestamosPorEstado} total={prestamosPorEstadoTotal} />
              <ul className="space-y-3 self-center sm:self-stretch">
                {data.prestamosPorEstado.map((d) => {
                  const pct = Math.round((d.value / prestamosPorEstadoTotal) * 100);
                  return (
                    <li key={d.label} className="flex items-center gap-3">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: d.color }}
                        aria-hidden="true"
                      />
                      <span className="text-sm font-semibold text-navy-700 dark:text-navy-100">
                        {d.label}
                      </span>
                      <span className="text-sm tabular-nums text-slate-600 dark:text-navy-300">
                        {d.value}
                      </span>
                      <span className="text-xs tabular-nums text-slate-400 dark:text-navy-300">
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
          {data.distribucionRuta.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500 dark:text-navy-300">
              Sin rutas registradas.
            </p>
          ) : (
            <div className="mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-slate-400 dark:text-navy-300" />
              <p className="text-sm text-slate-600 dark:text-navy-300">
                Top {data.distribucionRuta.length} {data.distribucionRuta.length === 1 ? 'ruta' : 'rutas'} por cantidad de préstamos
              </p>
            </div>
          )}
          <HorizontalBars data={data.distribucionRuta} />
        </Card>
      </section>
    </div>
  );
}

export default ReportesPage;