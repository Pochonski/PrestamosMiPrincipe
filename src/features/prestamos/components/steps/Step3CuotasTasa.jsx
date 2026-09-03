import React from 'react';
import { Hash, Percent, Calculator } from 'lucide-react';
import { Input } from '../../../../components/ui/Input';
import { IconBox } from '../../../../components/ui/IconBox';
import { formatCRC } from '../../../../lib/format';

export function Step3CuotasTasa({ values, errors, showError, set, touch }) {
  const capital = Number(String(values.monto).replace(/\D/g, ''));
  const tasa = Number(values.tasa);
  const nCuotas = Number(values.nCuotas);

  const cuota = capital > 0 && tasa > 0 ? Math.round((capital * tasa) / 100) : 0;
  const totalIntereses = cuota * (nCuotas || 0);
  const totalAPagar = capital + totalIntereses;
  const showPreview = capital > 0 && tasa > 0 && nCuotas > 0;

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3">
        <IconBox icon={Hash} tone="gold" size="md" />
        <div>
          <h2 className="text-lg font-bold text-navy-900 dark:text-white">Cuotas y tasa</h2>
          <p className="text-xs text-neutral-500 dark:text-navy-300">
            Duración del préstamo y costo por período.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Input
          type="text"
          name="nCuotas"
          size="lg"
          label={
            <>
              N° de cuotas <span className="text-danger-500">*</span>
            </>
          }
          icon={Hash}
          inputMode="numeric"
          maxLength={3}
          value={values.nCuotas}
          onChange={(e) => set('nCuotas', e.target.value)}
          onBlur={() => touch('nCuotas')}
          placeholder="6"
          error={showError('nCuotas') && errors.nCuotas}
        />

        <Input
          type="text"
          name="tasa"
          size="lg"
          label={
            <>
              Tasa (% por cuota) <span className="text-danger-500">*</span>
            </>
          }
          icon={Percent}
          trailing={<Percent className="h-4 w-4 text-neutral-400 dark:text-navy-300" aria-hidden="true" />}
          inputMode="decimal"
          value={values.tasa}
          onChange={(e) => set('tasa', e.target.value)}
          onBlur={() => touch('tasa')}
          placeholder="8"
          error={showError('tasa') && errors.tasa}
        />
      </div>

      <div className="rounded-card border border-slate-200 bg-slate-50 p-4 dark:border-navy-700 dark:bg-navy-700/40">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-navy-300">
          <Calculator className="h-3.5 w-3.5" aria-hidden="true" />
          Cálculo automático
        </div>
        {showPreview ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <PreviewItem label="Cuota por período" value={formatCRC(cuota)} highlight />
            <PreviewItem label="Total intereses" value={formatCRC(totalIntereses)} />
            <PreviewItem label="Total a pagar" value={formatCRC(totalAPagar)} />
          </div>
        ) : (
          <p className="text-sm text-neutral-500 dark:text-navy-300">
            Completá los campos para ver el cálculo.
          </p>
        )}
      </div>
    </div>
  );
}

function PreviewItem({ label, value, highlight }) {
  return (
    <div className="rounded-input bg-white p-3 dark:bg-navy-800">
      <p className="section-label">{label}</p>
      <p
        className={
          highlight
            ? 'mt-1 text-lg font-bold tabular-nums text-gold-600 dark:text-gold-300'
            : 'mt-1 text-lg font-bold tabular-nums text-navy-900 dark:text-white'
        }
      >
        {value}
      </p>
    </div>
  );
}
