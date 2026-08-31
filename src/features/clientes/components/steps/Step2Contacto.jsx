import { Phone, IdCard } from 'lucide-react';
import clsx from 'clsx';
import { Field } from './Step1Identidad';

const inputBase = clsx(
  'w-full rounded-xl border bg-white px-3.5 py-3 text-base outline-none transition-colors',
  'placeholder:text-slate-400 dark:placeholder:text-navy-300',
  'text-navy-900 dark:text-white tabular-nums',
  'border-slate-200 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20',
  'dark:bg-navy-800 dark:border-navy-700 dark:focus:border-gold-400',
);

export function Step2Contacto({ values, errors, showError, set, touch }) {
  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300">
          <Phone className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-navy-900 dark:text-white">Contacto</h2>
          <p className="text-xs text-slate-500 dark:text-navy-300">
            Teléfono y cédula del cliente.
          </p>
        </div>
      </header>

      <Field label="Teléfono" hint="8 dígitos" required error={showError('telefono') && errors.telefono}>
        <div className="relative">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-slate-400 dark:text-navy-300">
            +506
          </span>
          <input
            type="tel"
            inputMode="numeric"
            pattern="[0-9]{8}"
            maxLength={9}
            value={values.telefono}
            onChange={(e) => set('telefono', e.target.value)}
            onBlur={() => touch('telefono')}
            placeholder="8888-7777"
            className={clsx(inputBase, 'pl-14', showError('telefono') && errors.telefono && 'border-rose-400 focus:border-rose-400 focus:ring-rose-400/20')}
          />
        </div>
      </Field>

      <Field
        label="Cédula"
        hint="Formato: 1-0823-0445"
        required
        error={showError('cedula') && errors.cedula}
      >
        <div className="relative">
          <IdCard className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 dark:text-navy-300" />
          <input
            type="text"
            inputMode="numeric"
            value={values.cedula}
            onChange={(e) => set('cedula', e.target.value)}
            onBlur={() => touch('cedula')}
            placeholder="1-0823-0445"
            maxLength={12}
            className={clsx(inputBase, 'pl-11', showError('cedula') && errors.cedula && 'border-rose-400 focus:border-rose-400 focus:ring-rose-400/20')}
          />
        </div>
      </Field>
    </div>
  );
}