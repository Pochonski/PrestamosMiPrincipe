import { User } from 'lucide-react';
import clsx from 'clsx';

export function Field({ label, hint, error, children, required }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between text-sm font-medium text-navy-700 dark:text-navy-100">
        <span>
          {label}
          {required && <span className="ml-0.5 text-rose-500">*</span>}
        </span>
        {hint && <span className="text-[10px] font-normal text-slate-400 dark:text-navy-300">{hint}</span>}
      </span>
      {children}
      {error && (
        <p className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}
    </label>
  );
}

const inputBase = clsx(
  'w-full rounded-xl border bg-white px-3.5 py-3 text-base outline-none transition-colors',
  'placeholder:text-slate-400 dark:placeholder:text-navy-300',
  'text-navy-900 dark:text-white',
  'border-slate-200 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20',
  'dark:bg-navy-800 dark:border-navy-700 dark:focus:border-gold-400',
);

export function Step1Identidad({ values, errors, showError, set, touch }) {
  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-50 text-gold-500 dark:bg-gold-500/10 dark:text-gold-300">
          <User className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-navy-900 dark:text-white">Identidad</h2>
          <p className="text-xs text-slate-500 dark:text-navy-300">
            Nombre completo y dirección del cliente.
          </p>
        </div>
      </header>

      <Field label="Nombre completo" required error={showError('nombre') && errors.nombre}>
        <input
          type="text"
          autoComplete="name"
          autoCapitalize="words"
          value={values.nombre}
          onChange={(e) => set('nombre', e.target.value)}
          onBlur={() => touch('nombre')}
          placeholder="Ej: María Solís Rodríguez"
          className={clsx(inputBase, showError('nombre') && errors.nombre && 'border-rose-400 focus:border-rose-400 focus:ring-rose-400/20')}
        />
      </Field>

      <Field label="Dirección" required error={showError('direccion') && errors.direccion}>
        <textarea
          rows={3}
          value={values.direccion}
          onChange={(e) => set('direccion', e.target.value)}
          onBlur={() => touch('direccion')}
          placeholder="Provincia, cantón, distrito y dirección exacta"
          className={clsx(inputBase, 'resize-none', showError('direccion') && errors.direccion && 'border-rose-400 focus:border-rose-400 focus:ring-rose-400/20')}
        />
      </Field>
    </div>
  );
}