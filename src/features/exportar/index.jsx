import { useEffect, useState } from 'react';
import { Download, FileText, Users, Wallet, HandCoins, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { Card } from '../../components/ui/Card';
import { SectionTitle } from '../../components/ui/SectionTitle';
import { showToast } from '../../components/ui/Toast';
import { onDataChanged } from '../../lib/events';
import { exportCSV, getCounts } from './selectors';

const OPCIONES = [
  {
    id: 'clientes',
    label: 'Clientes',
    description: 'Listado completo de clientes registrados',
    icon: Users,
    tone: 'navy',
  },
  {
    id: 'prestamos',
    label: 'Préstamos',
    description: 'Todos los préstamos con saldo y cuotas',
    icon: Wallet,
    tone: 'gold',
  },
  {
    id: 'cobros',
    label: 'Cobros',
    description: 'Historial completo de cobros realizados',
    icon: HandCoins,
    tone: 'emerald',
  },
];

export function ExportarPage() {
  const [counts, setCounts] = useState(null);
  const [exporting, setExporting] = useState(null);

  async function refresh() {
    try {
      const c = await getCounts();
      setCounts(c);
    } catch {
      setCounts({ clientes: 0, prestamos: 0, cobros: 0 });
    }
  }

  useEffect(() => {
    refresh();
    return onDataChanged(refresh);
  }, []);

  async function handleExport(tipo) {
    setExporting(tipo);
    try {
      const n = await exportCSV(tipo);
      showToast(`${n} ${n === 1 ? 'registro exportado' : 'registros exportados'}`, 'success');
    } catch {
      showToast('Error al exportar', 'error');
    } finally {
      setExporting(null);
    }
  }

  if (!counts) {
    return (
      <div className="mx-auto flex max-w-3xl items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 sm:gap-6">
      <header>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
            <Download className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-navy-900 sm:text-2xl dark:text-white">
              Exportar a Excel
            </h1>
            <p className="mt-0.5 text-sm text-slate-600 dark:text-navy-300">
              Descarga tus datos en formato CSV (compatible con Excel y Google Sheets).
            </p>
          </div>
        </div>
      </header>

      <Card className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300">
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-navy-900 dark:text-white">
              Formato CSV
            </p>
            <p className="mt-1 text-xs text-slate-600 dark:text-navy-300">
              Cada descarga genera un archivo <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px] dark:bg-navy-700">.csv</code> con codificación UTF-8.
              Abrilo directamente en Excel o Google Sheets. Los archivos respetan el formato estándar CSV (separador coma, comillas escapadas).
            </p>
          </div>
        </div>
      </Card>

      <section className="space-y-3">
        <SectionTitle title="¿Qué querés exportar?" />
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {OPCIONES.map((opt) => {
            const Icon = opt.icon;
            const count = counts[opt.id] || 0;
            const disabled = count === 0;
            return (
              <li key={opt.id} className="animate-fade-in">
                  <button
                    type="button"
                    onClick={() => !disabled && handleExport(opt.id)}
                    disabled={disabled || exporting !== null}
                  className={clsx(
                    'group flex w-full flex-col items-start gap-3 rounded-2xl border p-4 text-left transition-all',
                    disabled
                      ? 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-50 dark:border-navy-700 dark:bg-navy-800/50'
                      : 'cursor-pointer border-slate-200 bg-white hover:border-gold-400 hover:shadow-cardHover dark:border-navy-700 dark:bg-navy-800 dark:hover:border-gold-400',
                  )}
                >
                  <div
                    className={clsx(
                      'flex h-10 w-10 items-center justify-center rounded-xl',
                      opt.tone === 'navy' && 'bg-navy-50 text-navy-700 dark:bg-navy-700/50 dark:text-navy-100',
                      opt.tone === 'gold' && 'bg-gold-50 text-gold-600 dark:bg-gold-500/10 dark:text-gold-300',
                      opt.tone === 'emerald' && 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300',
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="w-full">
                    <p className="text-sm font-bold text-navy-900 dark:text-white">
                      {opt.label}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-navy-300">
                      {opt.description}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-navy-300">
                        {count} {count === 1 ? 'registro' : 'registros'}
                      </span>
                      <span
                        className={clsx(
                          'inline-flex items-center gap-1 text-xs font-bold',
                          disabled
                            ? 'text-slate-400 dark:text-navy-300'
                            : 'text-gold-600 dark:text-gold-300 group-hover:underline',
                        )}
                      >
                        {exporting === opt.id ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Exportando...
                          </>
                        ) : (
                          <>
                            <Download className="h-3.5 w-3.5" />
                            Descargar CSV
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

export default ExportarPage;