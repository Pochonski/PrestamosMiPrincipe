import React from 'react';
import { Wallet } from 'lucide-react';
import { Input } from '../../../../components/ui/Input';
import { IconBox } from '../../../../components/ui/IconBox';
import { formatCRC } from '../../../../lib/format';

export function Step2Monto({ values, errors, showError, set, touch }) {
  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3">
        <IconBox icon={Wallet} tone="gold" size="md" />
        <div>
          <h2 className="text-lg font-bold text-navy-900 dark:text-white">Monto prestado</h2>
          <p className="text-xs text-neutral-500 dark:text-navy-300">
            Capital que el cliente recibe.
          </p>
        </div>
      </header>

      <Input
        type="text"
        name="monto"
        size="lg"
        label={
          <>
            Capital <span className="text-danger-500">*</span>
          </>
        }
        hint="en colones (₡)"
        prefix="₡"
        inputMode="numeric"
        value={values.monto}
        onChange={(e) => set('monto', e.target.value)}
        onBlur={() => touch('monto')}
        placeholder="0"
        error={showError('monto') && errors.monto}
        className="!text-2xl !font-bold !tabular-nums"
      />

      <div className="rounded-card border border-slate-200 bg-slate-50 p-4 dark:border-navy-700 dark:bg-navy-700/40">
        <p className="text-xs text-neutral-600 dark:text-navy-300">
          El cliente recibe este monto al iniciar el préstamo. Los cobros periódicos son solo por
          intereses (los definís en el siguiente paso).
        </p>
        {values.monto && !errors.monto && (
          <p className="mt-2 text-2xl font-bold tabular-nums text-navy-900 dark:text-white">
            {formatCRC(Number(String(values.monto).replace(/\D/g, '')))}
          </p>
        )}
      </div>
    </div>
  );
}
