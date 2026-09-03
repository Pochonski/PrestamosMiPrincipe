import React from 'react';
import { useEffect, useState } from 'react';
import { Download, FileText, Users, Wallet, HandCoins } from 'lucide-react';
import clsx from 'clsx';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { IconBox } from '../../components/ui/IconBox';
import { Spinner } from '../../components/ui/Spinner';
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
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 sm:gap-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 sm:gap-6">
      <header>
        <div className="flex items-center gap-3">
          <IconBox icon={Download} tone="emerald" size="md" />
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-navy-900 sm:text-2xl dark:text-white">
              Exportar a Excel
            </h1>
            <p className="mt-0.5 text-sm text-neutral-600 dark:text-navy-300">
              Descarga tus datos en formato CSV (compatible con Excel y Google Sheets).
            </p>
          </div>
        </div>
      </header>

      <Card className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <IconBox icon={FileText} tone="info" size="sm" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-navy-900 dark:text-white">Formato CSV</p>
            <p className="mt-1 text-xs text-neutral-600 dark:text-navy-300">
              Cada descarga genera un archivo{' '}
              <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px] dark:bg-navy-700">
                .csv
              </code>{' '}
              con codificación UTF-8. Abrilo directamente en Excel o Google Sheets. Los archivos
              respetan el formato estándar CSV (separador coma, comillas escapadas).
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
                    'group flex w-full flex-col items-start gap-3 rounded-card border p-4 text-left transition-all',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-navy-900',
                    disabled
                      ? 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-50 dark:border-navy-700 dark:bg-navy-800/50'
                      : 'cursor-pointer border-slate-200 bg-white hover:-translate-y-0.5 hover:border-gold-400 hover:shadow-cardHover dark:border-navy-700 dark:bg-navy-800 dark:hover:border-gold-400',
                  )}
                >
                  <IconBox icon={Icon} tone={opt.tone} size="md" />
                  <div className="w-full">
                    <p className="text-sm font-bold text-navy-900 dark:text-white">{opt.label}</p>
                    <p className="mt-0.5 text-xs text-neutral-500 dark:text-navy-300">
                      {opt.description}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="section-label">
                        {count} {count === 1 ? 'registro' : 'registros'}
                      </span>
                      <span
                        className={clsx(
                          'inline-flex items-center gap-1 text-xs font-bold',
                          disabled
                            ? 'text-neutral-400 dark:text-navy-300'
                            : 'text-gold-600 dark:text-gold-300 group-hover:underline',
                        )}
                      >
                        {exporting === opt.id ? (
                          <>
                            <Spinner size="sm" tone="gold" />
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
